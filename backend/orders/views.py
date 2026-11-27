import uuid
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes as perm
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from listings.models import Listing, PreHarvestPlan
from .models import Order, Rating, SubscriptionOrder
from .serializers import (
    DELIVERY_FEES,
    OrderSerializer,
    OrderCreateSerializer,
    PreorderCreateSerializer,
    RatingSerializer,
    SubscriptionOrderSerializer,
)


def _is_admin(user):
    return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin"))


class OrderViewSet(viewsets.ModelViewSet):
    """
    /api/v1/orders/
    Direct PUT/PATCH/DELETE is disabled so status & pricing cannot be tampered with.
    """
    serializer_class = OrderSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        if _is_admin(user):
            return Order.objects.all().select_related("buyer", "seller", "rating", "listing", "harvest_plan")
        if user.role == "seller":
            return Order.objects.filter(seller=user).select_related("buyer", "rating", "listing", "harvest_plan")
        return Order.objects.filter(buyer=user).select_related("seller", "rating", "listing", "harvest_plan")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        listing_obj = Listing.objects.select_for_update().get(pk=serializer.validated_data["listing"].pk)
        qty = serializer.validated_data["quantity"]
        if listing_obj.seller == self.request.user:
            raise ValidationError({"listing": "You cannot order your own listing."})
        if listing_obj.quantity < qty:
            raise ValidationError({"quantity": f"Only {listing_obj.quantity} {listing_obj.unit} available in stock."})

        mode = serializer.validated_data.get("delivery_mode") or Order.DeliveryMode.MOTORCYCLE
        fee = DELIVERY_FEES.get(mode, 0)

        order = serializer.save(
            buyer=self.request.user,
            seller=listing_obj.seller,
            listing=listing_obj,
            item_name=listing_obj.name,
            unit=listing_obj.unit,
            price_per_unit=listing_obj.price,
            delivery_mode=mode,
            delivery_fee=fee,
            order_type="order",
        )
        listing_obj.quantity = max(0, listing_obj.quantity - order.quantity)
        listing_obj.save(update_fields=["quantity"])
        from django.core.cache import cache
        cache.clear()

        from notifications.sms import send_sms
        send_sms(order.seller.phone, f"New Order: {order.quantity} {listing_obj.unit} of {listing_obj.name} ordered by {order.buyer.name}.")

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.seller != request.user and not _is_admin(request.user):
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        if order.status != "placed":
            return Response({"error": f"Cannot accept order in status '{order.status}'"}, status=status.HTTP_400_BAD_REQUEST)
        order.status = "accepted"
        order.accepted_at = timezone.now()
        order.save(update_fields=["status", "accepted_at"])

        from notifications.sms import send_sms
        send_sms(order.buyer.phone, f"Your order for {order.item_name} has been accepted by {order.seller.name}.")
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def dispatch(self, request, pk=None):
        order = self.get_object()
        if order.seller != request.user and not _is_admin(request.user):
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in ["placed", "accepted"]:
            return Response({"error": f"Cannot dispatch order in status '{order.status}'"}, status=status.HTTP_400_BAD_REQUEST)
        order.status = "out_for_delivery"
        mode = request.data.get("delivery_mode")
        if mode in [c[0] for c in Order.DeliveryMode.choices]:
            order.delivery_mode = mode
        order.save(update_fields=["status", "delivery_mode"])

        from notifications.sms import send_sms
        send_sms(order.buyer.phone, f"Your order for {order.item_name} is on the way via {order.delivery_mode}.")
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def deliver(self, request, pk=None):
        """Only the buyer (confirming receipt) or a platform admin can release escrow."""
        order = self.get_object()
        if order.buyer != request.user and not _is_admin(request.user):
            return Response(
                {"error": "Only the buyer or an administrator can confirm delivery and release escrow."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if order.status not in ["placed", "accepted", "out_for_delivery"]:
            return Response({"error": f"Order in status '{order.status}' cannot be marked as delivered."}, status=status.HTTP_400_BAD_REQUEST)
        if order.disputes.filter(status="open").exists():
            return Response({"error": "Cannot release escrow while an open dispute exists."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = "delivered"
        order.delivered_at = timezone.now()
        order.save(update_fields=["status", "delivered_at"])

        from payments.models import Payment, Payout, PlatformSettings
        payment = Payment.objects.filter(order=order, status="held").first()
        net_amount = 0
        if payment:
            payment.status = "released"
            payment.save(update_fields=["status"])

            settings_obj = PlatformSettings.load()
            commission_rate = settings_obj.commission_rate
            gross_amount = payment.amount
            commission_amount = int(gross_amount * (commission_rate / 100))
            net_amount = gross_amount - commission_amount

            Payout.objects.get_or_create(
                order=order,
                defaults={
                    "seller": order.seller,
                    "gross_amount": gross_amount,
                    "commission_rate": commission_rate,
                    "commission_amount": commission_amount,
                    "net_amount": net_amount,
                    "status": "sent",
                    "payout_phone": order.seller.phone or "",
                    "sent_at": timezone.now(),
                },
            )

        from notifications.sms import send_sms
        send_sms(order.buyer.phone, f"Your order for {order.item_name} is marked delivered.")
        if payment and order.seller.phone:
            send_sms(order.seller.phone, f"Order {order.id} confirmed. Payout of UGX {net_amount:,} initiated.")
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def rate(self, request, pk=None):
        order = self.get_object()
        if order.buyer != request.user:
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        if order.status != "delivered":
            return Response({"error": "Can only rate delivered orders"}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(order, "rating"):
            return Response({"error": "Already rated"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            stars = int(request.data.get("stars", 5))
        except (TypeError, ValueError):
            return Response({"error": "Stars must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        if stars < 1 or stars > 5:
            return Response({"error": "Stars must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

        rating = Rating.objects.create(
            order=order,
            buyer=request.user,
            seller=order.seller,
            stars=stars,
            comment=str(request.data.get("comment", ""))[:1000],
        )
        return Response(RatingSerializer(rating).data, status=status.HTTP_201_CREATED)


class RatingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        seller_id = self.request.query_params.get("seller")
        if seller_id:
            return Rating.objects.filter(seller_id=seller_id).select_related("buyer", "seller", "order")
        user = self.request.user
        if not user.is_authenticated:
            return Rating.objects.none()
        if user.role == "seller":
            return Rating.objects.filter(seller=user).select_related("buyer", "seller", "order")
        if user.role == "buyer":
            return Rating.objects.filter(buyer=user).select_related("buyer", "seller", "order")
        return Rating.objects.all().select_related("buyer", "seller", "order")

    @action(detail=False, methods=["get"])
    def summary(self, request):
        from accounts.models import User
        from django.db.models import Avg, Count

        seller_id = request.query_params.get("seller")
        seller = None
        if seller_id:
            seller = User.objects.filter(id=seller_id).first()
        elif request.user.is_authenticated and request.user.role == "seller":
            seller = request.user

        qs = Rating.objects.all()
        if seller:
            qs = qs.filter(seller=seller)

        agg = qs.aggregate(avg=Avg("stars"), count=Count("id"))
        repeat_buyers = qs.values("buyer").annotate(c=Count("id")).filter(c__gt=1).count() if seller else 0
        total_unique_buyers = qs.values("buyer").distinct().count() if seller else 0

        return Response({
            "avg_rating": round(agg["avg"] or 0, 1),
            "total_reviews": agg["count"] or 0,
            "repeat_buyers": repeat_buyers,
            "total_buyers": total_unique_buyers,
        })


@api_view(["POST"])
@perm([permissions.IsAuthenticated])
@transaction.atomic
def create_preorder(request):
    serializer = PreorderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    plan = PreHarvestPlan.objects.select_for_update().get(pk=serializer.validated_data["harvest_plan"].pk)
    qty = serializer.validated_data["quantity"]
    if plan.seller == request.user:
        return Response({"error": "You cannot reserve your own harvest plan."}, status=status.HTTP_400_BAD_REQUEST)
    if plan.available < qty:
        return Response({"error": f"Only {plan.available} {plan.unit} available."}, status=status.HTTP_400_BAD_REQUEST)

    order = serializer.save(
        buyer=request.user,
        seller=plan.seller,
        harvest_plan=plan,
        item_name=plan.name,
        unit=plan.unit,
        price_per_unit=plan.price,
        deposit_percentage=plan.deposit_percentage,
        order_type="preorder",
        status="reserved",
    )
    plan.reserved += order.quantity
    plan.save(update_fields=["reserved"])
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@perm([permissions.IsAuthenticated])
@transaction.atomic
def batch_checkout(request):
    """
    POST /api/v1/orders/batch-checkout/
    Atomically creates orders for an entire cart + returns a single combined total & batch_ref.
    """
    items = request.data.get("items") or []
    delivery_mode = request.data.get("delivery_mode") or Order.DeliveryMode.MOTORCYCLE
    if delivery_mode not in [c[0] for c in Order.DeliveryMode.choices]:
        return Response({"error": "Invalid delivery mode."}, status=status.HTTP_400_BAD_REQUEST)
    if not items:
        return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

    batch_ref = f"BATCH-{uuid.uuid4().hex[:10].upper()}"
    created_orders = []
    seen_sellers = set()
    total_amount = 0

    for entry in items:
        listing_id = entry.get("listing")
        try:
            qty = int(entry.get("quantity", 0))
        except (TypeError, ValueError):
            return Response({"error": "Invalid quantity."}, status=status.HTTP_400_BAD_REQUEST)
        if not listing_id or qty <= 0:
            return Response({"error": "Each item requires a valid listing and positive quantity."}, status=status.HTTP_400_BAD_REQUEST)

        listing_obj = Listing.objects.select_for_update().filter(pk=listing_id, is_active=True).first()
        if not listing_obj:
            return Response({"error": f"Listing {listing_id} not found."}, status=status.HTTP_404_NOT_FOUND)
        if listing_obj.seller == request.user:
            return Response({"error": "You cannot order your own listing."}, status=status.HTTP_400_BAD_REQUEST)
        if listing_obj.quantity < qty:
            return Response({"error": f"Only {listing_obj.quantity} {listing_obj.unit} of {listing_obj.name} left."}, status=status.HTTP_400_BAD_REQUEST)

        # Charge delivery fee once per unique seller in the batch
        fee = DELIVERY_FEES.get(delivery_mode, 0) if listing_obj.seller_id not in seen_sellers else 0
        seen_sellers.add(listing_obj.seller_id)

        order = Order.objects.create(
            buyer=request.user,
            seller=listing_obj.seller,
            listing=listing_obj,
            item_name=listing_obj.name,
            quantity=qty,
            unit=listing_obj.unit,
            price_per_unit=listing_obj.price,
            delivery_mode=delivery_mode,
            delivery_fee=fee,
            batch_ref=batch_ref,
            order_type="order",
        )
        listing_obj.quantity -= qty
        listing_obj.save(update_fields=["quantity"])
        created_orders.append(order)
        total_amount += order.total + order.delivery_fee

    from django.core.cache import cache
    cache.clear()

    return Response({
        "batch_ref": batch_ref,
        "total_amount": total_amount,
        "orders": OrderSerializer(created_orders, many=True).data,
    }, status=status.HTTP_201_CREATED)


class SubscriptionOrderViewSet(viewsets.ModelViewSet):
    """B2B recurring weekly/monthly supply contracts — visible to both buyer and matched seller."""
    serializer_class = SubscriptionOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "seller":
            return SubscriptionOrder.objects.filter(listing__seller=user, is_active=True).select_related("listing", "buyer")
        return SubscriptionOrder.objects.filter(buyer=user).select_related("listing", "buyer")

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

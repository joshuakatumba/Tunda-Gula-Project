from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes as perm
from rest_framework.response import Response
from .models import Order, Rating
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    PreorderCreateSerializer,
    RatingSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    """
    /api/v1/orders/

    Buyers see their orders (MyOrders.tsx).
    Sellers see orders for their listings (SellerOrders.tsx).
    Admins see all orders (AdminDelivery.tsx).
    """
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        if user.role == "admin":
            return Order.objects.all().select_related("buyer", "seller", "rating", "listing", "harvest_plan")
        elif user.role == "seller":
            return Order.objects.filter(seller=user).select_related("buyer", "rating", "listing", "harvest_plan")
        else:
            return Order.objects.filter(buyer=user).select_related("seller", "rating", "listing", "harvest_plan")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        listing = serializer.validated_data.get("listing")
        order = serializer.save(
            buyer=self.request.user,
            seller=listing.seller,
            order_type="order",
        )
        if listing:
            listing.quantity = max(0, listing.quantity - order.quantity)
            listing.save(update_fields=["quantity"])
            from django.core.cache import cache
            cache.clear()
        
        from notifications.sms import send_sms
        send_sms(order.seller.phone, f"New Order: {order.quantity} {listing.unit} of {listing.name} ordered by {order.buyer.name}.")

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """Seller accepts an order."""
        order = self.get_object()
        if order.seller != request.user and not request.user.is_staff:
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        if order.status != "placed":
            return Response({"error": f"Cannot accept order in status '{order.status}'"}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        order.status = "accepted"
        order.accepted_at = timezone.now()
        order.save()
        
        from notifications.sms import send_sms
        send_sms(order.buyer.phone, f"Your order for {order.item_name} has been accepted by {order.seller.name}. They are preparing delivery.")
        
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def dispatch(self, request, pk=None):
        """Seller marks order as out for delivery."""
        order = self.get_object()
        if order.seller != request.user and not request.user.is_staff:
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in ["placed", "accepted"]:
            return Response({"error": f"Cannot dispatch order in status '{order.status}'"}, status=status.HTTP_400_BAD_REQUEST)
        order.status = "out_for_delivery"
        if "delivery_mode" in request.data:
            order.delivery_mode = request.data["delivery_mode"]
        order.save()
        from notifications.sms import send_sms
        send_sms(order.buyer.phone, f"Your order for {order.item_name} is on the way via {order.delivery_mode}!")
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        """Mark order as delivered (either buyer confirms or seller marks completed)."""
        order = self.get_object()
        if order.buyer != request.user and order.seller != request.user and not request.user.is_staff:
            return Response({"error": "Only the buyer or seller can mark this order as delivered."}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in ["placed", "accepted", "out_for_delivery"]:
            return Response({"error": f"Order in status '{order.status}' cannot be marked as delivered."}, status=status.HTTP_400_BAD_REQUEST)
        from django.utils import timezone
        order.status = "delivered"
        order.delivered_at = timezone.now()
        order.save()
        
        # --- Escrow & Payout Logic (Day 11) ---
        from payments.models import Payment, Payout, PlatformSettings
        
        # 1. Find held payment and release it
        payment = Payment.objects.filter(order=order, status="held").first()
        if payment:
            payment.status = "released"
            payment.save()

            # 2. Calculate commission
            settings = PlatformSettings.load()
            commission_rate = settings.commission_rate
            gross_amount = payment.amount
            commission_amount = int(gross_amount * (commission_rate / 100))
            net_amount = gross_amount - commission_amount

            # 3. Create Payout
            Payout.objects.create(
                order=order,
                seller=order.seller,
                gross_amount=gross_amount,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                net_amount=net_amount,
                status="sent",  # auto-disbursed
                payout_phone=order.seller.phone,
                sent_at=timezone.now()
            )

        from notifications.sms import send_sms
        send_sms(order.buyer.phone, f"Your order for {order.item_name} has been delivered! Please confirm receipt in the app.")
        if payment:
            send_sms(order.seller.phone, f"Order {order.id} delivered. Payout of UGX {net_amount:,} is on the way to your Mobile Money account.")
        
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def rate(self, request, pk=None):
        """Buyer rates a delivered order — maps to RateModal.tsx."""
        order = self.get_object()
        if order.buyer != request.user:
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        if order.status != "delivered":
            return Response({"error": "Can only rate delivered orders"}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(order, "rating"):
            return Response({"error": "Already rated"}, status=status.HTTP_400_BAD_REQUEST)

        rating = Rating.objects.create(
            order=order,
            buyer=request.user,
            seller=order.seller,
            stars=request.data.get("stars", 5),
            comment=request.data.get("comment", ""),
        )
        return Response(RatingSerializer(rating).data, status=status.HTTP_201_CREATED)


class RatingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/v1/orders/ratings/
    List customer ratings and summaries dynamically from the database.
    """
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        from accounts.models import User
        seller_id = self.request.query_params.get("seller")
        if seller_id:
            return Rating.objects.filter(seller_id=seller_id).select_related("buyer", "seller", "order")
        user = self.request.user
        if not user.is_authenticated:
            return Rating.objects.none()
        if user.role == "seller":
            return Rating.objects.filter(seller=user).select_related("buyer", "seller", "order")
        elif user.role == "buyer":
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
def create_preorder(request):
    """
    POST /api/v1/orders/preorder/
    Place a pre-order reservation — maps to PreorderModal.tsx.
    """
    serializer = PreorderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    harvest_plan = serializer.validated_data["harvest_plan"]

    order = serializer.save(
        buyer=request.user,
        seller=harvest_plan.seller,
        order_type="preorder",
        status="reserved",
    )

    # Update reserved quantity on the harvest plan
    harvest_plan.reserved += order.quantity
    harvest_plan.save()

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

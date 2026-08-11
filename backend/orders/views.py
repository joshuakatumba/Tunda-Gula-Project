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
        if user.role == "admin":
            return Order.objects.all().select_related("buyer", "seller", "rating")
        elif user.role == "seller":
            return Order.objects.filter(seller=user).select_related("buyer", "rating")
        else:
            return Order.objects.filter(buyer=user).select_related("seller", "rating")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        listing = serializer.validated_data.get("listing")
        serializer.save(
            buyer=self.request.user,
            seller=listing.seller,
            order_type="order",
        )

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """Seller accepts an order."""
        order = self.get_object()
        if order.seller != request.user:
            return Response({"error": "Not your order"}, status=status.HTTP_403_FORBIDDEN)
        from django.utils import timezone
        order.status = "accepted"
        order.accepted_at = timezone.now()
        order.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        """Mark order as delivered."""
        order = self.get_object()
        from django.utils import timezone
        order.status = "delivered"
        order.delivered_at = timezone.now()
        order.save()
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

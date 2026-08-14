from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from django.utils import timezone
from .models import Listing, PreHarvestPlan
from .serializers import (
    ListingSerializer,
    ListingCreateSerializer,
    PreHarvestPlanSerializer,
)


class IsSellerOrReadOnly(permissions.BasePermission):
    """Only verified sellers can create/edit listings."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role == "seller"
            and request.user.is_verified
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class ListingViewSet(viewsets.ModelViewSet):
    """
    /api/v1/listings/

    GET    → Public marketplace (Marketplace.tsx)
    POST   → Create listing (ListingForm.tsx — sellers only)
    PATCH  → Update listing (sellers only)
    DELETE → Remove listing (sellers only)
    """
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        qs = Listing.objects.filter(is_active=True).select_related("seller")

        # Marketplace filters — matches Marketplace.tsx filter logic
        category = self.request.query_params.get("category")
        district = self.request.query_params.get("district")
        max_price = self.request.query_params.get("max_price")
        search = self.request.query_params.get("q")
        sort = self.request.query_params.get("sort")

        if category and category != "All":
            qs = qs.filter(category=category)
        if district and district != "All":
            qs = qs.filter(district=district)
        if max_price:
            qs = qs.filter(price__lte=int(max_price))
        if search:
            qs = qs.filter(name__icontains=search)

        if sort == "price":
            qs = qs.order_by("price")
        elif sort == "newest":
            qs = qs.order_by("-created_at")

        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ListingCreateSerializer
        return ListingSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user, district=self.request.user.district)


class PreHarvestPlanViewSet(viewsets.ModelViewSet):
    """
    /api/v1/listings/plans/

    GET  → Browse pre-harvest plans (PreOrders.tsx)
    POST → Create plan (PlanForm.tsx — sellers only)
    """
    serializer_class = PreHarvestPlanSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        return PreHarvestPlan.objects.filter(is_active=True).select_related("seller")

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user, district=self.request.user.district)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def seller_dashboard(request):
    """
    GET /api/v1/listings/seller/dashboard/
    Returns stats for the logged-in seller's dashboard (SellerHome.tsx).
    """
    if request.user.role != "seller":
        return Response({"error": "Seller account required"}, status=403)

    seller = request.user

    # Import here to avoid circular imports
    from orders.models import Order, Rating

    # Active listings
    active_listings = Listing.objects.filter(seller=seller, is_active=True, quantity__gt=0)
    all_listings = Listing.objects.filter(seller=seller, is_active=True)

    # Orders this month
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    orders_this_month = Order.objects.filter(seller=seller, placed_at__gte=month_start)
    pending_orders = Order.objects.filter(
        seller=seller,
        status__in=[Order.Status.PLACED, Order.Status.ACCEPTED]
    )

    # Revenue — sum of delivered orders
    delivered_orders = Order.objects.filter(seller=seller, status=Order.Status.DELIVERED)
    gross = delivered_orders.aggregate(
        total=Sum("quantity") * Sum("price_per_unit")
    )
    # Calculate correctly
    gross_amount = sum(o.quantity * o.price_per_unit for o in delivered_orders)

    # Ratings
    rating_stats = Rating.objects.filter(seller=seller).aggregate(
        avg=Avg("stars"),
        count=Count("id")
    )

    return Response({
        "active_listings": active_listings.count(),
        "total_listings": all_listings.count(),
        "orders_this_month": orders_this_month.count(),
        "pending_orders": pending_orders.count(),
        "gross_revenue": gross_amount,
        "avg_rating": round(rating_stats["avg"] or 0, 1),
        "rating_count": rating_stats["count"],
        "is_verified": seller.is_verified,
        "district": seller.district,
        "seller_type": seller.seller_type,
    })

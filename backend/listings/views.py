from rest_framework import viewsets, permissions
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

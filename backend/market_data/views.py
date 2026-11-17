from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import ReferencePrice, Category, PriceHistory
from .serializers import ReferencePriceSerializer, CategorySerializer

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page


# Prices are the "live" ticker — keep the server cache very short so changes
# show up within seconds instead of an hour.
@method_decorator(cache_page(30), name='dispatch')
class ReferencePriceListView(generics.ListAPIView):
    """
    GET /api/v1/market/prices/
    Public — returns current market reference prices for the PriceRail ticker.
    """
    queryset = ReferencePrice.objects.all()
    serializer_class = ReferencePriceSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Always return all prices


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    /api/v1/market/categories/        GET public · POST admin
    /api/v1/market/categories/<id>/   PATCH/DELETE admin
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def perform_create(self, serializer):
        serializer.save(order=Category.objects.count() + 1)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def market_predictions(request):
    """
    GET /api/v1/market/predictions/
    Combines ReferencePrice momentum, PriceHistory, and upcoming PreHarvestPlan supply
    to produce realistic 14-day price direction signals.
    """
    from datetime import timedelta
    from django.utils import timezone
    from django.db.models import Sum
    from listings.models import PreHarvestPlan

    now = timezone.localdate()
    horizon = now + timedelta(days=21)
    upcoming_supply = {
        row["name"].lower(): row["total_qty"] or 0
        for row in PreHarvestPlan.objects.filter(is_active=True, expected_harvest__lte=horizon)
        .values("name")
        .annotate(total_qty=Sum("quantity") - Sum("reserved"))
    }

    predictions = []
    for ref in ReferencePrice.objects.all():
        supply_left = upcoming_supply.get(ref.name.lower(), 0)
        # Momentum + supply pressure heuristic
        projected_change = ref.week_change
        if supply_left >= 1000:
            projected_change -= 5
            signal = "dip"
        elif ref.week_change >= 4:
            signal = "rise"
        elif ref.week_change <= -4:
            signal = "dip"
        else:
            signal = "stable"

        projected_price = max(100, round(ref.price * (1 + projected_change / 100)))
        predictions.append({
            "crop": ref.name,
            "unit": ref.unit,
            "current_price": ref.price,
            "projected_price": projected_price,
            "projected_change_pct": projected_change,
            "signal": signal,
            "upcoming_supply": max(0, supply_left),
        })

    return Response(predictions)

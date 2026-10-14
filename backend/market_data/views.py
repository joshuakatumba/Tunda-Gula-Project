from rest_framework import generics, permissions, viewsets
from .models import ReferencePrice, Category
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

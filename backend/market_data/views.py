from rest_framework import generics, permissions
from .models import ReferencePrice, Category
from .serializers import ReferencePriceSerializer, CategorySerializer


from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

@method_decorator(cache_page(60 * 60), name='dispatch')
class ReferencePriceListView(generics.ListAPIView):
    """
    GET /api/v1/market/prices/
    Public — returns current market reference prices for the PriceRail ticker.
    """
    queryset = ReferencePrice.objects.all()
    serializer_class = ReferencePriceSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Always return all prices


@method_decorator(cache_page(60 * 60), name='dispatch')
class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/market/categories/
    Public — returns produce categories for filter dropdowns.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

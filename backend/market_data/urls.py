from django.urls import path
from rest_framework.routers import SimpleRouter
from . import views

app_name = "market_data"

router = SimpleRouter()
router.register("categories", views.CategoryViewSet, basename="categories")

urlpatterns = [
    path("prices/", views.ReferencePriceListView.as_view(), name="prices"),
] + router.urls

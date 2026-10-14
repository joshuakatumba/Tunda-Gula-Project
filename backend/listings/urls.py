from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "listings"

router = DefaultRouter()
router.register(r"plans", views.PreHarvestPlanViewSet, basename="plan")
router.register(r"", views.ListingViewSet, basename="listing")

urlpatterns = [
    path("seller/dashboard/", views.seller_dashboard, name="seller-dashboard"),
    path("", include(router.urls)),
]

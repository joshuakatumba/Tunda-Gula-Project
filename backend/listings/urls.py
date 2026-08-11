from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "listings"

router = DefaultRouter()
router.register(r"", views.ListingViewSet, basename="listing")
router.register(r"plans", views.PreHarvestPlanViewSet, basename="plan")

urlpatterns = [
    path("", include(router.urls)),
]

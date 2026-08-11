from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "disputes"

router = DefaultRouter()
router.register(r"", views.DisputeViewSet, basename="dispute")

urlpatterns = [
    path("", include(router.urls)),
]

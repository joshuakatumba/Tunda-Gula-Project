from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "orders"

router = DefaultRouter()
router.register(r"", views.OrderViewSet, basename="order")

urlpatterns = [
    path("preorder/", views.create_preorder, name="create-preorder"),
    path("", include(router.urls)),
]

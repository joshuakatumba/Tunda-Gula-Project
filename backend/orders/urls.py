from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "orders"

router = DefaultRouter()
router.register(r"ratings", views.RatingViewSet, basename="rating")
router.register(r"subscriptions", views.SubscriptionOrderViewSet, basename="subscription")
router.register(r"", views.OrderViewSet, basename="order")

urlpatterns = [
    path("preorder/", views.create_preorder, name="create-preorder"),
    path("batch-checkout/", views.batch_checkout, name="batch-checkout"),
    path("", include(router.urls)),
]

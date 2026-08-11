from django.urls import path
from . import views

app_name = "payments"

urlpatterns = [
    path("initiate/", views.InitiatePaymentView.as_view(), name="initiate"),
    path("webhook/", views.payment_webhook, name="webhook"),
    path("payouts/", views.SellerPayoutsView.as_view(), name="payouts"),
    path("settings/", views.platform_settings, name="settings"),
]

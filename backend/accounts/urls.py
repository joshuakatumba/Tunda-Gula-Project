from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    # Registration & auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("otp/request/", views.request_otp, name="otp-request"),
    path("otp/verify/", views.verify_otp, name="otp-verify"),
    path("me/", views.me, name="me"),

    # Admin — seller verification
    path("pending/", views.PendingVerificationsView.as_view(), name="pending"),
    path("<int:pk>/approve/", views.approve_seller, name="approve-seller"),
    path("<int:pk>/reject/", views.reject_seller, name="reject-seller"),
]

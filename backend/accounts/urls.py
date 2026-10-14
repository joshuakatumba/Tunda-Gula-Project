# pyrefly: ignore [missing-import]
from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    # Registration & auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.login_view, name="login"),
    path("otp/request/", views.request_otp, name="otp-request"),
    path("otp/verify/", views.verify_otp, name="otp-verify"),
    path("me/", views.me, name="me"),

    # Session management
    path("token/refresh/", views.refresh_token, name="token-refresh"),
    path("logout/", views.logout_view, name="logout"),
    path("logout-all/", views.logout_all, name="logout-all"),

    # Admin — seller verification & platform stats
    path("admin/stats/", views.admin_platform_stats, name="admin-stats"),
    path("pending/", views.PendingVerificationsView.as_view(), name="pending"),
    path("<int:pk>/approve/", views.approve_seller, name="approve-seller"),
    path("<int:pk>/reject/", views.reject_seller, name="reject-seller"),
    path("<int:pk>/toggle-active/", views.toggle_active, name="toggle-active"),
]


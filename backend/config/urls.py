"""
TundaGula — Root URL configuration.

All API routes live under /api/v1/ for clean versioning.
Django Admin is available at /admin/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from accounts import views as accounts_views

urlpatterns = [
    # Django Admin panel
    path("admin/", admin.site.urls),

    # Direct root OTP verification endpoints
    path("send-otp/", accounts_views.send_otp_view, name="root-send-otp"),
    path("verify-otp/", accounts_views.verify_otp_view, name="root-verify-otp"),

    # API v1 endpoints
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/listings/", include("listings.urls")),
    path("api/v1/orders/", include("orders.urls")),
    path("api/v1/payments/", include("payments.urls")),
    path("api/v1/disputes/", include("disputes.urls")),
    path("api/v1/market/", include("market_data.urls")),

    # DRF browsable API auth (dev only)
    path("api-auth/", include("rest_framework.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

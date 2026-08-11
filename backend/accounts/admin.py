"""
accounts/admin.py — Django Admin configuration for user management.

This replaces the need for custom admin UI — out-of-the-box user management,
verification queue, and account administration.
"""

# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("phone", "name", "role", "district", "is_verified", "is_active", "date_joined")
    list_filter = ("role", "is_verified", "is_active", "district", "seller_type", "buyer_type")
    search_fields = ("phone", "name", "nin", "email")
    ordering = ("-date_joined",)

    # Group fields logically in the detail view
    fieldsets = (
        ("Identity", {"fields": ("phone", "name", "email", "role")}),
        ("Role Details", {"fields": ("seller_type", "buyer_type")}),
        ("Seller Registration", {
            "fields": ("nin", "district", "gps_lat", "gps_lng", "manual_location"),
            "classes": ("collapse",),
        }),
        ("Verification", {
            "fields": (
                "is_verified", "nin_match", "otp_verified", "gps_pinned",
                "verification_submitted_at", "verified_at", "rejection_reason",
            ),
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
            "classes": ("collapse",),
        }),
        ("Timestamps", {"fields": ("date_joined", "last_login")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone", "name", "role", "password1", "password2"),
        }),
    )

    # Quick action: approve pending sellers
    actions = ["approve_sellers", "reject_sellers"]

    @admin.action(description="✅ Approve selected sellers")
    def approve_sellers(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(role="seller", is_verified=False).update(
            is_verified=True, verified_at=timezone.now()
        )
        self.message_user(request, f"{updated} seller(s) approved.")

    @admin.action(description="❌ Reject selected sellers")
    def reject_sellers(self, request, queryset):
        updated = queryset.filter(role="seller", is_verified=False).update(
            is_verified=False, rejection_reason="Rejected by administrator"
        )
        self.message_user(request, f"{updated} seller(s) rejected.")


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("phone", "code", "created_at", "expires_at", "is_used")
    list_filter = ("is_used",)
    search_fields = ("phone",)
    readonly_fields = ("phone", "code", "created_at", "expires_at")

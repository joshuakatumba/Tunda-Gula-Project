from django.contrib import admin
from .models import Payment, Payout, PlatformSettings


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "provider", "amount", "status", "phone", "created_at")
    list_filter = ("status", "provider")
    search_fields = ("phone", "external_ref")
    readonly_fields = ("created_at", "confirmed_at")


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ("order", "seller", "gross_amount", "commission_amount", "net_amount", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("seller__name", "payout_phone")

    actions = ["mark_sent"]

    @admin.action(description="💸 Mark payouts as sent")
    def mark_sent(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status="pending").update(status="sent", sent_at=timezone.now())


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ("commission_rate", "default_deposit_percentage", "updated_at")

    def has_add_permission(self, request):
        # Singleton — prevent adding more than one
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

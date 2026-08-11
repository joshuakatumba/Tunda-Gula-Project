from django.contrib import admin
from .models import Order, Rating


class RatingInline(admin.StackedInline):
    model = Rating
    extra = 0
    readonly_fields = ("buyer", "seller", "stars", "comment", "created_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "order_type", "item_name", "buyer", "seller",
        "quantity", "unit", "price_per_unit", "status", "placed_at",
    )
    list_filter = ("status", "order_type", "delivery_mode")
    search_fields = ("item_name", "buyer__name", "seller__name")
    inlines = [RatingInline]

    actions = ["mark_accepted", "mark_out_for_delivery", "mark_delivered"]

    @admin.action(description="📦 Mark as accepted")
    def mark_accepted(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status="placed").update(status="accepted", accepted_at=timezone.now())

    @admin.action(description="🚚 Mark as out for delivery")
    def mark_out_for_delivery(self, request, queryset):
        queryset.filter(status="accepted").update(status="out_for_delivery")

    @admin.action(description="✅ Mark as delivered")
    def mark_delivered(self, request, queryset):
        from django.utils import timezone
        queryset.exclude(status="delivered").update(status="delivered", delivered_at=timezone.now())


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("order", "buyer", "seller", "stars", "created_at")
    list_filter = ("stars",)
    search_fields = ("buyer__name", "seller__name", "comment")

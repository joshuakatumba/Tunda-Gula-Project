from django.contrib import admin
from .models import Dispute


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "raised_by", "reason_short", "value", "status", "opened_at")
    list_filter = ("status",)
    search_fields = ("reason", "raised_by__name", "resolution")

    actions = ["resolve_disputes"]

    @admin.display(description="Reason")
    def reason_short(self, obj):
        return obj.reason[:60] + "…" if len(obj.reason) > 60 else obj.reason

    @admin.action(description="✅ Resolve selected disputes")
    def resolve_disputes(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status="open").update(
            status="resolved",
            resolved_by=request.user,
            resolved_at=timezone.now(),
        )

from rest_framework import serializers
from .models import Dispute


class DisputeSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.CharField(source="raised_by.name", read_only=True)
    raised_by_role = serializers.CharField(source="raised_by.role", read_only=True)
    resolved_by_name = serializers.CharField(source="resolved_by.name", read_only=True, default=None)

    class Meta:
        model = Dispute
        fields = [
            "id", "order", "raised_by", "raised_by_name", "raised_by_role",
            "reason", "value", "status",
            "resolution", "resolved_by", "resolved_by_name",
            "opened_at", "resolved_at",
        ]
        read_only_fields = [
            "raised_by", "status", "resolution",
            "opened_at", "resolved_at", "resolved_by",
        ]

    def validate_order(self, order):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if order.buyer != request.user and order.seller != request.user:
                raise serializers.ValidationError("You can only dispute your own orders.")
        return order

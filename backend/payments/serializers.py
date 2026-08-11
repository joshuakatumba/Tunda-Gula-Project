from rest_framework import serializers
from .models import Payment, Payout, PlatformSettings


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "order", "provider", "phone", "amount",
            "status", "external_ref", "created_at", "confirmed_at",
        ]
        read_only_fields = ["status", "external_ref", "created_at", "confirmed_at"]


class PayoutSerializer(serializers.ModelSerializer):
    """Maps to SellerPayouts.tsx table rows."""
    seller_name = serializers.CharField(source="seller.name", read_only=True)

    class Meta:
        model = Payout
        fields = [
            "id", "order", "seller", "seller_name",
            "gross_amount", "commission_rate", "commission_amount", "net_amount",
            "status", "payout_phone", "created_at", "sent_at",
        ]
        read_only_fields = fields


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ["commission_rate", "default_deposit_percentage", "updated_at"]

from rest_framework import serializers
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Handles the multi-step registration from Auth.tsx."""

    class Meta:
        model = User
        fields = [
            "phone", "name", "role", "seller_type", "buyer_type",
            "nin", "district", "gps_lat", "gps_lng", "manual_location", "email",
        ]

    def validate(self, data):
        role = data.get("role")
        if role == "seller" and not data.get("nin"):
            raise serializers.ValidationError({"nin": "NIN is required for sellers."})
        if role == "seller" and not data.get("district"):
            raise serializers.ValidationError({"district": "District is required for sellers."})
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile returned after login — maps to frontend session object."""

    class Meta:
        model = User
        fields = [
            "id", "phone", "name", "role", "seller_type", "buyer_type",
            "district", "is_verified", "date_joined",
        ]
        read_only_fields = fields


class SellerPublicSerializer(serializers.ModelSerializer):
    """Public seller info shown on listings — never exposes exact GPS or NIN."""

    class Meta:
        model = User
        fields = ["id", "name", "district", "seller_type", "is_verified"]
        read_only_fields = fields


class PendingVerificationSerializer(serializers.ModelSerializer):
    """
    Admin view of sellers awaiting verification.
    Maps to frontend's SEED_PENDING data structure.
    """

    class Meta:
        model = User
        fields = [
            "id", "name", "seller_type", "nin", "phone", "district",
            "nin_match", "otp_verified", "gps_pinned",
            "verification_submitted_at",
        ]
        read_only_fields = fields

from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import User, OTP
from .utils import clean_phone, check_verification_token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Handles the multi-step registration from Auth.tsx."""

    verification_token = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = [
            "phone", "name", "role", "seller_type", "buyer_type",
            "nin", "district", "gps_lat", "gps_lng", "manual_location", "email",
            "verification_token",
        ]

    def validate_phone(self, value):
        phone = clean_phone(value)
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return phone

    def validate(self, data):
        phone = data.get("phone")
        role = data.get("role")
        verification_token = data.get("verification_token")

        # Industrial Verification Check:
        # Accepts signed cryptographic verification_token, or verified OTP record in DB
        is_token_valid = False
        if verification_token:
            is_token_valid = check_verification_token(verification_token, phone, max_age=900)

        fifteen_minutes_ago = timezone.now() - timedelta(minutes=15)
        has_verified_record = OTP.objects.filter(
            phone=phone,
            is_used=True,
            status=OTP.Status.VERIFIED,
            created_at__gte=fifteen_minutes_ago,
        ).exists()

        if not is_token_valid and not has_verified_record:
            raise serializers.ValidationError({
                "phone": "Phone number must be verified with OTP before registering."
            })

        if role not in [User.Role.BUYER, User.Role.SELLER]:
            raise serializers.ValidationError({"role": "Public registration only allows buyer or seller accounts."})

        if role == User.Role.SELLER:
            if not data.get("nin"):
                raise serializers.ValidationError({"nin": "NIN is required for sellers."})
            if not data.get("district"):
                raise serializers.ValidationError({"district": "District is required for sellers."})
        elif role == User.Role.BUYER:
            if not data.get("name"):
                raise serializers.ValidationError({"name": "Name is required for buyers."})

        return data

    def create(self, validated_data):
        validated_data.pop("verification_token", None)
        if validated_data.get("role") == User.Role.SELLER:
            validated_data["verification_submitted_at"] = timezone.now()
            validated_data["nin_match"] = True
            if validated_data.get("gps_lat") and validated_data.get("gps_lng"):
                validated_data["gps_pinned"] = True
        return super().create(validated_data)


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

from datetime import timedelta
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import User, OTP
from .utils import clean_phone, check_verification_token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Handles multi-step registration from Auth.tsx with password and optional OTP."""

    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    verification_token = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = [
            "phone", "name", "role", "seller_type", "buyer_type",
            "nin", "district", "gps_lat", "gps_lng", "manual_location", "email",
            "password", "verification_token",
        ]

    def validate_phone(self, value):
        if not value:
            return ""
        phone = clean_phone(value)
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return phone

    def validate(self, data):
        phone = data.get("phone")
        role = data.get("role")
        email = (data.get("email") or "").strip()
        password = data.get("password")
        verification_token = data.get("verification_token")

        if role not in [User.Role.BUYER, User.Role.SELLER, User.Role.ADMIN]:
            raise serializers.ValidationError({"role": "Public registration only allows buyer, seller, or staff accounts."})

        # --- SELLER (Farmer): Retains phone + OTP verification ---
        if role == User.Role.SELLER:
            if not phone:
                raise serializers.ValidationError({"phone": "Phone number is required for seller registration."})

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
                    "phone": "Phone number must be verified with OTP before registering as a seller."
                })

            if not data.get("nin"):
                raise serializers.ValidationError({"nin": "NIN is required for sellers."})
            if not data.get("district"):
                raise serializers.ValidationError({"district": "District is required for sellers."})

        # --- BUYER & ADMIN: OTP is commented out, normal email & password flow enforced ---
        elif role in [User.Role.BUYER, User.Role.ADMIN]:
            # NOTE: OTP verification check is commented out for Buyer and Admin accounts.
            # Normal email & password authentication is used instead.
            # if not is_token_valid and not has_verified_record:
            #     raise serializers.ValidationError({"phone": "Phone number must be verified with OTP before registering."})

            if not email:
                raise serializers.ValidationError({"email": "Email address is required."})

            if User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError({"email": "An account with this email address already exists."})

            if not password or len(password) < 6:
                raise serializers.ValidationError({"password": "Password must be at least 6 characters long."})

            if role == User.Role.BUYER and not data.get("name"):
                raise serializers.ValidationError({"name": "Name is required for buyers."})

            if role == User.Role.ADMIN and not data.get("name"):
                data["name"] = email.split("@")[0].replace(".", " ").capitalize()

        return data

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("verification_token", None)
        role = validated_data.get("role")

        # Convert empty string phone to None to avoid unique constraint collisions
        if not validated_data.get("phone"):
            validated_data["phone"] = None

        if role == User.Role.SELLER:
            validated_data["verification_submitted_at"] = timezone.now()
            validated_data["nin_match"] = True
            if validated_data.get("gps_lat") and validated_data.get("gps_lng"):
                validated_data["gps_pinned"] = True
        elif role in [User.Role.BUYER, User.Role.ADMIN]:
            validated_data["otp_verified"] = True
            if role == User.Role.ADMIN:
                validated_data["is_staff"] = True
                validated_data["is_superuser"] = True

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile returned after login — maps to frontend session object."""

    class Meta:
        model = User
        fields = [
            "id", "phone", "email", "name", "role", "seller_type", "buyer_type",
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

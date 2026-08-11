from rest_framework import serializers
from .models import Listing, ListingPhoto, PreHarvestPlan


class ListingPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingPhoto
        fields = ["id", "image", "order"]


class ListingSerializer(serializers.ModelSerializer):
    """
    Full listing representation — maps to the listing cards in Marketplace.tsx.
    Includes seller name, rating aggregates, and photo count.
    """
    seller_name = serializers.CharField(source="seller.name", read_only=True)
    seller_verified = serializers.BooleanField(source="seller.is_verified", read_only=True)
    photo_count = serializers.IntegerField(source="photos.count", read_only=True)
    photos = ListingPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "name", "category", "quantity", "unit", "price",
            "description", "district", "voice_duration",
            "seller", "seller_name", "seller_verified",
            "photo_count", "photos",
            "is_active", "created_at",
        ]
        read_only_fields = ["seller", "created_at"]


class ListingCreateSerializer(serializers.ModelSerializer):
    """For creating listings — maps to ListingForm.tsx fields."""

    class Meta:
        model = Listing
        fields = [
            "name", "category", "quantity", "unit", "price",
            "description", "voice_duration", "district",
        ]


class PreHarvestPlanSerializer(serializers.ModelSerializer):
    """Maps to PreOrders.tsx plan cards and PlanForm.tsx."""

    seller_name = serializers.CharField(source="seller.name", read_only=True)
    available = serializers.IntegerField(read_only=True)

    class Meta:
        model = PreHarvestPlan
        fields = [
            "id", "name", "category", "district",
            "date_planted", "expected_harvest",
            "quantity", "reserved", "available", "unit",
            "price", "deposit_percentage",
            "seller", "seller_name",
            "is_active", "created_at",
        ]
        read_only_fields = ["seller", "reserved", "created_at"]

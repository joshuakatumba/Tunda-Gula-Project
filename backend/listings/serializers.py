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
            "description", "district", "voice_duration", "voice_file",
            "seller", "seller_name", "seller_verified",
            "photo_count", "photos",
            "is_active", "created_at",
        ]
        read_only_fields = ["seller", "created_at"]


class ListingCreateSerializer(serializers.ModelSerializer):
    """
    For creating/updating listings — maps to ListingForm.tsx.
    Accepts multipart/form-data so photos and voice notes can be uploaded.
    """
    # Accept multiple photo files at once (optional)
    photo_files = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )
    # Accept a single voice note file (optional)
    voice_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Listing
        fields = [
            "name", "category", "quantity", "unit", "price",
            "description", "voice_duration", "district",
            "voice_file", "photo_files",
        ]

    def create(self, validated_data):
        photo_files = validated_data.pop("photo_files", [])
        listing = super().create(validated_data)
        # Save each photo as a ListingPhoto record
        for i, photo in enumerate(photo_files):
            ListingPhoto.objects.create(listing=listing, image=photo, order=i)
        return listing

    def update(self, instance, validated_data):
        photo_files = validated_data.pop("photo_files", [])
        listing = super().update(instance, validated_data)
        # Append new photos (do not delete existing ones)
        existing_count = listing.photos.count()
        for i, photo in enumerate(photo_files):
            ListingPhoto.objects.create(listing=listing, image=photo, order=existing_count + i)
        return listing


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


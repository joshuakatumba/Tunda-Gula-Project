from rest_framework import serializers
from .models import Order, Rating


class RatingSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)
    seller_name = serializers.CharField(source="seller.name", read_only=True)
    item_name = serializers.CharField(source="order.item_name", read_only=True)

    class Meta:
        model = Rating
        fields = ["id", "stars", "comment", "buyer", "buyer_name", "seller", "seller_name", "item_name", "order", "created_at"]
        read_only_fields = ["buyer", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    """
    Full order representation — maps to MyOrders.tsx and SellerOrders.tsx.
    """
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)
    seller_name = serializers.CharField(source="seller.name", read_only=True)
    total = serializers.IntegerField(read_only=True)
    deposit_amount = serializers.IntegerField(read_only=True)
    rating = RatingSerializer(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    thumbnail = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    def get_thumbnail(self, obj):
        if obj.listing and obj.listing.thumbnail:
            return obj.listing.thumbnail.url
        return None

    def get_category(self, obj):
        if obj.listing:
            return obj.listing.category
        if obj.harvest_plan:
            return obj.harvest_plan.category
        return "Vegetables"

    class Meta:
        model = Order
        fields = [
            "id", "order_type", "item_name", "quantity", "unit",
            "price_per_unit", "total", "deposit_amount", "deposit_percentage",
            "status", "status_label", "delivery_mode",
            "buyer", "buyer_name", "seller", "seller_name",
            "listing", "harvest_plan",
            "rating", "thumbnail", "category",
            "placed_at", "accepted_at", "delivered_at",
        ]
        read_only_fields = [
            "buyer", "placed_at", "accepted_at", "delivered_at",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """For placing orders from Checkout.tsx."""

    class Meta:
        model = Order
        fields = [
            "id", "listing", "item_name", "quantity", "unit",
            "price_per_unit", "delivery_mode",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        listing = attrs.get("listing")
        quantity = attrs.get("quantity")
        if listing and quantity is not None:
            if quantity <= 0:
                raise serializers.ValidationError({"quantity": "Quantity must be at least 1."})
            if listing.quantity < quantity:
                raise serializers.ValidationError({
                    "quantity": f"Only {listing.quantity} {listing.unit} available in stock."
                })
        return attrs


class PreorderCreateSerializer(serializers.ModelSerializer):
    """For placing pre-orders from PreorderModal.tsx."""

    class Meta:
        model = Order
        fields = [
            "id", "harvest_plan", "item_name", "quantity", "unit",
            "price_per_unit", "deposit_percentage",
        ]
        read_only_fields = ["id"]

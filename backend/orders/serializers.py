from rest_framework import serializers
from .models import Order, Rating


class RatingSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)

    class Meta:
        model = Rating
        fields = ["id", "stars", "comment", "buyer", "buyer_name", "created_at"]
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

    class Meta:
        model = Order
        fields = [
            "id", "order_type", "item_name", "quantity", "unit",
            "price_per_unit", "total", "deposit_amount", "deposit_percentage",
            "status", "status_label", "delivery_mode",
            "buyer", "buyer_name", "seller", "seller_name",
            "listing", "harvest_plan",
            "rating",
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
            "listing", "item_name", "quantity", "unit",
            "price_per_unit", "delivery_mode",
        ]


class PreorderCreateSerializer(serializers.ModelSerializer):
    """For placing pre-orders from PreorderModal.tsx."""

    class Meta:
        model = Order
        fields = [
            "harvest_plan", "item_name", "quantity", "unit",
            "price_per_unit", "deposit_percentage",
        ]

from rest_framework import serializers
from .models import Order, Rating, SubscriptionOrder


DELIVERY_FEES = {
    Order.DeliveryMode.MOTORCYCLE: 5000,
    Order.DeliveryMode.TRUCK: 25000,
    Order.DeliveryMode.PICKUP: 0,
}


class RatingSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)
    seller_name = serializers.CharField(source="seller.name", read_only=True)
    item_name = serializers.CharField(source="order.item_name", read_only=True)

    class Meta:
        model = Rating
        fields = ["id", "stars", "comment", "buyer", "buyer_name", "seller", "seller_name", "item_name", "order", "created_at"]
        read_only_fields = ["buyer", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
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
            "price_per_unit", "delivery_fee", "batch_ref", "total", "deposit_amount", "deposit_percentage",
            "status", "status_label", "delivery_mode",
            "buyer", "buyer_name", "seller", "seller_name",
            "listing", "harvest_plan",
            "rating", "thumbnail", "category",
            "placed_at", "accepted_at", "delivered_at",
        ]
        read_only_fields = fields


class OrderCreateSerializer(serializers.ModelSerializer):
    """For placing orders — server-authoritative pricing & stock validation."""

    class Meta:
        model = Order
        fields = ["id", "listing", "quantity", "delivery_mode"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        listing = attrs.get("listing")
        quantity = attrs.get("quantity")
        if not listing or not listing.is_active:
            raise serializers.ValidationError({"listing": "A valid active listing is required."})
        if quantity is None or quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be at least 1."})
        if listing.quantity < quantity:
            raise serializers.ValidationError({"quantity": f"Only {listing.quantity} {listing.unit} available in stock."})
        return attrs


class PreorderCreateSerializer(serializers.ModelSerializer):
    """For placing pre-orders — server-authoritative pricing & available yield validation."""

    class Meta:
        model = Order
        fields = ["id", "harvest_plan", "quantity"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        plan = attrs.get("harvest_plan")
        quantity = attrs.get("quantity")
        if not plan or not plan.is_active:
            raise serializers.ValidationError({"harvest_plan": "A valid active harvest plan is required."})
        if quantity is None or quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be at least 1."})
        if plan.available < quantity:
            raise serializers.ValidationError({"quantity": f"Only {plan.available} {plan.unit} available to reserve."})
        return attrs


class SubscriptionOrderSerializer(serializers.ModelSerializer):
    listing_name = serializers.CharField(source="listing.name", read_only=True)
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)
    unit = serializers.CharField(source="listing.unit", read_only=True)
    price = serializers.IntegerField(source="listing.price", read_only=True)

    class Meta:
        model = SubscriptionOrder
        fields = [
            "id", "listing", "listing_name", "buyer_name", "unit", "price",
            "quantity", "frequency", "delivery_mode", "is_active",
            "next_run_date", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

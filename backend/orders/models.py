"""
orders/models.py — Orders and pre-orders with ratings.

Maps to frontend:
  - SEED_ORDERS → Order model (both regular orders and pre-orders)
  - MyOrders.tsx, SellerOrders.tsx → order list views
  - Checkout.tsx → order creation flow
  - RateModal.tsx → Rating model
  - STATUS_LABEL / STATUS_TONE in helpers.ts → Order.Status choices
"""

from django.db import models
from django.conf import settings


class Order(models.Model):
    """
    A marketplace order or pre-order reservation.
    Status flow mirrors helpers.ts STATUS_LABEL:
      placed → accepted → out_for_delivery → delivered
      (pre-orders: reserved → delivered)
    """

    class Status(models.TextChoices):
        PLACED = "placed", "Payment pending"
        ACCEPTED = "accepted", "Order accepted"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for delivery"
        DELIVERED = "delivered", "Delivered"
        RESERVED = "reserved", "Reserved (pre-order)"
        CANCELLED = "cancelled", "Cancelled"

    class OrderType(models.TextChoices):
        ORDER = "order", "Regular order"
        PREORDER = "preorder", "Pre-order"

    class DeliveryMode(models.TextChoices):
        MOTORCYCLE = "Motorcycle", "Motorcycle"
        TRUCK = "Motor truck", "Motor truck"
        PICKUP = "Pickup", "Buyer pickup"

    # --- Parties ---
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="buyer_orders",
        limit_choices_to={"role": "buyer"},
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="seller_orders",
        limit_choices_to={"role": "seller"},
    )

    # --- What was ordered ---
    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    harvest_plan = models.ForeignKey(
        "listings.PreHarvestPlan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    item_name = models.CharField(max_length=200)  # Denormalized for display
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=10)
    price_per_unit = models.PositiveIntegerField(help_text="UGX per unit at time of order")

    # --- Order metadata ---
    order_type = models.CharField(max_length=10, choices=OrderType.choices, default="order")
    status = models.CharField(max_length=20, choices=Status.choices, default="placed")
    delivery_mode = models.CharField(max_length=20, choices=DeliveryMode.choices, blank=True, default="")
    deposit_percentage = models.PositiveSmallIntegerField(default=0, help_text="For pre-orders only")

    # --- Timestamps ---
    placed_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tg_orders"
        ordering = ["-placed_at"]

    def __str__(self):
        return f"ORD-{self.pk} · {self.item_name} ({self.get_status_display()})"

    @property
    def total(self):
        """Total order value in UGX."""
        return self.quantity * self.price_per_unit

    @property
    def deposit_amount(self):
        """Deposit amount for pre-orders."""
        if self.order_type == "preorder" and self.deposit_percentage:
            return self.total * self.deposit_percentage // 100
        return 0


class Rating(models.Model):
    """
    Buyer rates a seller after delivery.
    Maps to RateModal.tsx.
    """

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="rating")
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="given_ratings")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_ratings")
    stars = models.PositiveSmallIntegerField(help_text="1–5 stars")
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tg_ratings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.stars}★ on ORD-{self.order_id} by {self.buyer.name}"

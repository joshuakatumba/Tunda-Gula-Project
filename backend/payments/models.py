"""
payments/models.py — Mobile Money payments and escrow.

Maps to frontend:
  - Checkout.tsx → Payment creation (MTN / Airtel selection)
  - SellerPayouts.tsx → Payout tracking
  - AdminOverview.tsx → commission, GMV calculations

Escrow flow:
  1. Buyer pays → funds held in escrow (Payment.status = "held")
  2. Buyer confirms delivery → escrow released (Payment.status = "released")
  3. Platform deducts commission → Payout created for seller
"""

from django.db import models
from django.conf import settings


class Payment(models.Model):
    """
    A Mobile Money payment tied to an order.
    Handles both regular payments and pre-order deposits.
    """

    class Provider(models.TextChoices):
        MTN = "MTN", "MTN Mobile Money"
        AIRTEL = "Airtel", "Airtel Money"

    class Status(models.TextChoices):
        PENDING = "pending", "Awaiting payment"
        HELD = "held", "Held in escrow"
        RELEASED = "released", "Released to seller"
        REFUNDED = "refunded", "Refunded to buyer"
        FAILED = "failed", "Payment failed"

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    provider = models.CharField(max_length=10, choices=Provider.choices)
    phone = models.CharField(max_length=20, help_text="Phone number used for payment")
    amount = models.PositiveIntegerField(help_text="Amount in UGX")
    status = models.CharField(max_length=10, choices=Status.choices, default="pending")

    # External transaction reference from the Mobile Money API
    external_ref = models.CharField(max_length=100, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tg_payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_provider_display()} — UGX {self.amount:,} ({self.get_status_display()})"


class Payout(models.Model):
    """
    Commission-deducted payout to a seller after delivery confirmation.
    Maps to SellerPayouts.tsx table rows.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent to seller"
        FAILED = "failed", "Payout failed"

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="payout",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payouts",
    )
    gross_amount = models.PositiveIntegerField(help_text="Total order value in UGX")
    commission_rate = models.DecimalField(max_digits=4, decimal_places=2, help_text="e.g. 7.00")
    commission_amount = models.PositiveIntegerField()
    net_amount = models.PositiveIntegerField(help_text="Amount sent to seller")
    status = models.CharField(max_length=10, choices=Status.choices, default="pending")

    # Seller's Mobile Money phone
    payout_phone = models.CharField(max_length=20)
    external_ref = models.CharField(max_length=100, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tg_payouts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payout UGX {self.net_amount:,} → {self.seller.name}"


class PlatformSettings(models.Model):
    """
    Admin-configurable platform settings.
    Maps to AdminOverview.tsx commission and deposit sliders.
    Singleton pattern — only one row ever exists.
    """

    commission_rate = models.DecimalField(
        max_digits=4, decimal_places=2, default=7.00,
        help_text="Platform commission percentage (5–8%)",
    )
    default_deposit_percentage = models.PositiveSmallIntegerField(
        default=30,
        help_text="Default pre-order deposit percentage (10–50%)",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tg_platform_settings"
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def __str__(self):
        return f"Commission {self.commission_rate}% · Deposit {self.default_deposit_percentage}%"

    def save(self, *args, **kwargs):
        # Singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

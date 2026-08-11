"""
disputes/models.py — Dispute resolution system.

Maps to frontend:
  - SEED_DISPUTES → Dispute model
  - AdminDisputes.tsx → dispute management
  - ResolveModal.tsx → resolution workflow
"""

from django.db import models
from django.conf import settings


class Dispute(models.Model):
    """
    A dispute raised by a buyer or seller on an order.
    Maps to SEED_DISPUTES data and AdminDisputes.tsx.
    """

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="disputes",
    )
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="raised_disputes",
    )
    reason = models.TextField()
    value = models.PositiveIntegerField(help_text="Disputed value in UGX")
    status = models.CharField(max_length=10, choices=Status.choices, default="open")

    # Resolution
    resolution = models.TextField(blank=True, default="")
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_disputes",
    )

    opened_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tg_disputes"
        ordering = ["-opened_at"]

    def __str__(self):
        return f"D-{self.pk} · {self.reason[:50]} ({self.get_status_display()})"

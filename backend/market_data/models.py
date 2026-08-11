"""
market_data/models.py — Market reference prices.

Maps to frontend:
  - refPrices.ts → ReferencePrice model
  - PriceRail.tsx → live ticker display
  - Marketplace.tsx → "% below/above market reference" calculations
"""

from django.db import models


class ReferencePrice(models.Model):
    """
    Weekly market reference prices from InfoTrade Connect / WFP food price database.
    Maps to REF_PRICES in refPrices.ts.
    """

    name = models.CharField(max_length=100)  # "Tomatoes", "Maize grain"
    unit = models.CharField(max_length=20)   # "kg", "bunch"
    price = models.PositiveIntegerField(help_text="Current reference price in UGX")
    week_change = models.IntegerField(
        default=0,
        help_text="Percentage change from previous week (e.g. 6 = up 6%, -3 = down 3%)",
    )
    source = models.CharField(max_length=100, default="InfoTrade Connect")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tg_reference_prices"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} — UGX {self.price:,}/{self.unit} ({self.week_change:+d}%)"


class Category(models.Model):
    """
    Produce categories — matches CATEGORIES array in categories.tsx.
    Stored in DB so admin can add new ones without code deployment.
    """

    name = models.CharField(max_length=50, unique=True)  # "Fruits", "Vegetables"
    examples = models.TextField(
        blank=True,
        help_text="Example produce, e.g. 'Tomatoes, mangoes, avocados'",
    )
    color_tint = models.CharField(
        max_length=7,
        default="#DDE6D2",
        help_text="Hex colour for listing card backgrounds",
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "tg_categories"
        ordering = ["order"]
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

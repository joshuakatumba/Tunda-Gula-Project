"""
listings/models.py — Produce listings and pre-harvest plans.

Maps to frontend data structures:
  - SEED_LISTINGS → Listing model
  - SEED_PLANS   → PreHarvestPlan model
  - ListingForm.tsx fields → Listing fields
  - PlanForm.tsx fields → PreHarvestPlan fields
"""

from django.db import models
from django.conf import settings


class Listing(models.Model):
    """
    A produce listing posted by a verified seller.
    Maps 1:1 to seedData.ts SEED_LISTINGS structure.
    """

    class Category(models.TextChoices):
        FRUITS = "Fruits", "Fruits"
        VEGETABLES = "Vegetables", "Vegetables"
        CEREALS = "Cereals", "Cereals"
        LEGUMES = "Legumes", "Legumes"
        TUBERS = "Tubers", "Tubers"

    class Unit(models.TextChoices):
        KG = "kg", "Kilogram"
        BUNCH = "bunch", "Bunch"
        BAG = "bag", "Bag"
        HEAD = "head", "Head"
        TRAY = "tray", "Tray"

    # --- Core fields from ListingForm.tsx ---
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
        limit_choices_to={"role": "seller"},
    )
    name = models.CharField(max_length=200)  # "Fresh tomatoes"
    category = models.CharField(max_length=20, choices=Category.choices)
    quantity = models.PositiveIntegerField()  # available qty
    unit = models.CharField(max_length=10, choices=Unit.choices)
    price = models.PositiveIntegerField(help_text="Price per unit in UGX")
    description = models.TextField(blank=True, default="")  # "note" field in seed data

    # --- Media (from ListingForm.tsx) ---
    voice_duration = models.PositiveIntegerField(default=0, help_text="Voice note duration in seconds")
    voice_file = models.FileField(upload_to="listings/voice/", blank=True)

    # --- Location (inherited from seller, but can override) ---
    district = models.CharField(max_length=100)

    # --- Computed / display fields ---
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tg_listings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.seller.name} ({self.district})"

    @property
    def is_sold_out(self):
        return self.quantity <= 0


class ListingPhoto(models.Model):
    """Photos attached to a listing. Frontend: ListingForm.tsx → 'Take a photo'."""

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="listings/photos/")
    order = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tg_listing_photos"
        ordering = ["order"]

    def __str__(self):
        return f"Photo {self.order + 1} for {self.listing.name}"


class PreHarvestPlan(models.Model):
    """
    Pre-harvest listing — farmers list produce before it's harvested.
    Maps to SEED_PLANS and PlanForm.tsx.
    Buyers can reserve quantities with a deposit.
    """

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="harvest_plans",
        limit_choices_to={"role": "seller"},
    )
    name = models.CharField(max_length=200)  # "Green peppers"
    category = models.CharField(max_length=20, choices=Listing.Category.choices)
    district = models.CharField(max_length=100)

    # --- Dates ---
    date_planted = models.DateField()
    expected_harvest = models.DateField()

    # --- Quantities ---
    quantity = models.PositiveIntegerField(help_text="Expected total yield")
    reserved = models.PositiveIntegerField(default=0, help_text="Quantity reserved by buyers")
    unit = models.CharField(max_length=10, choices=Listing.Unit.choices)

    # --- Pricing ---
    price = models.PositiveIntegerField(help_text="Price per unit in UGX")
    deposit_percentage = models.PositiveSmallIntegerField(
        default=30,
        help_text="Deposit required to reserve (%)",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tg_harvest_plans"
        ordering = ["expected_harvest"]

    def __str__(self):
        return f"{self.name} — harvest {self.expected_harvest}"

    @property
    def available(self):
        return self.quantity - self.reserved

from django.contrib import admin
from .models import Listing, ListingPhoto, PreHarvestPlan


class ListingPhotoInline(admin.TabularInline):
    model = ListingPhoto
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "category", "quantity", "unit", "price", "district", "is_active", "created_at")
    list_filter = ("category", "district", "is_active")
    search_fields = ("name", "seller__name", "description")
    inlines = [ListingPhotoInline]


@admin.register(PreHarvestPlan)
class PreHarvestPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "category", "quantity", "reserved", "unit", "price", "expected_harvest", "is_active")
    list_filter = ("category", "district", "is_active")
    search_fields = ("name", "seller__name")

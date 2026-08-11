from django.contrib import admin
from .models import ReferencePrice, Category


@admin.register(ReferencePrice)
class ReferencePriceAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "price", "week_change", "source", "updated_at")
    list_editable = ("price", "week_change")
    search_fields = ("name",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "examples", "color_tint", "order")
    list_editable = ("order", "color_tint")

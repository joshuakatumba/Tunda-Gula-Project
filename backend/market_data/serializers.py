# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import ReferencePrice, Category


class ReferencePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferencePrice
        fields = ["id", "name", "unit", "price", "week_change", "source", "updated_at"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "examples", "color_tint"]

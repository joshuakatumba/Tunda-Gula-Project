import os
import requests
from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db.models import Avg
from market_data.models import ReferencePrice, PriceHistory
from listings.models import Listing


DEFAULT_BASELINE = [
    {"name": "Tomatoes", "unit": "kg", "base_price": 2800, "source": "Platform Avg"},
    {"name": "Maize grain", "unit": "kg", "base_price": 1500, "source": "Platform Avg"},
    {"name": "Cassava", "unit": "kg", "base_price": 1100, "source": "Platform Avg"},
    {"name": "Onions", "unit": "kg", "base_price": 2500, "source": "Platform Avg"},
    {"name": "Beans (Nambale)", "unit": "kg", "base_price": 3800, "source": "Platform Avg"},
    {"name": "Matooke", "unit": "bunch", "base_price": 15000, "source": "Platform Avg"},
    {"name": "Irish potatoes", "unit": "kg", "base_price": 2400, "source": "Platform Avg"},
    {"name": "Cabbage", "unit": "head", "base_price": 1500, "source": "Platform Avg"},
]


class Command(BaseCommand):
    help = "Updates market ReferencePrice & PriceHistory from external feed (MARKET_PRICE_API_URL) and live platform listings."

    def handle(self, *args, **kwargs):
        api_url = os.environ.get("MARKET_PRICE_API_URL", "").strip()
        api_key = os.environ.get("MARKET_PRICE_API_KEY", "").strip()
        items = []

        if api_url:
            try:
                headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
                res = requests.get(api_url, headers=headers, timeout=10)
                res.raise_for_status()
                payload = res.json()
                raw_list = payload if isinstance(payload, list) else payload.get("results", [])
                for row in raw_list:
                    if row.get("name") and row.get("price"):
                        items.append({
                            "name": row["name"],
                            "unit": row.get("unit", "kg"),
                            "price": int(row["price"]),
                            "source": row.get("source", "External Feed"),
                        })
            except Exception as exc:
                self.stderr.write(f"External price feed failed ({exc}); falling back to platform averages.")

        if not items:
            for row in DEFAULT_BASELINE:
                avg_price = (
                    Listing.objects.filter(is_active=True, name__icontains=row["name"].split()[0])
                    .aggregate(avg=Avg("price"))["avg"]
                )
                price = round((avg_price or row["base_price"]) / 50) * 50
                items.append({
                    "name": row["name"],
                    "unit": row["unit"],
                    "price": int(price),
                    "source": "TundaGula Live Avg" if avg_price else row["source"],
                })

        for item in items:
            existing = ReferencePrice.objects.filter(name=item["name"]).first()
            prev_price = existing.price if existing else item["price"]
            week_change = round(((item["price"] - prev_price) / prev_price) * 100) if prev_price else 0

            ref_price, created = ReferencePrice.objects.update_or_create(
                name=item["name"],
                defaults={
                    "unit": item["unit"],
                    "price": item["price"],
                    "week_change": week_change,
                    "source": item["source"],
                },
            )
            PriceHistory.objects.create(crop_name=ref_price.name, price=ref_price.price)
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action} {ref_price.name}: UGX {ref_price.price:,}/{ref_price.unit} ({week_change:+}%)"))

        cache.clear()
        self.stdout.write(self.style.SUCCESS("Market prices & history updated."))

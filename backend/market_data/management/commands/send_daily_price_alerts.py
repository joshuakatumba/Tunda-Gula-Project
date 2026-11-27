from django.core.management.base import BaseCommand
from accounts.models import User
from market_data.models import ReferencePrice
from notifications.sms import send_sms


class Command(BaseCommand):
    help = "Sends daily 6:00 AM market price & demand SMS alerts to verified farmers."

    def handle(self, *args, **kwargs):
        top_prices = list(ReferencePrice.objects.all()[:3])
        if not top_prices:
            self.stdout.write("No reference prices found.")
            return

        summary = " | ".join(
            f"{p.name}: UGX {p.price:,}/{p.unit} ({p.week_change:+d}%)" for p in top_prices
        )
        msg = f"TundaGula Today: {summary}. Open app to list or adjust prices."

        sellers = User.objects.filter(role="seller", is_active=True, is_verified=True).exclude(phone__isnull=True)
        sent = 0
        for seller in sellers:
            send_sms(seller.phone, msg)
            sent += 1

        self.stdout.write(self.style.SUCCESS(f"Sent daily market pulse to {sent} verified farmer(s)."))


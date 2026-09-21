"""
Management command to seed Day 1 demo accounts for TundaGula.
Creates sample accounts for Staff, Farmer (Seller), and Buyer.
"""

# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Seed initial accounts for Day 1 (Staff, Farmer, Buyer)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Day 1 accounts...")

        # 1. Staff Admin Account
        admin_phone = "+256700000000"
        admin_user, created = User.objects.get_or_create(
            phone=admin_phone,
            defaults={
                "name": "Staff Admin",
                "role": User.Role.ADMIN,
                "email": "admin@tundagula.ug",
                "is_staff": True,
                "is_superuser": True,
                "otp_verified": True,
            },
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Created staff account: {admin_phone}"))
        else:
            self.stdout.write(f"Staff account already exists: {admin_phone}")

        # 2. Farmer (Seller) Account
        farmer_phone = "+256772000001"
        farmer_user, created = User.objects.get_or_create(
            phone=farmer_phone,
            defaults={
                "name": "David Ssemakula",
                "role": User.Role.SELLER,
                "seller_type": User.SellerType.SMALLHOLDER,
                "district": "Wakiso",
                "nin": "CF9204119XKJ2E",
                "manual_location": "Kasangati, Gayaza road, 2 km past trading centre",
                "gps_lat": 0.4432,
                "gps_lng": 32.6021,
                "gps_pinned": True,
                "is_verified": True,
                "otp_verified": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created farmer account: {farmer_phone} ({farmer_user.name})"))
        else:
            self.stdout.write(f"Farmer account already exists: {farmer_phone}")

        # 3. Buyer Account
        buyer_phone = "+256782000002"
        buyer_user, created = User.objects.get_or_create(
            phone=buyer_phone,
            defaults={
                "name": "Nakato Grace",
                "role": User.Role.BUYER,
                "buyer_type": User.BuyerType.HOUSEHOLD,
                "district": "Kampala",
                "otp_verified": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created buyer account: {buyer_phone} ({buyer_user.name})"))
        else:
            self.stdout.write(f"Buyer account already exists: {buyer_phone}")

        self.stdout.write(self.style.SUCCESS("Day 1 accounts seeding complete."))

"""
accounts/models.py — Custom user model for TundaGula.

Maps to the frontend's Auth.tsx registration flow:
  - Roles: buyer, seller, admin
  - Seller types: smallholder, commercial, group, aggregator
  - Buyer types: household, restaurant, supermarket, cooperative
  - Phone-based authentication with OTP
  - Seller verification: NIN, phone, GPS
"""

# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager — phone number is the login identifier, no password by default."""

    def create_user(self, phone, role, **extra):
        if not phone:
            raise ValueError("Phone number is required")
        user = self.model(phone=phone, role=role, **extra)
        user.set_unusable_password()  # OTP-based auth — no password
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, role="admin", password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        user = self.model(phone=phone, role=role, **extra)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model — phone number as the primary identifier.
    Maps directly to the frontend's session object: { role, name, type, id }
    """

    class Role(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"
        ADMIN = "admin", "Admin"

    class SellerType(models.TextChoices):
        SMALLHOLDER = "smallholder", "Smallholder farmer"
        COMMERCIAL = "commercial", "Commercial farm"
        GROUP = "group", "Farmer group or cooperative"
        AGGREGATOR = "aggregator", "Aggregator or produce store"

    class BuyerType(models.TextChoices):
        HOUSEHOLD = "household", "Household"
        RESTAURANT = "restaurant", "Restaurant or hotel"
        SUPERMARKET = "supermarket", "Supermarket or retailer"
        COOPERATIVE = "cooperative", "Cooperative or institution"

    # --- Identity ---
    phone = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, default="")
    role = models.CharField(max_length=10, choices=Role.choices)
    seller_type = models.CharField(max_length=20, choices=SellerType.choices, blank=True, default="")
    buyer_type = models.CharField(max_length=20, choices=BuyerType.choices, blank=True, default="")

    # --- Seller-specific fields ---
    nin = models.CharField("National ID Number", max_length=20, blank=True, default="")
    district = models.CharField(max_length=100, blank=True, default="")
    gps_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    manual_location = models.CharField(max_length=300, blank=True, default="")

    # --- Verification status (seller) ---
    is_verified = models.BooleanField(default=False)
    nin_match = models.BooleanField("NIN name matches phone registration", default=False)
    otp_verified = models.BooleanField(default=False)
    gps_pinned = models.BooleanField(default=False)
    verification_submitted_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")

    # --- Django auth fields ---
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["name", "role"]

    class Meta:
        db_table = "tg_users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"

    @property
    def is_buyer(self):
        return self.role == self.Role.BUYER

    @property
    def is_farmer(self):
        return self.role == self.Role.SELLER

    @property
    def is_staff_member(self):
        return self.role == self.Role.ADMIN or self.is_staff


import hashlib
import secrets


class OTP(models.Model):
    """
    One-time password for phone verification.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        FAILED = "failed", "Failed"
        EXPIRED = "expired", "Expired"
        REVOKED = "revoked", "Revoked"

    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    # Auxiliary tracking fields
    code_hash = models.CharField(max_length=64, blank=True, default="")
    salt = models.CharField(max_length=32, blank=True, default="")
    verified_at = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    ip_address = models.CharField(max_length=45, blank=True, default="")
    user_agent = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = "tg_otps"
        ordering = ["-created_at"]

    def __str__(self):
        return f"OTP({self.status}) → {self.phone}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return (
            not self.is_used
            and not self.is_expired
            and self.attempts < 5
            and self.status == self.Status.PENDING
        )

    def check_code(self, submitted_code):
        """Constant-time verification of submitted code."""
        if not submitted_code:
            return False
        submitted_str = str(submitted_code).strip()
        if self.code:
            return secrets.compare_digest(self.code, submitted_str)
        if self.code_hash and self.salt:
            computed_hash = hashlib.sha256((submitted_str + self.salt).encode()).hexdigest()
            return secrets.compare_digest(self.code_hash, computed_hash)
        return False

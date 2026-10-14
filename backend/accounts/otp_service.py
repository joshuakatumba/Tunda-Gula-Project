"""
accounts/otp_service.py — Service for OTP generation, persistence, and SMS dispatch.

In test/dev mode (DEBUG=True or missing Twilio keys), SMS is printed to console.
In production, SMS is dispatched via Twilio Programmable Messaging.
"""

import logging
from datetime import timedelta
# pyrefly: ignore [missing-import]
from django.conf import settings
from django.utils import timezone

from .models import OTP
from .utils import clean_phone, get_client_ip, generate_secure_otp

logger = logging.getLogger(__name__)


def _is_test_mode():
    """Check if running in test/dev mode (no Twilio credentials configured)."""
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    twilio_phone = getattr(settings, "TWILIO_PHONE_NUMBER", "")
    return not (account_sid and auth_token and twilio_phone)


def send_otp(raw_phone: str, request=None) -> tuple:
    """
    Generate and send an OTP via SMS (or mock in dev mode).

    Handles:
    - Phone validation and normalization
    - Rate limiting (1-minute cooldown, 5/hour, 10/day, 15/IP)
    - Invalidation of previous OTPs
    - Secure OTP generation with salted hash
    - SMS dispatch (real or mock)

    Returns:
        tuple (success: bool, message: str, http_status_code: int)
    """
    if not raw_phone:
        return False, "Phone number is required.", 400

    phone = clean_phone(raw_phone)
    if not phone or len(phone) < 10:
        return False, "A valid phone number in E.164 format is required.", 400

    # --- Rate limiting ---
    now = timezone.now()

    # 1-minute cooldown: prevent rapid re-requests
    one_minute_ago = now - timedelta(minutes=1)
    recent_otp = OTP.objects.filter(phone=phone, created_at__gte=one_minute_ago).first()
    if recent_otp:
        return False, "Please wait 1 minute before requesting a new code.", 429

    # Hourly limit: max 5 OTPs per phone per hour
    one_hour_ago = now - timedelta(hours=1)
    hourly_count = OTP.objects.filter(phone=phone, created_at__gte=one_hour_ago).count()
    if hourly_count >= 5:
        return False, "Too many codes requested this hour. Try again later.", 429

    # Daily limit: max 10 OTPs per phone per day
    one_day_ago = now - timedelta(hours=24)
    daily_count = OTP.objects.filter(phone=phone, created_at__gte=one_day_ago).count()
    if daily_count >= 10:
        return False, "Daily code limit reached. Try again tomorrow.", 429

    # IP rate limit: max 15 OTPs per IP per hour
    if request:
        client_ip = get_client_ip(request)
        if client_ip:
            ip_count = OTP.objects.filter(
                ip_address=client_ip, created_at__gte=one_hour_ago
            ).count()
            if ip_count >= 15:
                return False, "Too many requests from your network. Try later.", 429

    # --- Invalidate previous OTPs for this phone ---
    OTP.objects.filter(phone=phone, is_used=False).update(
        is_used=True,
        status=OTP.Status.REVOKED,
    )

    # --- Generate secure OTP ---
    code, salt, code_hash = generate_secure_otp()
    expires_at = now + timedelta(minutes=5)

    ip_address = get_client_ip(request) if request else ""
    user_agent = ""
    if request:
        user_agent = request.META.get("HTTP_USER_AGENT", "")

    otp = OTP.objects.create(
        phone=phone,
        code=code,
        code_hash=code_hash,
        salt=salt,
        expires_at=expires_at,
        status=OTP.Status.PENDING,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # --- Send SMS ---
    if _is_test_mode():
        # Dev/test mode: log to console
        logger.info(f"MOCK SMS: OTP for {phone} is {code}")
        print(f"MOCK SMS: OTP for {phone} is {code}")
        return True, "OTP sent successfully", 200

    # Production: Twilio
    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioRestException

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f"Your Tunda Gula verification code is {code}. It expires in 5 minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone,
        )
        return True, "OTP sent successfully", 200
    except Exception as exc:
        logger.error("Error sending SMS to %s: %s", phone, str(exc), exc_info=True)
        otp.delete()
        return False, "Failed to send OTP via SMS. Please try again later.", 502


def verify_otp(raw_phone: str, raw_code: str) -> tuple:
    """
    Verify an OTP code for a phone number.

    Handles:
    - Input validation
    - Code matching (salted hash or plaintext fallback)
    - Expiry checking
    - Attempt tracking with lockout after 5 failures
    - OTP deletion on success

    Returns:
        tuple (success: bool, message: str, http_status_code: int)
    """
    if not raw_phone:
        return False, "Phone number is required.", 400

    if not raw_code:
        return False, "OTP code is required.", 400

    phone = clean_phone(raw_phone)
    code = str(raw_code).strip()

    if not phone or not code:
        return False, "Valid phone number and OTP code are required.", 400

    # Find the most recent OTP for the phone number
    otp = OTP.objects.filter(phone=phone).order_by("-created_at").first()
    if not otp:
        return False, "Invalid OTP", 400

    # Check if already locked out
    if otp.attempts >= 5:
        otp.is_used = True
        otp.status = OTP.Status.FAILED
        otp.save(update_fields=["is_used", "status"])
        return False, "Too many failed attempts. Request a new code.", 400

    # Check expiry
    if otp.is_expired or timezone.now() > otp.expires_at:
        otp.delete()
        return False, "OTP has expired", 400

    # Check code match (support both salted hash and plaintext)
    code_matches = False
    if otp.code_hash and otp.salt:
        code_matches = otp.check_code(code)
    elif otp.code:
        code_matches = (otp.code == code)

    if not code_matches:
        # Increment attempts
        otp.attempts += 1
        remaining = 5 - otp.attempts

        if otp.attempts >= 5:
            otp.is_used = True
            otp.status = OTP.Status.FAILED
            otp.save(update_fields=["attempts", "is_used", "status"])
            return False, "Too many failed attempts. Request a new code.", 400

        otp.save(update_fields=["attempts"])
        return False, f"Invalid OTP. {remaining} attempt(s) remaining.", 400

    # Success: delete the OTP so it cannot be reused
    otp.delete()

    return True, "OTP verified successfully", 200

"""
accounts/otp_service.py — Service for OTP generation, persistence, and Twilio Programmable Messaging dispatch.
"""

import logging
import secrets
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from .models import OTP
from .utils import clean_phone

logger = logging.getLogger(__name__)


def generate_otp_code() -> str:
    """
    Generate a cryptographically secure 6-digit numeric OTP using Python's secrets module.
    """
    return str(secrets.randbelow(900000) + 100000)


def send_otp(raw_phone: str) -> tuple[bool, str, int]:
    """
    1. Validate phone exists and normalize to E.164.
    2. Delete/replace previous active OTPs for that phone.
    3. Generate new 6-digit OTP with 5-minute expiry.
    4. Save new OTP to database.
    5. Send SMS through Twilio Programmable Messaging.
    6. Return success or appropriate error (never logging or exposing the OTP).

    Returns:
        tuple (success: bool, message: str, http_status_code: int)
    """
    if not raw_phone:
        return False, "Phone number is required.", 400

    phone = clean_phone(raw_phone)
    if not phone or len(phone) < 10:
        return False, "A valid phone number in E.164 format is required.", 400

    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    twilio_phone = getattr(settings, "TWILIO_PHONE_NUMBER", "")

    if not account_sid or not auth_token or not twilio_phone:
        if not getattr(settings, "DEBUG", False):
            logger.error(
                "Twilio configuration missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER is not set."
            )
            return False, "SMS service is not properly configured on the server.", 500

    # Delete / replace previous active OTPs for that phone
    OTP.objects.filter(phone=phone).delete()

    # Generate 6-digit numeric OTP
    code = generate_otp_code()

    # 5 minutes expiration
    expires_at = timezone.now() + timedelta(minutes=5)

    # Save new OTP
    otp = OTP.objects.create(
        phone=phone,
        code=code,
        expires_at=expires_at,
        status=OTP.Status.PENDING,
    )

    # Dispatch SMS via Twilio Programmable Messaging
    try:
        if not account_sid or not auth_token or not twilio_phone:
            # We are in DEBUG mode since we passed the earlier check
            logger.info(f"MOCK SMS: OTP for {phone} is {code}")
            print(f"MOCK SMS: OTP for {phone} is {code}")
            return True, "OTP sent successfully", 200
            
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=f"Your Tunda Gula verification code is {code}. It expires in 5 minutes.",
            from_=twilio_phone,
            to=phone,
        )
        return True, "OTP sent successfully", 200
    except TwilioRestException as exc:
        logger.error(
            "Twilio REST error sending SMS to %s: Code %s - %s",
            phone,
            getattr(exc, "code", "UNKNOWN"),
            getattr(exc, "msg", str(exc)),
        )
        # Invalidate OTP if SMS dispatch failed
        otp.delete()
        return False, "Failed to send OTP via SMS. Please verify your phone number or try again later.", 502
    except Exception as exc:
        logger.error(
            "Unexpected error sending SMS via Twilio to %s: %s",
            phone,
            str(exc),
            exc_info=True,
        )
        otp.delete()
        return False, "An error occurred while sending OTP. Please try again later.", 500


def verify_otp(raw_phone: str, raw_code: str) -> tuple[bool, str, int]:
    """
    1. Find the most recent OTP for the phone number.
    2. Check that the code matches.
    3. Check that the OTP has not expired.
    4. If valid, mark verification as successful.
    5. Delete the OTP after successful verification so it cannot be reused.
    6. Return success response.

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

    # 1. Find the most recent OTP for the phone number
    otp = OTP.objects.filter(phone=phone).order_by("-created_at").first()
    if not otp:
        return False, "Invalid OTP", 400

    # 2. Check that the code matches
    if not otp.check_code(code):
        return False, "Invalid OTP", 400

    # 3. Check that the OTP has not expired
    if otp.is_expired or timezone.now() > otp.expires_at:
        otp.delete()
        return False, "OTP has expired", 400

    # 4 & 5. Delete the OTP after successful verification so it cannot be reused
    otp.delete()

    # 6. Return success response
    return True, "OTP verified successfully", 200

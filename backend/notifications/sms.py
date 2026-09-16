# import africastalking  # Disabled — using Twilio for SMS
from django.conf import settings
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import logging

logger = logging.getLogger(__name__)


def send_sms(phone_number, message):
    """
    Sends an SMS via Twilio Programmable Messaging.
    Handles +256 formatting and safely degrades to print if DEV MODE.
    """
    if not phone_number:
        return

    # Format phone number (must include country code, e.g., +256)
    if phone_number.startswith("0"):
        phone_number = "+256" + phone_number[1:]
    elif not phone_number.startswith("+"):
        phone_number = "+" + phone_number

    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    twilio_phone = getattr(settings, "TWILIO_PHONE_NUMBER", "")

    # Attempt real SMS if Twilio keys exist
    if account_sid and auth_token and twilio_phone:
        try:
            client = Client(account_sid, auth_token)
            response = client.messages.create(
                body=message,
                from_=twilio_phone,
                to=phone_number,
            )
            print("SMS Sent:", response.sid)
            return response
        except TwilioRestException as e:
            logger.error(f"Twilio SMS Error to {phone_number}: {e}")
            return None
        except Exception as e:
            logger.error(f"SMS Error to {phone_number}: {e}")
            return None
    else:
        # Dev mode fallback
        print("\n" + "="*50)
        print(f"DEV MODE SMS to {phone_number}:")
        print(message)
        print("="*50 + "\n")
        return None
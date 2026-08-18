import africastalking
from django.conf import settings

def send_sms(phone_number, message):
    """
    Sends an SMS via Africa's Talking.
    Handles +256 formatting and safely degrades to print if DEV MODE.
    """
    if not phone_number:
        return

    # Format phone number for AT (must include country code, e.g., +256)
    if phone_number.startswith("0"):
        phone_number = "+256" + phone_number[1:]
    elif not phone_number.startswith("+"):
        phone_number = "+" + phone_number

    # Attempt real SMS if keys exist
    if getattr(settings, "AT_API_KEY", None) and getattr(settings, "AT_USERNAME", None):
        try:
            africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
            sms = africastalking.SMS
            response = sms.send(message, [phone_number])
            print("SMS Sent:", response)
            return response
        except Exception as e:
            print(f"SMS Error to {phone_number}: {e}")
            return None
    else:
        # Dev mode fallback
        print("\n" + "="*50)
        print(f"DEV MODE SMS to {phone_number}:")
        print(message)
        print("="*50 + "\n")
        return None
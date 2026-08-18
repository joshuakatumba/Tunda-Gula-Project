import africastalking from django.conf import settings

africastalking.initialize(
    settings.AT_API_KEY,
    settings.AT_USERNAME
)

sms = africastalking.SMS

def send_sms(phone_number, message):
    response = sms.send(
        message, [phone_number]
    )

    return response
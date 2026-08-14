from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Payment, Payout, PlatformSettings
from .serializers import PaymentSerializer, PayoutSerializer, PlatformSettingsSerializer


class InitiatePaymentView(generics.CreateAPIView):
    """
    POST /api/v1/payments/initiate/
    Buyer initiates a Mobile Money payment — maps to Checkout.tsx "Pay with mobile money".
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        from django.conf import settings
        import requests
        import uuid

        payment = serializer.save(status="pending")
        
        # Real MTN MoMo Collection API integration
        try:
            if settings.MTN_MOMO_API_KEY:
                # 1. Get Access Token
                token_res = requests.post(
                    "https://sandbox.momodeveloper.mtn.com/collection/token/",
                    auth=(settings.MTN_MOMO_API_KEY, settings.MTN_MOMO_API_SECRET)
                )
                token = token_res.json().get("access_token")
                
                # 2. Request to Pay
                ext_ref = str(uuid.uuid4())
                payment.external_ref = ext_ref
                payment.save()
                
                headers = {
                    "Authorization": f"Bearer {token}",
                    "X-Reference-Id": ext_ref,
                    "X-Target-Environment": "sandbox",
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": settings.MTN_MOMO_API_KEY
                }
                
                payload = {
                    "amount": str(payment.amount),
                    "currency": "UGX",
                    "externalId": ext_ref,
                    "payer": {
                        "partyIdType": "MSISDN",
                        "partyId": self.request.user.phone.replace("+", "")
                    },
                    "payerMessage": "Payment for Tunda Gula Order",
                    "payeeNote": "Tunda Gula Escrow"
                }
                
                requests.post(
                    "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
                    headers=headers,
                    json=payload
                )
            else:
                # DEV MODE: No keys, simulate successful hold
                payment.status = "held"
                payment.save()
                
        except Exception as e:
            payment.status = "failed"
            payment.save()


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def payment_webhook(request):
    """
    POST /api/v1/payments/webhook/
    Callback from MTN MoMo / Airtel Money API confirming payment status.
    """
    external_ref = request.data.get("external_ref")
    payment_status = request.data.get("status")  # "success" or "failed"

    try:
        payment = Payment.objects.get(external_ref=external_ref)
    except Payment.DoesNotExist:
        return Response({"error": "Unknown transaction"}, status=status.HTTP_404_NOT_FOUND)

    from django.utils import timezone

    if payment_status == "success":
        payment.status = "held"
        payment.confirmed_at = timezone.now()
    else:
        payment.status = "failed"

    payment.save()
    return Response({"message": "Webhook processed"})


class SellerPayoutsView(generics.ListAPIView):
    """
    GET /api/v1/payments/payouts/
    Seller views their payout history — maps to SellerPayouts.tsx.
    """
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payout.objects.filter(seller=self.request.user).select_related("order")


@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAdminUser])
def platform_settings(request):
    """
    GET/PATCH /api/v1/payments/settings/
    Admin views/updates commission rate and deposit default.
    Maps to AdminOverview.tsx sliders.
    """
    settings_obj = PlatformSettings.load()

    if request.method == "GET":
        return Response(PlatformSettingsSerializer(settings_obj).data)

    serializer = PlatformSettingsSerializer(settings_obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

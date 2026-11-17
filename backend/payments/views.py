import uuid
import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from accounts.permissions import IsPlatformAdmin
from .models import Payment, Payout, PlatformSettings
from .serializers import PaymentSerializer, PayoutSerializer, PlatformSettingsSerializer


class InitiatePaymentView(generics.CreateAPIView):
    """
    POST /api/v1/payments/initiate/
    Buyer initiates a Mobile Money payment for their own order.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        order = serializer.validated_data["order"]
        if order.buyer != self.request.user:
            raise ValidationError({"order": "You can only pay for your own orders."})
        if order.payments.filter(status__in=["held", "released"]).exists():
            raise ValidationError({"order": "This order has already been paid."})

        expected_amount = (
            order.deposit_amount if order.order_type == "preorder" else (order.total + order.delivery_fee)
        )
        submitted_amount = serializer.validated_data["amount"]
        if submitted_amount != expected_amount:
            raise ValidationError({
                "amount": f"Payment amount must be UGX {expected_amount:,}."
            })

        payment = serializer.save(status="pending")
        payer_phone = (payment.phone or self.request.user.phone or "").replace("+", "")

        try:
            if payment.provider == Payment.Provider.MTN and settings.MTN_MOMO_API_KEY:
                token_res = requests.post(
                    "https://sandbox.momodeveloper.mtn.com/collection/token/",
                    auth=(settings.MTN_MOMO_API_KEY, settings.MTN_MOMO_API_SECRET),
                    timeout=10,
                )
                token_res.raise_for_status()
                token = token_res.json().get("access_token")

                ext_ref = str(uuid.uuid4())
                payment.external_ref = ext_ref
                payment.save(update_fields=["external_ref"])

                headers = {
                    "Authorization": f"Bearer {token}",
                    "X-Reference-Id": ext_ref,
                    "X-Target-Environment": "sandbox",
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": settings.MTN_MOMO_API_KEY,
                }
                payload = {
                    "amount": str(payment.amount),
                    "currency": "UGX",
                    "externalId": ext_ref,
                    "payer": {"partyIdType": "MSISDN", "partyId": payer_phone},
                    "payerMessage": "Payment for Tunda Gula Order",
                    "payeeNote": "Tunda Gula Escrow",
                }
                pay_res = requests.post(
                    "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
                    headers=headers,
                    json=payload,
                    timeout=10,
                )
                pay_res.raise_for_status()
            else:
                # Dev / sandbox fallback when provider keys are not configured
                payment.status = "held"
                payment.confirmed_at = timezone.now()
                payment.save(update_fields=["status", "confirmed_at"])
        except Exception:
            payment.status = "failed"
            payment.save(update_fields=["status"])


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def payment_webhook(request):
    """POST /api/v1/payments/webhook/ — Mobile Money provider callback."""
    webhook_secret = getattr(settings, "PAYMENT_WEBHOOK_SECRET", "")
    auth_secret = request.headers.get("X-Webhook-Secret") or request.data.get("secret")
    if not settings.DEBUG and not webhook_secret:
        return Response({"error": "Webhook secret not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    if webhook_secret and auth_secret != webhook_secret:
        return Response({"error": "Unauthorized webhook signature"}, status=status.HTTP_403_FORBIDDEN)

    external_ref = request.data.get("external_ref")
    payment_status = request.data.get("status")
    if not external_ref:
        return Response({"error": "external_ref is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payment = Payment.objects.get(external_ref=external_ref)
    except Payment.DoesNotExist:
        return Response({"error": "Unknown transaction"}, status=status.HTTP_404_NOT_FOUND)

    if payment_status == "success":
        payment.status = "held"
        payment.confirmed_at = timezone.now()
        payment.save(update_fields=["status", "confirmed_at"])
    else:
        payment.status = "failed"
        payment.save(update_fields=["status"])
    return Response({"message": "Webhook processed"})


class SellerPayoutsView(generics.ListAPIView):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payout.objects.filter(seller=self.request.user).select_related("order")


@api_view(["GET", "PATCH"])
@permission_classes([IsPlatformAdmin])
def platform_settings(request):
    settings_obj = PlatformSettings.load()
    if request.method == "GET":
        return Response(PlatformSettingsSerializer(settings_obj).data)
    serializer = PlatformSettingsSerializer(settings_obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

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
        # TODO: Call MTN MoMo / Airtel Money API here
        # For now, auto-set to "held" (simulating successful payment)
        serializer.save(status="held")


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

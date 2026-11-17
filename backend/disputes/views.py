from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsPlatformAdmin
from .models import Dispute
from .serializers import DisputeSerializer


class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Dispute.objects.none()
        if user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin":
            return Dispute.objects.all().select_related("raised_by", "resolved_by", "order")
        return Dispute.objects.filter(raised_by=user).select_related("order")

    def perform_create(self, serializer):
        serializer.save(raised_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsPlatformAdmin])
    @transaction.atomic
    def resolve(self, request, pk=None):
        dispute = self.get_object()
        resolution = request.data.get("resolution", "")
        if not resolution:
            return Response({"error": "Resolution text is required"}, status=status.HTTP_400_BAD_REQUEST)

        dispute.status = "resolved"
        dispute.resolution = resolution
        dispute.resolved_by = request.user
        dispute.resolved_at = timezone.now()
        dispute.save()

        from payments.models import Payment, Payout, PlatformSettings
        payment = Payment.objects.filter(order=dispute.order, status="held").first()
        action_type = str(request.data.get("action", "")).lower()
        res_lower = resolution.lower()
        if not action_type:
            if "release" in res_lower and "refund" not in res_lower:
                action_type = "release"
            elif "refund" in res_lower:
                action_type = "refund"

        if payment:
            if action_type == "refund":
                payment.status = "refunded"
                payment.save(update_fields=["status"])
            elif action_type == "release":
                payment.status = "released"
                payment.save(update_fields=["status"])
                settings_obj = PlatformSettings.load()
                commission_rate = settings_obj.commission_rate
                gross_amount = payment.amount
                commission_amount = int(gross_amount * (commission_rate / 100))
                Payout.objects.get_or_create(
                    order=dispute.order,
                    defaults={
                        "seller": dispute.order.seller,
                        "gross_amount": gross_amount,
                        "commission_rate": commission_rate,
                        "commission_amount": commission_amount,
                        "net_amount": gross_amount - commission_amount,
                        "status": "sent",
                        "payout_phone": dispute.order.seller.phone or "",
                        "sent_at": timezone.now(),
                    },
                )

        from notifications.sms import send_sms
        message = f"Dispute for {dispute.order.item_name} resolved: {resolution}"
        if dispute.order.buyer and dispute.order.buyer.phone:
            send_sms(dispute.order.buyer.phone, message)
        if dispute.order.seller and dispute.order.seller.phone:
            send_sms(dispute.order.seller.phone, message)

        return Response(DisputeSerializer(dispute).data)

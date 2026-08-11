from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Dispute
from .serializers import DisputeSerializer


class DisputeViewSet(viewsets.ModelViewSet):
    """
    /api/v1/disputes/

    Buyers/sellers can create disputes.
    Admins can view all and resolve them — maps to AdminDisputes.tsx.
    """
    serializer_class = DisputeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Dispute.objects.all().select_related("raised_by", "resolved_by", "order")
        return Dispute.objects.filter(raised_by=user).select_related("order")

    def perform_create(self, serializer):
        serializer.save(raised_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        """
        POST /api/v1/disputes/<id>/resolve/
        Admin resolves a dispute — maps to ResolveModal.tsx.
        """
        dispute = self.get_object()
        resolution = request.data.get("resolution", "")

        if not resolution:
            return Response(
                {"error": "Resolution text is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone
        dispute.status = "resolved"
        dispute.resolution = resolution
        dispute.resolved_by = request.user
        dispute.resolved_at = timezone.now()
        dispute.save()

        # TODO: Send SMS to both buyer and seller with the decision
        return Response(DisputeSerializer(dispute).data)

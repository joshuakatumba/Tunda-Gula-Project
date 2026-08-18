from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    PendingVerificationSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/accounts/register/
    Multi-step registration — matches Auth.tsx flow.
    Returns auth token + user profile on success.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        profile = UserProfileSerializer(user).data
        return Response(
            {"token": token.key, "user": profile},
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_otp(request):
    """
    POST /api/v1/accounts/otp/request/
    Send a 6-digit OTP to the provided phone number via Africa's Talking.
    """
    phone = request.data.get("phone")
    if not phone:
        return Response({"error": "Phone number required"}, status=status.HTTP_400_BAD_REQUEST)

    # Format phone number for AT (must include country code, e.g., +256)
    if phone.startswith("0"):
        phone = "+256" + phone[1:]
    elif not phone.startswith("+"):
        phone = "+" + phone

    import random
    from django.utils import timezone
    from datetime import timedelta
    from .models import OTP
    from django.conf import settings
    from notifications.sms import send_sms

    code = str(random.randint(100000, 999999))
    message = f"Your Tunda Gula verification code is {code}. It expires in 10 minutes."
    
    send_sms(phone, message)

    # Fallback response message (handled by sms.py internally)

    OTP.objects.create(
        phone=phone,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    return Response({"message": "OTP sent successfully"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_otp(request):
    """
    POST /api/v1/accounts/otp/verify/
    Verify the 6-digit OTP and return auth token + session data.
    """
    phone = request.data.get("phone")
    code = request.data.get("code")

    from .models import OTP
    otp = OTP.objects.filter(phone=phone, code=code, is_used=False).order_by("-created_at").first()

    if not otp or otp.is_expired:
        return Response({"error": "Invalid or expired code"}, status=status.HTTP_400_BAD_REQUEST)

    otp.is_used = True
    otp.save()

    # Find or flag the user
    try:
        user = User.objects.get(phone=phone)
        user.otp_verified = True
        user.save()
        token, _ = Token.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(user)
        return Response({"token": token.key, "user": serializer.data})
    except User.DoesNotExist:
        # Phone verified but no account yet — frontend should proceed to registration
        return Response({"verified": True, "phone": phone})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """
    GET /api/v1/accounts/me/
    Return the current user's profile — maps to frontend session.
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


class PendingVerificationsView(generics.ListAPIView):
    """
    GET /api/v1/accounts/pending/
    Admin-only: list sellers awaiting verification.
    Maps to frontend's AdminVerify.tsx component.
    """
    serializer_class = PendingVerificationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(role="seller", is_verified=False).exclude(
            verification_submitted_at=None
        ).order_by("-verification_submitted_at")


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def approve_seller(request, pk):
    """POST /api/v1/accounts/<id>/approve/ — Admin approves a seller."""
    from django.utils import timezone
    try:
        user = User.objects.get(pk=pk, role="seller")
        user.is_verified = True
        user.verified_at = timezone.now()
        user.save()
        
        from notifications.sms import send_sms
        send_sms(user.phone, "Your TundaGula account is verified. You can start listing produce today.")
        
        return Response({"message": f"{user.name} approved"})
    except User.DoesNotExist:
        return Response({"error": "Seller not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def reject_seller(request, pk):
    """POST /api/v1/accounts/<id>/reject/ — Admin rejects a seller with reason."""
    reason = request.data.get("reason", "")
    try:
        user = User.objects.get(pk=pk, role="seller")
        user.rejection_reason = reason
        user.save()
        
        from notifications.sms import send_sms
        send_sms(user.phone, f"Verification not approved: {reason}. Reply HELP or visit an agent to fix it.")
        
        return Response({"message": f"{user.name} rejected"})
    except User.DoesNotExist:
        return Response({"error": "Seller not found"}, status=status.HTTP_404_NOT_FOUND)


# pyrefly: ignore [missing-import]
from datetime import timedelta
# pyrefly: ignore [missing-import]
from django.db import transaction
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import api_view, permission_classes
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.authtoken.models import Token
from django.conf import settings as django_settings
from notifications.sms import send_sms


def _token_expires_at(token):
    """Compute when a token expires based on SESSION_TOKEN_LIFETIME."""
    lifetime = getattr(django_settings, "SESSION_TOKEN_LIFETIME", timedelta(days=7))
    return (token.created + lifetime).isoformat()
from .models import User, OTP
from .utils import (
    clean_phone,
    get_client_ip,
    generate_secure_otp,
    make_verification_token,
)
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
        user.otp_verified = True
        user.save(update_fields=["otp_verified"])
        token, _ = Token.objects.get_or_create(user=user)
        profile = UserProfileSerializer(user).data
        return Response(
            {"token": token.key, "user": profile, "expires_at": _token_expires_at(token)},
            status=status.HTTP_201_CREATED,
        )


from . import otp_service


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def send_otp_view(request):
    """
    POST /send-otp/ and POST /api/v1/accounts/otp/request/
    1. Validate that phone exists.
    2. Generate a new OTP.
    3. Delete/replace previous active OTPs for that phone.
    4. Save the new OTP.
    5. Send the SMS through Twilio Programmable Messaging.
    6. Return a success response without exposing OTP or printing to console.
    """
    raw_phone = request.data.get("phone")
    if not raw_phone:
        return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

    success, message, code = otp_service.send_otp(raw_phone)
    if not success:
        return Response({"error": message}, status=code)

    return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)


# Alias for backwards compatibility with existing frontend / accounts routing
request_otp = send_otp_view


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_otp_view(request):
    """
    POST /verify-otp/ and POST /api/v1/accounts/otp/verify/
    1. Find the most recent OTP for the phone number.
    2. Check that the code matches.
    3. Check that the OTP has not expired.
    4. If valid, mark verification as successful.
    5. Delete the OTP after successful verification so it cannot be reused.
    6. Authenticate user if account exists, or return verification proof for registration.
    """
    raw_phone = request.data.get("phone")
    raw_code = request.data.get("code")

    if not raw_phone:
        return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not raw_code:
        return Response({"error": "OTP code is required."}, status=status.HTTP_400_BAD_REQUEST)

    success, message, code = otp_service.verify_otp(raw_phone, raw_code)
    if not success:
        return Response({"error": message}, status=code)

    # Clean phone for user lookup
    phone = clean_phone(raw_phone)
    user = User.objects.filter(phone=phone).first()

    if user:
        if not user.is_active:
            return Response({"error": "Account is disabled. Please contact support."}, status=status.HTTP_403_FORBIDDEN)
        user.otp_verified = True
        user.save(update_fields=["otp_verified"])
        token, _ = Token.objects.get_or_create(user=user)
        profile = UserProfileSerializer(user).data
        return Response({
            "message": "OTP verified successfully",
            "token": token.key,
            "user": profile,
            "expires_at": _token_expires_at(token),
        }, status=status.HTTP_200_OK)
    else:
        # Issue signed cryptographic proof for registration
        verification_token = make_verification_token(phone)
        return Response({
            "message": "OTP verified successfully",
            "verified": True,
            "phone": phone,
            "verification_token": verification_token,
        }, status=status.HTTP_200_OK)


# Alias for backwards compatibility with existing frontend / accounts routing
verify_otp = verify_otp_view


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
    # pyrefly: ignore [missing-import]
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


# ---------------------------------------------------------------------------
# Session management — refresh, logout, logout-all
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refresh_token(request):
    """
    POST /api/v1/accounts/token/refresh/
    Delete the current token and issue a fresh one.
    Returns the new token key and its expiry timestamp.
    """
    Token.objects.filter(user=request.user).delete()
    new_token = Token.objects.create(user=request.user)
    return Response({
        "token": new_token.key,
        "expires_at": _token_expires_at(new_token),
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    POST /api/v1/accounts/logout/
    Delete the current token (single device logout).
    """
    Token.objects.filter(user=request.user).delete()
    return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_all(request):
    """
    POST /api/v1/accounts/logout-all/
    Delete ALL tokens for the user (multi-device logout).
    """
    deleted_count, _ = Token.objects.filter(user=request.user).delete()
    return Response({
        "message": f"Logged out from all devices. {deleted_count} session(s) ended."
    }, status=status.HTTP_200_OK)

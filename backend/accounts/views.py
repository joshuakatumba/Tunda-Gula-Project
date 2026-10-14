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
# pyrefly: ignore [missing-import]
from django.conf import settings as django_settings
from notifications.sms import send_sms


def _token_expires_at(token):
    """Compute when a token expires based on SESSION_TOKEN_LIFETIME."""
    lifetime = getattr(django_settings, "SESSION_TOKEN_LIFETIME", timedelta(days=7))
    return (token.created + lifetime).isoformat()


def _get_fresh_token(user):
    """Return a valid token for the user, replacing any expired one."""
    lifetime = getattr(django_settings, "SESSION_TOKEN_LIFETIME", timedelta(days=7))
    token = Token.objects.filter(user=user).first()
    if token and lifetime and timezone.now() > token.created + lifetime:
        token.delete()
        token = None
    return token or Token.objects.create(user=user)
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


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    POST /api/v1/accounts/login/
    Standard email and password login flow.
    Supports email or phone lookup.
    """
    identifier = request.data.get("email") or request.data.get("phone") or request.data.get("username")
    password = request.data.get("password")

    if not identifier:
        return Response({"error": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not password:
        return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

    identifier_str = str(identifier).strip()
    user = User.objects.filter(email__iexact=identifier_str).first()
    if not user:
        clean_id = clean_phone(identifier_str)
        if clean_id:
            user = User.objects.filter(phone=clean_id).first()

    if not user or not user.check_password(password):
        return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({"error": "Account is disabled. Please contact support."}, status=status.HTTP_403_FORBIDDEN)

    token = _get_fresh_token(user)
    profile = UserProfileSerializer(user).data
    return Response({
        "message": "Login successful",
        "token": token.key,
        "user": profile,
        "expires_at": _token_expires_at(token),
    }, status=status.HTTP_200_OK)


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

    success, message, code = otp_service.send_otp(raw_phone, request=request)
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
        token = _get_fresh_token(user)
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

    def _wants_verified(self):
        value = self.request.query_params.get("is_verified")
        return value is not None and value.lower() in ("true", "1")

    @property
    def paginator(self):
        # Map consumers need every verified farmer, not just page 1.
        if self._wants_verified():
            return None
        return super().paginator

    def get_queryset(self):
        if self._wants_verified():
            return User.objects.filter(
                role="seller", is_verified=True,
                gps_lat__isnull=False, gps_lng__isnull=False,
            ).order_by("-id")
        return User.objects.filter(role="seller", is_verified=False).exclude(
            verification_submitted_at=None
        ).order_by("-verification_submitted_at")


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def toggle_active(request, pk):
    """POST /api/v1/accounts/<id>/toggle-active/ — Admin suspends or reactivates an account."""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    if user.pk == request.user.pk or user.is_staff:
        return Response({"error": "Staff accounts cannot be suspended here."}, status=status.HTTP_400_BAD_REQUEST)
    user.is_active = not user.is_active
    user.save(update_fields=["is_active"])
    if not user.is_active:
        Token.objects.filter(user=user).delete()
    return Response({"id": user.pk, "is_active": user.is_active})


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


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_platform_stats(request):
    """
    GET /api/v1/accounts/admin/stats/
    Returns real-time dynamic platform KPIs for AdminOverview.
    """
    from orders.models import Order
    from payments.models import PlatformSettings
    from django.db.models import Sum, F

    settings = PlatformSettings.load()
    commission_rate = settings.commission_rate
    default_deposit = settings.default_deposit_percentage

    paid_orders = Order.objects.filter(status=Order.Status.DELIVERED)
    gmv_agg = paid_orders.aggregate(total=Sum(F("quantity") * F("price_per_unit")))
    gmv = gmv_agg["total"] or 0
    platform_revenue = int(gmv * (commission_rate / 100))

    total_orders = Order.objects.count()
    verified_sellers = User.objects.filter(role="seller", is_verified=True).count()
    pending_sellers = User.objects.filter(role="seller", is_verified=False).count()
    total_buyers = User.objects.filter(role="buyer").count()

    # Dynamic weekly volume (last 4 calendar weeks)
    now = timezone.now()
    weekly_volume = []
    for i in range(3, -1, -1):
        start_w = now - timedelta(days=(i + 1) * 7)
        end_w = now - timedelta(days=i * 7)
        w_num = (now - timedelta(days=i * 7)).isocalendar()[1]
        cnt = Order.objects.filter(placed_at__gte=start_w, placed_at__lt=end_w).count()
        weekly_volume.append({"week": w_num, "count": cnt})

    return Response({
        "gmv": gmv,
        "platform_revenue": platform_revenue,
        "commission_rate": commission_rate,
        "default_deposit": default_deposit,
        "total_orders": total_orders,
        "verified_sellers": verified_sellers,
        "pending_sellers": pending_sellers,
        "total_buyers": total_buyers,
        "weekly_volume": weekly_volume,
    })


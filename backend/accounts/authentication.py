"""
accounts/authentication.py — Expiring Token Authentication.

Extends DRF's TokenAuthentication to enforce token expiry.
Tokens older than SESSION_TOKEN_LIFETIME (default 7 days) are rejected
with a distinguishable error code so the frontend can attempt a refresh.
"""

from datetime import timedelta

# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.contrib.auth.backends import ModelBackend
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework.authentication import TokenAuthentication
# pyrefly: ignore [missing-import]
from rest_framework.exceptions import AuthenticationFailed

from .utils import clean_phone


class EmailOrPhoneBackend(ModelBackend):
    """Authenticate using either email address or normalized phone number."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        identifier = username or kwargs.get("email") or kwargs.get("phone")
        if not identifier or not password:
            return None

        identifier_str = str(identifier).strip()
        user = User.objects.filter(email__iexact=identifier_str).first()
        if not user:
            normalized_phone = clean_phone(identifier_str)
            if normalized_phone:
                user = User.objects.filter(phone=normalized_phone).first()

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


class ExpiringTokenAuthentication(TokenAuthentication):
    """
    Same as DRF TokenAuthentication, but rejects tokens
    older than SESSION_TOKEN_LIFETIME.
    """

    def authenticate_credentials(self, key):
        from django.conf import settings

        model = self.get_model()
        token_lifetime = getattr(settings, "SESSION_TOKEN_LIFETIME", timedelta(days=7))

        try:
            token = model.objects.select_related("user").get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed({"detail": "Invalid token.", "code": "token_invalid"})

        if not token.user.is_active:
            raise AuthenticationFailed({"detail": "User account is disabled.", "code": "user_inactive"})

        # Check expiry
        if token_lifetime and timezone.now() > (token.created + token_lifetime):
            raise AuthenticationFailed({"detail": "Token has expired.", "code": "token_expired"})

        return (token.user, token)

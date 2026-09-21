"""
accounts/authentication.py — Expiring Token Authentication.

Extends DRF's TokenAuthentication to enforce token expiry.
Tokens older than SESSION_TOKEN_LIFETIME (default 7 days) are rejected
with a distinguishable error code so the frontend can attempt a refresh.
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


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

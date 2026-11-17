from rest_framework import permissions


class IsPlatformAdmin(permissions.BasePermission):
    """Allow access to Django staff/superusers or users with role='admin'."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin")
        )


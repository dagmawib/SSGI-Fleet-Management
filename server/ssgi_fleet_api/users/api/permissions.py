from rest_framework import permissions
from django.core.exceptions import PermissionDenied
from ssgi_fleet_api.users.models import User  # Import the User model

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to SuperAdmin users.
    Includes fallback to Django's is_superuser flag for backward compatibility.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Check both role and is_superuser flag
        return (request.user.role == User.Role.SUPERADMIN or 
                request.user.is_superuser)

class IsRegularAdmin(permissions.BasePermission):
    """
    Allows access only to Admin users (non-SuperAdmin).
    Explicitly blocks SuperAdmins from admin-only endpoints.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Admin but not SuperAdmin
        return (request.user.role == User.Role.ADMIN and 
                not request.user.is_superuser and
                request.user.role != User.Role.SUPERADMIN)
from rest_framework.permissions import BasePermission
from users.models import User

class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.Role.ADMIN, User.Role.SUPERADMIN]
    
class IsDriver(BasePermission):
    def has_permission(self, request, view):
        return  request.user.is_authenticated and request.user.role == User.Role.DRIVER


# server/ssgi_fleet_api/assignment/api/permissions.py
class IsDriverOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == User.Role.DRIVER or
            request.user.role in [User.Role.ADMIN, User.Role.SUPERADMIN]
        )
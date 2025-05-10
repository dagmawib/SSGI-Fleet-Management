from rest_framework.permissions import BasePermission
from users.models import User

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.EMPLOYEE

class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.DIRECTOR

class IsEmployeeOrDirector(BasePermission):
    def has_permission(self, request, view):
        return IsEmployee().has_permission(request, view) or IsDirector().has_permission(request, view)

    
class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'superadmin']
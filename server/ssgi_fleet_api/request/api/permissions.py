
from rest_framework.permissions import BasePermission

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employee'

class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'
    
class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'superadmin']
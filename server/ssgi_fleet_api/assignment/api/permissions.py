from rest_framework.permissions import BasePermission
from users.models import User

class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.Role.ADMIN, User.Role.SUPERADMIN]
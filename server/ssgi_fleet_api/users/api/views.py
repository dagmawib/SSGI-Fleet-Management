from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from django.utils.crypto import get_random_string
from drf_spectacular.utils import extend_schema


from .permissions import IsSuperAdmin
from users.models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    SuperAdminRegistrationSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    TemporaryPasswordSerializer,
)
from .docs import (
    super_admin_register_docs,
    user_profile_docs,
    logout_docs,
    user_list_docs,
    user_detail_docs,
    token_obtain_docs,
    user_login_docs,
)


@extend_schema(
    responses=TemporaryPasswordSerializer
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsSuperAdmin])
def generate_temp_password(request):
    password = get_random_string(8)
    return Response({'temporary_password': password})

class SuperAdminRegistrationView(generics.CreateAPIView):
    """Endpoint exclusively for SuperAdmins to register any type of user."""

    serializer_class = SuperAdminRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    @super_admin_register_docs
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = serializer.save()
        if hasattr(user, "temporary_password"):
            print(
                f"Created user {user.email} with temp password: {user.temporary_password}"
            )

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Allows authenticated users to view and modify their own profile."""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @user_profile_docs
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @user_profile_docs
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @user_profile_docs
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    def get_object(self):
        return self.request.user




class LogoutView(APIView):
    """Invalidates the provided refresh token to log out the user."""

    permission_classes = [permissions.IsAuthenticated]

    @logout_docs
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListCreateAPIView):
    """
    Provides list and create operations for user accounts.
    - List: Returns paginated users with filtering by department and role
    - Create: Allows admin user creation
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    queryset = User.objects.select_related('department').order_by('-date_joined')
    filterset_fields = ['department', 'role']
    search_fields = ['email', 'first_name', 'last_name']

    @user_list_docs
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @user_list_docs
    def post(self, request, *args, **kwargs):
        self.serializer_class = UserCreateSerializer
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        department_id = self.request.query_params.get('department_id')
        role = self.request.query_params.get('role')
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if role:
            queryset = queryset.filter(role=role)
            
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Provides detailed view and modification of user accounts.
    - GET: Retrieve user details
    - PUT/PATCH: Update user details
    - DELETE: Deactivate user (consider soft delete)
    """
    queryset = User.objects.select_related('department')
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    @user_detail_docs
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @user_detail_docs
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @user_detail_docs
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @user_detail_docs
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {"error": "You cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.is_active = False 
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        if instance == self.request.user:
            return Response(
                {"error": "You cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Customized JWT token obtain view with enhanced documentation."""

    serializer_class = CustomTokenObtainPairSerializer

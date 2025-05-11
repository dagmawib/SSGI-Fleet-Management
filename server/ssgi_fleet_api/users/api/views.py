from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from django.utils.crypto import get_random_string
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.decorators import action
# from .docs import get_user_detail_docs
from django.db import transaction


from .permissions import IsSuperAdmin
from users.models import User, Department
from .serializers import (
    CustomTokenObtainPairSerializer,
    SuperAdminRegistrationSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    TemporaryPasswordSerializer,
    DepartmentSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .docs import (
    super_admin_register_docs,
    user_profile_docs,
    logout_docs,
    user_list_docs,
    user_detail_docs,
    user_delete_docs,
    user_restore_docs,
    forgot_password_docs,
    reset_password_docs,
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
    
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserProfileSerializer

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
    Admin-only endpoint for comprehensive user management
    """
    queryset = User.objects.select_related('department')
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    # @extend_schema(**user_detail_docs['get'])
    @user_detail_docs['get']
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    # @extend_schema(**user_detail_docs['put'])
    @user_detail_docs['put']
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    # @extend_schema(**user_detail_docs['patch'])
    @user_detail_docs['patch']
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    # @extend_schema(**user_delete_docs)  # Now correctly using a dictionary
    @user_delete_docs
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if instance == request.user:
            return Response(
                {"error": "You cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        with transaction.atomic():
            user_id = instance.pk
            instance.is_active = False
            instance.email = f"deleted_{instance.pk}_{instance.email}"
            instance.set_unusable_password()
            instance.save(update_fields=['is_active', 'email', 'password'])
        
        return Response(
            {
                "status": "success",
                "message": "User account deactivated",
                "user_id": user_id,
                "can_be_restored": True
            },
            status=status.HTTP_200_OK
        )
    
    @user_restore_docs
    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk, is_active=False)
        except User.DoesNotExist:
            return Response(
                {"error": "No inactive user found with this ID"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.is_active:
            return Response(
                {"error": "User is already active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Restore original email format
            if user.email.startswith('deleted_'):
                original_email = user.email.split('_', 2)[-1]
                user.email = original_email
            
            user.is_active = True
            user.save()

            # Create password reset token instead of temporary password
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.http import urlsafe_base64_encode
            from django.utils.encoding import force_bytes
            
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Send password reset email
            self._send_restoration_email(user, uid, token)

        return Response(
            {
                "status": "success",
                "message": "User account restored",
                "user_id": user.pk,
                "email": user.email,
                "password_reset_required": True,
                "reset_link": f"/password-reset/{uid}/{token}/"  
            },
            status=status.HTTP_200_OK
        )



class CustomTokenObtainPairView(TokenObtainPairView):
    """Customized JWT token obtain view with enhanced documentation."""
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            data = serializer.validate(request.data)
            return Response(data, status=data.get('status_code', 200))
        except Exception as e:
            return Response({   
                    "status": False,
                    "error": "validation_error",
                    "message": str(e),
                    "status_code": 400
            }, status=400)

@extend_schema(
    summary="List all departments",
    description="Returns a list of all departments in the system. Each department includes id, name, description, and director.",
    responses={
        200: OpenApiResponse(
            response=DepartmentSerializer(many=True),
            description="A list of departments [{id, name, description, director}]"
        )
    },
    tags=["Departments"]
)
@api_view(["GET"])
def list_departments(request):
    """
    List all departments in the system.
    Returns: [{"id": ..., "name": ..., "description": ..., "director": ...}]
    """
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)

@forgot_password_docs
class ForgotPasswordAPIView(APIView):
    """Endpoint to request a password reset link."""
    permission_classes = []
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Always return generic message for security
        return Response({"message": "If an account with that email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)

@reset_password_docs
class ResetPasswordAPIView(APIView):
    """Endpoint to reset password using token and uid."""
    permission_classes = []
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password has been reset successfully. You can now log in with your new password."}, status=status.HTTP_200_OK)

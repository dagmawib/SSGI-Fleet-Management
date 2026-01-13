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
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import traceback

from users.api.permissions import IsSuperAdmin
from users.models import User, Department
from users.api.serializers import (
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
from users.api.docs import (
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
    try:
        password = get_random_string(8)
        return Response({'temporary_password': password})
    except Exception as e:
        print(f"[generate_temp_password] Unexpected error: {e}")
        return Response({"detail": "Unexpected server error.", "error": str(e)}, status=500)

class SuperAdminRegistrationView(generics.CreateAPIView):
    """Endpoint exclusively for SuperAdmins to register any type of user."""

    serializer_class = SuperAdminRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    @super_admin_register_docs
    def post(self, request, *args, **kwargs):
        from rest_framework import serializers as drf_serializers
        try:
            response = super().post(request, *args, **kwargs)
            # If the serializer created a user with a temporary password, mention that in the response
            if hasattr(response, 'data') and response.data:
                user_email = response.data.get('email') or response.data.get('username')
                temp_password = response.data.get('temporary_password')
                if temp_password:
                    response.data['message'] = (
                        f"A welcome email has been sent to {user_email}. "
                        f"The user should log in with the temporary password and change it immediately."
                    )
                    response.data['welcome_email_sent'] = True
                else:
                    response.data['welcome_email_sent'] = False
            return response
        except drf_serializers.ValidationError as ve:
            print(f"[SuperAdminRegistrationView][POST] Validation error: {ve}")
            return Response({"detail": ve.detail}, status=400)
        except Exception as e:
            print(f"[SuperAdminRegistrationView][POST] Unexpected error: {e}")
            return Response({"detail": "Unexpected server error.", "error": str(e)}, status=500)

    def perform_create(self, serializer):
        try:
            user = serializer.save()
            if hasattr(user, "temporary_password"):
                print(
                    f"Created user {user.email} with temp password: {user.temporary_password}"
                )
        except Exception as e:
            print(f"[SuperAdminRegistrationView] Error in perform_create: {e}")
            raise

class CustomTokenObtainPairView(TokenObtainPairView):
    """Customized JWT token obtain view with enhanced documentation."""
    serializer_class = CustomTokenObtainPairSerializer

    @method_decorator(csrf_exempt)
    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            data = serializer.validate(request.data)
            return Response(data, status=data.get('status_code', 200))
        except Exception as e:
            print(f"[CustomTokenObtainPairView][POST] Unexpected error: {e}")
            traceback.print_exc()
            return Response({
                "status": False,
                "error": "validation_error",
                "message": str(e),
                "status_code": 400
            }, status=400)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Allows authenticated users to view and modify their own profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        try:
            if self.request.method in ['PUT', 'PATCH']:
                return UserProfileUpdateSerializer
            return UserProfileSerializer
        except Exception as e:
            print(f"[UserProfileView] Error in get_serializer_class: {e}")
            # Fallback to base serializer
            return UserProfileSerializer

    def get_object(self):
        try:
            return self.request.user
        except Exception as e:
            print(f"[UserProfileView] Error in get_object: {e}")
            raise

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserProfileView] Error in retrieve: {e}")
            return Response({"detail": "Unexpected server error.", "error": str(e)}, status=500)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserProfileView] Error in update: {e}")
            return Response({"detail": "Unexpected server error.", "error": str(e)}, status=500)


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
            return Response({"message": "Logged out"}, status=status.HTTP_200_OK)
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
    queryset = User.objects.select_related('department').order_by('-date_joined').filter(is_active=True)
    filterset_fields = ['department', 'role']
    search_fields = ['email', 'first_name', 'last_name']

    @user_list_docs
    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserListView][GET] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while listing users.",
                "error": str(e)
            }, status=500)

    @user_list_docs
    def post(self, request, *args, **kwargs):
        self.serializer_class = UserCreateSerializer
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserListView][POST] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while creating user.",
                "error": str(e)
            }, status=500)

    def get_queryset(self):
        try:
            queryset = super().get_queryset()
            department_id = self.request.query_params.get('department_id')
            role = self.request.query_params.get('role')
            if department_id:
                queryset = queryset.filter(department_id=department_id)
            if role:
                queryset = queryset.filter(role=role)
            return queryset
        except Exception as e:
            print(f"[UserListView][get_queryset] Error: {e}")
            # Return empty queryset on error for safety
            return User.objects.none()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin-only endpoint for comprehensive user management
    """
    queryset = User.objects.select_related('department')
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    lookup_field = 'pk'

    def get_serializer_class(self):
        try:
            if self.request.method in ['PUT', 'PATCH']:
                return UserUpdateSerializer
            return UserSerializer
        except Exception as e:
            print(f"[UserDetailView][get_serializer_class] Error: {e}")
            return UserSerializer

    @user_detail_docs['get']
    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserDetailView][GET] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while retrieving user.",
                "error": str(e)
            }, status=500)

    @user_detail_docs['put']
    def put(self, request, *args, **kwargs):
        try:
            return super().put(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserDetailView][PUT] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while updating user.",
                "error": str(e)
            }, status=500)

    @user_detail_docs['patch']
    def patch(self, request, *args, **kwargs):
        try:
            return super().patch(request, *args, **kwargs)
        except Exception as e:
            print(f"[UserDetailView][PATCH] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while partially updating user.",
                "error": str(e)
            }, status=500)

    @user_delete_docs
    def delete(self, request, *args, **kwargs):
        try:
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
        except Exception as e:
            print(f"[UserDetailView][DELETE] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while deactivating user.",
                "error": str(e)
            }, status=500)

    @user_restore_docs
    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        try:
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
                from django.contrib.auth.tokens import default_token_generator
                from django.utils.http import urlsafe_base64_encode
                from django.utils.encoding import force_bytes
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
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
        except Exception as e:
            print(f"[UserDetailView][RESTORE] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while restoring user.",
                "error": str(e)
            }, status=500)


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
    try:
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"[list_departments] Unexpected error: {e}")
        return Response({
            "detail": "Unexpected server error while listing departments.",
            "error": str(e)
        }, status=500)

@forgot_password_docs
class ForgotPasswordAPIView(APIView):
    """Endpoint to request a password reset link."""
    permission_classes = []
    def post(self, request):
        try:
            serializer = ForgotPasswordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            # Always return generic message for security
            return Response({"message": "If an account with that email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"[ForgotPasswordAPIView][POST] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while requesting password reset.",
                "error": str(e)
            }, status=500)

@reset_password_docs
class ResetPasswordAPIView(APIView):
    """Endpoint to reset password using token and uid."""
    permission_classes = []
    def post(self, request):
        try:
            serializer = ResetPasswordSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"message": "Password has been reset successfully. You can now log in with your new password."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"[ResetPasswordAPIView][POST] Unexpected error: {e}")
            return Response({
                "detail": "Unexpected server error while resetting password.",
                "error": str(e)
            }, status=500)

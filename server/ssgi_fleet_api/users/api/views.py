from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404

from .permissions import IsSuperAdmin
from users.models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    SuperAdminRegistrationSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)
from .docs import (
    super_admin_register_docs,
    user_profile_docs,
    logout_docs,
    user_list_docs,
    user_detail_docs,
    token_obtain_docs,
    user_login_docs
)

class SuperAdminRegistrationView(generics.CreateAPIView):
    """Endpoint exclusively for SuperAdmins to register any type of user."""
    serializer_class = SuperAdminRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    @super_admin_register_docs
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = serializer.save()
        if hasattr(user, 'temporary_password'):
            print(f"Created user {user.email} with temp password: {user.temporary_password}")

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

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

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'password' in serializer.validated_data:
            instance.set_password(serializer.validated_data['password'])
            instance.save()

class LogoutView(APIView):
    """Invalidates the provided refresh token to log out the user."""
    permission_classes = [permissions.IsAuthenticated]

    @logout_docs
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserListView(generics.ListCreateAPIView):
    """Provides list and create operations for user accounts."""
    queryset = User.objects.select_related('department').order_by('-date_joined')
    permission_classes = [permissions.IsAdminUser]

    @user_list_docs
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @user_list_docs
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == 'POST' else UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        
        if 'department_id' in params:
            queryset = queryset.filter(department_id=params['department_id'])
        if 'role' in params:
            queryset = queryset.filter(role=params['role'])
            
        return queryset

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Provides detailed view and modification of user accounts."""
    queryset = User.objects.select_related('department')
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'pk'

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
        return super().delete(request, *args, **kwargs)

    def get_serializer_class(self):
        return UserUpdateSerializer if self.request.method in ['PUT', 'PATCH'] else UserSerializer

    def perform_destroy(self, instance):
        if instance == self.request.user:
            return Response(
                {"error": "You cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()

class CustomTokenObtainPairView(TokenObtainPairView):
    """Customized JWT token obtain view with enhanced documentation."""
    
    @token_obtain_docs
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
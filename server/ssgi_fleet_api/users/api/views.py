from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiResponse,
    OpenApiParameter,
)
from django.shortcuts import get_object_or_404

from users.models import User
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,  # New serializer for updates
)

# ---------------------- AUTHENTICATION VIEWS ---------------------- #

@extend_schema(
    tags=["Authentication"],
    description="""Register new users (Admin only). 
    Returns user details with temporary password if credentials were auto-generated.
    For auto-generated credentials, set generate_credentials=True and omit password field.
    For manual credentials, include password field.""",
    request=UserRegistrationSerializer,
    responses={
        201: OpenApiResponse(
            response=UserRegistrationSerializer,
            description="User created successfully"
        ),
        400: OpenApiResponse(
            description="Invalid input data",
            examples=[
                OpenApiExample(
                    "Validation Error",
                    value={
                        "email": ["This field is required"],
                        "role": ["Invalid role selection"]
                    }
                )
            ]
        ),
        403: OpenApiResponse(
            description="Forbidden - Admin access required",
            examples=[
                OpenApiExample(
                    "Permission Denied",
                    value={"detail": "You do not have permission to perform this action."}
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Auto-generated credentials",
            summary="Auto-generate username/password",
            value={
                "email": "driver@ssgi.com",
                "first_name": "Ali",
                "last_name": "Hassan",
                "role": "driver",
                "department": 1,
                "generate_credentials": True
            },
            request_only=True,
        ),
        OpenApiExample(
            "Manual credentials",
            summary="Specify password manually",
            value={
                "email": "admin@ssgi.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin",
                "password": "SecurePass123!"
            },
            request_only=True,
        ),
    ],
)
class UserRegistrationView(generics.CreateAPIView):
    """
    Endpoint for admin users to register new users in the system.
    Supports both manual credential specification and auto-generation.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        """
        Handle post-creation actions like sending welcome emails.
        """
        user = serializer.save()
        if hasattr(user, 'temporary_password'):
            # In production: user.send_welcome_email(temporary_password=user.temporary_password)
            pass


@extend_schema(
    tags=["User"],
    description="""Retrieve or update authenticated user's profile.
    For password changes, include both old_password and new_password fields.""",
    responses={
        200: UserProfileSerializer,
        400: OpenApiResponse(
            description="Invalid update data",
            examples=[
                OpenApiExample(
                    "Password Change Error",
                    value={"old_password": ["Incorrect current password"]}
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Authentication credentials were not provided"),
    }
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Allows authenticated users to view and modify their own profile information.
    Includes special handling for password changes with validation.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Always return the authenticated user"""
        return self.request.user

    def get_serializer_class(self):
        """
        Use different serializer for updates if needed
        """
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserProfileSerializer  # Could use a different serializer here if needed
        return UserProfileSerializer

    def perform_update(self, serializer):
        """
        Handle special cases during profile updates.
        """
        instance = serializer.save()
        
        # Handle password changes
        if 'password' in serializer.validated_data:
            instance.set_password(serializer.validated_data['password'])
            instance.save()


@extend_schema(
    tags=["Authentication"],
    description="Logout user by blacklisting their refresh token",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "refresh": {
                    "type": "string",
                    "description": "Refresh token to blacklist"
                }
            },
            "required": ["refresh"]
        }
    },
    responses={
        205: OpenApiResponse(description="Successfully logged out - Refresh token blacklisted"),
        400: OpenApiResponse(
            description="Invalid token or missing refresh token",
            examples=[
                OpenApiExample(
                    "Missing Token",
                    value={"error": "refresh token is required"}
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Authentication credentials were not provided"),
    }
)
class LogoutView(APIView):
    """
    Invalidates the provided refresh token to log out the user.
    The token can no longer be used to obtain new access tokens.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Process the logout request by blacklisting the refresh token.
        """
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


# ---------------------- USER MANAGEMENT VIEWS ---------------------- #

@extend_schema(
    tags=["User Management"],
    description="""List all users or create new users (Admin only).
    Supports filtering by department and role via query parameters.""",
    parameters=[
        OpenApiParameter(
            name='department_id',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Filter users by department ID'
        ),
        OpenApiParameter(
            name='role',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Filter users by role',
            enum=[role[0] for role in User.Role.choices]
        ),
    ],
    responses={
        200: UserSerializer(many=True),
        201: UserCreateSerializer,
        403: OpenApiResponse(description="Forbidden - Admin access required")
    }
)
class UserListView(generics.ListCreateAPIView):
    """
    Provides list and create operations for user accounts.
    Only accessible by admin users.
    """
    queryset = User.objects.select_related('department').order_by('-date_joined')
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        """
        Use UserCreateSerializer for creation and UserSerializer for listing
        """
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        """
        Optionally filter by department or role via query parameters
        """
        queryset = super().get_queryset()
        params = self.request.query_params
        
        if 'department_id' in params:
            queryset = queryset.filter(department_id=params['department_id'])
        if 'role' in params:
            queryset = queryset.filter(role=params['role'])
            
        return queryset


@extend_schema(
    tags=["User Management"],
    description="""Retrieve, update or delete specific user (Admin only).
    Different serializers are used for retrieval vs updates.""",
    responses={
        200: UserSerializer,
        400: OpenApiResponse(description="Invalid input data"),
        403: OpenApiResponse(description="Forbidden - Admin access required"),
        404: OpenApiResponse(description="User not found")
    }
)
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Provides detailed view and modification of user accounts.
    Only accessible by admin users.
    """
    queryset = User.objects.select_related('department')
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'pk'

    def get_serializer_class(self):
        """
        Use UserUpdateSerializer for updates and UserSerializer for retrieval
        """
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        """
        Prevent users from deleting their own accounts.
        In production, consider implementing soft delete instead.
        """
        if instance == self.request.user:
            return Response(
                {"error": "You cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()


# ---------------------- AUTH TOKEN VIEWS ---------------------- #

@extend_schema(
    tags=["Authentication"],
    description="Obtain JWT token pair (access + refresh)",
    request=TokenObtainPairView.serializer_class,
    responses={
        200: OpenApiResponse(
            response=TokenObtainPairView.serializer_class,
            description="Successfully authenticated"
        ),
        400: OpenApiResponse(
            description="Invalid credentials",
            examples=[
                OpenApiExample(
                    "Invalid Credentials",
                    value={"detail": "No active account found with the given credentials"}
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Login Request",
            value={
                "email": "user@example.com",
                "password": "yourpassword123"
            },
            request_only=True,
        )
    ]
)
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Customized JWT token obtain view with enhanced documentation.
    Uses email/password for authentication.
    """
    pass
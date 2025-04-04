from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, UserProfileSerializer, AdminUserCreateSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse

@extend_schema(
    description="User registration endpoint (Admin only)",
    request=UserRegistrationSerializer,
    responses={201: UserRegistrationSerializer},
    examples=[
        OpenApiExample(
            'Admin User Creation',
            value={
                "email": "driver@ssgi.com",
                "first_name": "Ali",
                "last_name": "Hassan",
                "role": "driver",
                "department": 1
            },
            request_only=True
        ),
    ]
)

class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [IsAdminUser]  # Only admins can register users

class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    """
    View to blacklist refresh tokens when users logout.
    Requires refresh token in request data.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()  # Blacklists the refresh token
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(
                {"error": "Invalid token or token missing"},
                status=status.HTTP_400_BAD_REQUEST
            )
class AdminUserCreateView(CreateAPIView):
    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        instance = serializer.save()
        # Add the temp password to response data
        instance.temporary_password = instance.generate_temp_password()
        instance.save()

from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=['Authentication'],
    description="Obtain JWT token pair",
    responses={
        200: OpenApiResponse(
            description="Successful authentication",
            examples={
                "application/json": {
                    "refresh": "eyJhb...",
                    "access": "eyJhb..."
                }
            }
        ),
        400: OpenApiResponse(
            description="Invalid credentials",
            examples={
                "application/json": {
                    "detail": "No active account found with the given credentials"
                }
            }
        )
    },
    examples=[
        OpenApiExample(
            "Login Example",
            value={
                "email": "user@example.com",
                "password": "string"
            },
            request_only=True
        )
    ]
)
class CustomTokenObtainPairView(TokenObtainPairView):
    pass        
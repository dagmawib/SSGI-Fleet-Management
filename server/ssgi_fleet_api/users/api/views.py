from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiExample,
    OpenApiResponse,
)
from .serializers import UserRegistrationSerializer, UserProfileSerializer


@extend_schema(
    description="User registration endpoint (Admin only)",
    request=UserRegistrationSerializer,
    responses={201: UserRegistrationSerializer},
    examples=[
        OpenApiExample(
            "Admin User Creation",
            value={
                "email": "driver@ssgi.com",
                "first_name": "Ali",
                "last_name": "Hassan",
                "role": "driver",
                "department": 1,
            },
            request_only=True,
        ),
    ],
)
class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [IsAdminUser]


class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Invalid token or token missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(
                {"error": "Invalid token or token missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(
    tags=["Authentication"],
    description="Obtain JWT token pair",
    responses={
        200: OpenApiResponse(
            description="Successful authentication",
            examples={
                "application/json": {
                    "refresh": "eyJhb...",
                    "access": "eyJhb...",
                }
            },
        ),
        400: OpenApiResponse(
            description="Invalid credentials",
            examples={
                "application/json": {
                    "detail": "No active account found with the given credentials"
                }
            },
        ),
    },
    examples=[
        OpenApiExample(
            "Login Example",
            value={
                "email": "user@example.com",
                "password": "string",
            },
            request_only=True,
        )
    ],
)
class CustomTokenObtainPairView(TokenObtainPairView):
    pass
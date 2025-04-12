from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiResponse,
    OpenApiParameter,
)
from .serializers import (
    CustomTokenObtainPairSerializer,
    SuperAdminRegistrationSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserCreateSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView
from users.models import User

# ---------------------- SUPER ADMIN DOCS ---------------------- #
super_admin_register_docs = extend_schema(
    tags=["Super Admin"],
    description="""Register new users (SuperAdmin only). 
    SuperAdmin can create users of any role including other SuperAdmins.
    Department assignment is optional for all created users.""",
    request=SuperAdminRegistrationSerializer,
    responses={
        201: OpenApiResponse(
            response=SuperAdminRegistrationSerializer,
            description="User created successfully"
        ),
        400: OpenApiResponse(
            description="Invalid input data",
            examples={
                "application/json": {
                    "email": ["This field is required"],
                    "role": ["Invalid role selection"]
                }
            }
        ),
        403: OpenApiResponse(
            description="Forbidden - SuperAdmin access required",
            examples={
                "application/json": {
                    "detail": "You do not have permission to perform this action."
                }
            }
        )
    },
    examples=[
        OpenApiExample(
            "Create Admin",
            value={
                "email": "newadmin@ssgi.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin",
                "department_id": 1,
                "generate_credentials": True
            },
            request_only=True,
        ),
        OpenApiExample(
            "Create SuperAdmin",
            value={
                "email": "super@ssgi.com", 
                "first_name": "Super",
                "last_name": "Admin",
                "role": "superadmin",
                "generate_credentials": True
            },
            request_only=True,
        ),
    ]
)



# ---------------------- AUTHENTICATION DOCS ---------------------- #

user_login_docs =extend_schema(
        tags=["Authentication"],
        summary="User Login",
        description="Authenticate with email/password to obtain JWT tokens and user data",
        request=CustomTokenObtainPairSerializer,
        responses={
            200: OpenApiResponse(
                response=CustomTokenObtainPairSerializer,
                description="Successful authentication",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            "access": "eyJhbGciOi...",
                            "refresh": "eyJhbGciOi...",
                            "user_id": 1,
                            "role": "admin"
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="Invalid credentials",
                examples=[
                    OpenApiExample(
                        "Error Response",
                        value={
                            "detail": "No active account found with the given credentials"
                        }
                    )
                ]
            )
        },
        examples=[
            OpenApiExample(
                "Login Request Example",
                value={
                    "email": "admin@example.com",
                    "password": "adminpassword123"
                },
                request_only=True
            )
        ]
    )

user_profile_docs = extend_schema(
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

logout_docs = extend_schema(
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

# ---------------------- USER MANAGEMENT DOCS ---------------------- #
user_list_docs = extend_schema(
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

user_detail_docs = extend_schema(
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

# ---------------------- AUTH TOKEN DOCS ---------------------- #
token_obtain_docs = extend_schema(
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
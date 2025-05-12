from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiResponse,
    OpenApiParameter,
    OpenApiTypes,
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
from vehicles.models import Vehicle

# ---------------------- SUPER ADMIN REGISTRATION ---------------------- #
super_admin_register_docs = extend_schema(
    tags=["Super Admin"],
    summary="Register new users (SuperAdmin only)",
    description="""
    Register new users (SuperAdmin only). 
    SuperAdmin can create users of any role including other SuperAdmins.
    Department assignment is optional for all created users.
    """,
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
                "department_name": "IT",
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
user_login_docs = extend_schema(
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
    tags=["Profile"],
    summary="User profile management endpoint",
    description="""
    GET: Retrieve complete profile information
    PUT/PATCH: Update allowed fields (name, phone, password)
    """,
    responses={
        200: OpenApiResponse(
            response=UserProfileSerializer,
            description="Successful operation",
            examples=[
                OpenApiExample(
                    "GET Response Example",
                    value={
                        "email": "user@example.com",
                        "first_name": "Michael",
                        "last_name": "Birhanu",
                        "phone_number": "+251912345678",
                        "role": "admin",
                        "department": None,
                        "is_active": True,
                        "date_joined": "2025-04-17T13:00:26.202175Z",
                        "last_login": None
                    }
                ),
                OpenApiExample(
                    "PUT Success Response",
                    value={
                        "first_name": "UpdatedFirstName",
                        "last_name": "UpdatedLastName",
                        "phone_number": "+251987654321"
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid input data",
            examples=[
                OpenApiExample(
                    "Password Error",
                    value={"password": ["This password is too common."]}
                ),
                OpenApiExample(
                    "Validation Error",
                    value={"phone_number": ["Enter a valid phone number."]}
                )
            ]
        ),
        401: OpenApiResponse(
            description="Unauthorized",
            examples=[
                OpenApiExample(
                    "Authentication Error",
                    value={"detail": "Authentication credentials were not provided."}
                )
            ]
        )
    },
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string", "example": "Michael"},
                "last_name": {"type": "string", "example": "Birhanu"},
                "phone_number": {"type": "string", "example": "+251912345678"},
                "password": {
                    "type": "string",
                    "format": "password",
                    "minLength": 8,
                    "example": "newSecurePassword123!"
                }
            }
        }
    }
)

logout_docs = extend_schema(
    tags=["Authentication"],
    summary="Logout user",
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
    summary="List all users or create new users (Admin only)",
    description="""
    List all users or create new users (Admin only).
    Supports filtering by department and role via query parameters.
    """,
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
        200: OpenApiResponse(
            response=UserSerializer(many=True),
            description="List of users"
        ),
        201: OpenApiResponse(
            response=UserCreateSerializer,
            description="User created successfully"
        ),
        400: OpenApiResponse(
            description="Invalid input data",
            examples=[
                OpenApiExample(
                    "Missing Email",
                    value={"email": ["This field is required."]}
                ),
                OpenApiExample(
                    "Invalid Role",
                    value={"role": ["Invalid role selection."]}
                )
            ]
        ),
        403: OpenApiResponse(description="Forbidden - Admin access required")
    }
)

user_detail_docs = {
    'get': extend_schema(
        tags=["User Management"],
        summary="Retrieve complete user details (Admin only)",
        description="Retrieve complete user details (Admin only)",
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description="User details"
            ),
            403: OpenApiResponse(description="Forbidden - Admin access required"),
            404: OpenApiResponse(description="User not found")
        }
    ),
    'put': extend_schema(
        tags=["User Management"],
        summary="Update user details (Admin only, restricted fields)",
        description="Update user details (Admin only, restricted fields)",
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description="User updated"
            ),
            400: OpenApiResponse(description="Invalid input data"),
            403: OpenApiResponse(description="Forbidden - Admin access required"),
            404: OpenApiResponse(description="User not found")
        }
    ),
    'patch': extend_schema(
        tags=["User Management"],
        summary="Partially update user details (Admin only, restricted fields)",
        description="Partially update user details (Admin only, restricted fields)",
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description="User updated"
            ),
            400: OpenApiResponse(description="Invalid input data"),
            403: OpenApiResponse(description="Forbidden - Admin access required"),
            404: OpenApiResponse(description="User not found")
        }
    )
}

user_delete_docs = extend_schema(
    tags=["User Management"],
    summary="Soft delete a user account",
    description="""
    Soft deletes a user account:
    - Sets is_active=False
    - Anonymizes email
    - Invalidates password
    """,
    responses={
        200: OpenApiResponse(
            description="User deactivated with confirmation",
            examples=[OpenApiExample(
                "Success Response",
                value={
                    "status": "success",
                    "message": "User account deactivated",
                    "user_id": 123,
                    "can_be_restored": True
                }
            )]
        ),
        403: OpenApiResponse(
            description="Cannot delete own account",
            examples=[OpenApiExample(
                "Error Response",
                value={"error": "You cannot delete your own account"}
            )]
        ),
        404: OpenApiResponse(description="User not found")
    }
)

user_restore_docs = extend_schema(
    tags=["User Management"],
    summary="Restore a deactivated user account",
    description="""
    Restore a deactivated user account.
    - Reactivates the account
    - Restores original email (removes 'deleted_' prefix)
    - Generates a temporary password
    - Returns credentials for admin to provide to user
    """,
    responses={
        200: OpenApiResponse(
            description="User restored successfully",
            examples=[OpenApiExample(
                "Success Response",
                value={
                    "status": "success",
                    "message": "User account restored",
                    "user_id": 123,
                    "new_email": "restored_user@example.com",
                    "password_reset_required": True
                }
            )]
        ),
        400: OpenApiResponse(
            description="Bad Request",
            examples=[OpenApiExample(
                "Already Active",
                value={"error": "User is already active"}
            )]
        ),
        404: OpenApiResponse(
            description="Not Found",
            examples=[OpenApiExample(
                "Not Found",
                value={"error": "No inactive user found with this ID"}
            )]
        )
    }
)

forgot_password_docs = extend_schema(
    tags=["Authentication"],
    summary="Request password reset link",
    description="""
    Initiates the password reset process by sending a reset link to the user's email address if it exists in the system. Always returns a generic success message for security reasons.
    """,
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "email": {"type": "string", "format": "email", "example": "user@example.com"}
            },
            "required": ["email"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="Password reset link sent (if email exists)",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"message": "If an account with that email exists, a password reset link has been sent."}
                )
            ]
        )
    }
)

reset_password_docs = extend_schema(
    tags=["Authentication"],
    summary="Reset password using token",
    description="""
    Resets the user's password using the token and uid from the password reset link. The new password must be at least 8 characters. Returns a success message if the reset is successful.
    """,
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "uid": {"type": "string", "example": "Mg"},
                "token": {"type": "string", "example": "set-password-token"},
                "new_password": {"type": "string", "format": "password", "minLength": 8, "example": "newSecurePassword123!"}
            },
            "required": ["uid", "token", "new_password"]
        }
    },
    responses={
        200: OpenApiResponse(
            description="Password reset successful",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"message": "Password has been reset successfully. You can now log in with your new password."}
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid or expired token",
            examples=[
                OpenApiExample(
                    "Invalid Token",
                    value={"token": ["Invalid or expired token."]}
                ),
                OpenApiExample(
                    "Token Expired",
                    value={"token": ["Token has expired."]}
                )
            ]
        )
    }
)
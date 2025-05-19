import random
import string
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from users.models import Department
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.text import slugify
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status


User = get_user_model()
# user = User.objects.first()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Authenticate user
        authenticate_kwargs = {
            "email": attrs[self.username_field],
            "password": attrs["password"],
        }
        try:
            authenticate_kwargs["request"] = self.context["request"]
        except KeyError:
            pass
        try:

            self.user = authenticate(**authenticate_kwargs)

            if not self.user:
                return {
                    "status": False,
                    "error": "authentication_failed",
                    "message": "you have entered an invalid credentials",
                    "status_code": 401
                }
            
            if not self.user.is_active:
                return {
                    "status": False,
                    "error": "account_inactive", 
                    "message": "User account is disabled",
                    "status_code": status.HTTP_401_UNAUTHORIZED
                }
            
                # Generate tokens manually
            refresh = RefreshToken.for_user(self.user)
            access = refresh.access_token

            # Build custom response
            return {
                "token": str(access),
                "refresh": str(refresh),
                "user_id": self.user.id,
                "role": self.user.role,
            }   
        except Exception as e:
            raise serializers.ValidationError(
                {
                    "error": "authentication_error",
                    "detail": str(e),
                    "status_code": 500
                }
            )

       

class DepartmentDirectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class DepartmentSerializer(serializers.ModelSerializer):
    director = DepartmentDirectorSerializer(read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "description", "director"]
        read_only_fields = ["id"]


class SuperAdminRegistrationSerializer(serializers.ModelSerializer):
    generate_credentials = serializers.BooleanField(
        write_only=True, default=True, help_text="Auto-generate password if True"
    )
    temporary_password = serializers.CharField(read_only=True)
    department_name = serializers.CharField(
        write_only=True, required=False, allow_null=True, help_text="Department name"
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        required=False,
        allow_null=True,
 
    )
    username = serializers.CharField(read_only=True)  # still read-only

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "department_id",
            "department_name",
            "generate_credentials",
            "temporary_password",
            "password",
        ]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def generate_unique_username(self, first_name, last_name):
        """Generate a username like 'john_doe_a1b2'"""
        base = f"{slugify(first_name)}".lower()
        suffix = ''.join(random.choices(string.digits, k=4))
        username = f"{base}_{suffix}"
        
        # Ensure uniqueness
        while User.objects.filter(username=username).exists():
            suffix = ''.join(random.choices(string.digits, k=4))
            username = f"{base}_{suffix}"
            
        return username

    def validate(self, data):
        """
        Ensure only SuperAdmins can create other SuperAdmins
        and enforce role-specific rules
        """
        try:
            requesting_user = self.context["request"].user
            requested_role = data.get("role", User.Role.EMPLOYEE)
            department_name = data.pop("department_name", None)
            if department_name:
                try:
                    department = Department.objects.get(name=department_name)
                    data["department"] = department
                except Department.DoesNotExist:
                    raise serializers.ValidationError({"department_name": "Department not found"})
            if requested_role == User.Role.SUPERADMIN:
                if not (
                    requesting_user.role == User.Role.SUPERADMIN
                    and requesting_user.is_superuser
                ):
                    raise serializers.ValidationError(
                        {"detail": "Only SuperAdmins can create other SuperAdmins"}
                    )
            if requested_role == User.Role.SUPERADMIN:
                data["department"] = None
            return data
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[SuperAdminRegistrationSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during validation: {str(e)}"})

    def validate_role(self, value):
        try:
            if value not in dict(User.Role.choices):
                raise serializers.ValidationError("Invalid role selection")
            return value
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[SuperAdminRegistrationSerializer][validate_role] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during role validation: {str(e)}"})

    def create(self, validated_data):
        try:
            generate_creds = validated_data.pop("generate_credentials", True)
            role = validated_data.get("role", User.Role.EMPLOYEE)
            first_name = validated_data.get("first_name", "")
            last_name = validated_data.get("last_name", "")
            validated_data["username"] = self.generate_unique_username(first_name, last_name)
            temporary_password = None
            if generate_creds:
                raw_password = get_random_string(8)
                validated_data["password"] = raw_password
                temporary_password = raw_password
            else:
                raw_password = validated_data.get("password")
                if not raw_password:
                    raise serializers.ValidationError(
                        {"detail": "Password is required if generate_credentials is False"}
                    )
                validated_data["password"] = raw_password
            if role == User.Role.SUPERADMIN:
                validated_data.update({
                    "is_superuser": True,
                    "is_staff": True,
                    "department": None
                })
            user = User.objects.create_user(**validated_data)
            if generate_creds:
                user.temporary_password = temporary_password
                user.save()
                # Send welcome email with credentials (ensure email is sent after user is saved)
                try:
                    # Use transaction.on_commit to ensure email is sent after DB commit
                    from django.db import transaction
                    def send_email():
                        self.send_welcome_email(user.email, temporary_password)
                    transaction.on_commit(send_email)
                except Exception as email_exc:
                    print(f"[SuperAdminRegistrationSerializer][create] Failed to schedule welcome email: {email_exc}")
            if user.role == User.Role.DIRECTOR and user.department:
                user.department.director = user
                user.department.save()
            return user
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[SuperAdminRegistrationSerializer][create] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during user creation: {str(e)}"})

    def send_welcome_email(self, email, temp_password):
        """
        Sends a welcome email to the newly registered user with their credentials and instructions.
        Uses EMAIL_HOST_USER from settings or .env as the sender.
        """
        from django.conf import settings
        from django.core.mail import send_mail
        subject = "Welcome to SSGI Fleet Management System"
        message = (
            f"Dear User,\n\n"
            f"Your account has been created successfully.\n"
            f"Login Email: {email}\n"
            f"Temporary Password: {temp_password}\n\n"
            f"For your security, please log in and change your password immediately.\n"
            f"If you have any issues, contact your administrator.\n\n"
            f"Thank you,\nSSGI Fleet Management Team"
        )
        from_email = getattr(settings, 'EMAIL_HOST_USER', None)
        send_mail(
            subject,
            message,
            from_email,
            [email],
            fail_silently=False,
        )

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(write_only=True, required=False, min_length=8)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "old_password",
            "new_password"
        ]
    
    def validate(self, data):
        try:
            old_password = data.get("old_password")
            new_password = data.get("new_password")
            # Only validate password change if either field is present
            if old_password or new_password:
                if not old_password or not new_password:
                    raise serializers.ValidationError({
                        "old_password": "Both old_password and new_password are required to change password."
                    })
                user = self.instance
                if not user.check_password(old_password):
                    raise serializers.ValidationError({
                        "old_password": "Old password is incorrect."
                    })
                if old_password == new_password:
                    raise serializers.ValidationError({
                        "new_password": "New password must be different from old password."
                    })
            return data
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[UserProfileUpdateSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during profile validation: {str(e)}"})

    def update(self, instance, validated_data):
        try:
            old_password = validated_data.pop("old_password", None)
            new_password = validated_data.pop("new_password", None)
            instance = super().update(instance, validated_data)
            if old_password and new_password:
                instance.set_password(new_password)
                instance.save()
            return instance
        except Exception as e:
            print(f"[UserProfileUpdateSerializer][update] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during profile update: {str(e)}"})

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile viewing/updating"""

    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        write_only=True,
        required=False,
    )


    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "department",
            "department_id",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["email", "role", "date_joined", "last_login"]

    def to_representation(self, instance):
        try:
            return super().to_representation(instance)
        except Exception as e:
            print(f"[UserProfileSerializer][to_representation] Unexpected error: {e}")
            return {"detail": f"Server error during profile serialization: {str(e)}"}

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except Exception as e:
            print(f"[UserProfileSerializer][update] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during profile update: {str(e)}"})

class UserSerializer(serializers.ModelSerializer):
    """Default serializer for user listing"""

    department = DepartmentSerializer(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "is_active",
            "is_superuser",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        try:
            return super().to_representation(instance)
        except Exception as e:
            print(f"[UserSerializer][to_representation] Unexpected error: {e}")
            return {"detail": f"Server error during user serialization: {str(e)}"}

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin user creation"""

    generate_credentials = serializers.BooleanField(
        write_only=True, default=True, help_text="Auto-generate password if True"
    )
    temporary_password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "password",
            "generate_credentials",
            "temporary_password",
        ]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def validate(self, data):
        try:
            if data.get("role") == User.Role.SUPERADMIN:
                raise serializers.ValidationError(
                    "Only SuperAdmins can create other SuperAdmins"
                )
            return data
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[UserCreateSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during user validation: {str(e)}"})

    def create(self, validated_data):
        try:
            generate_creds = validated_data.pop('generate_credentials', True)
            # Handle password
            if generate_creds:
                raw_password = get_random_string(8)
                validated_data['password'] = raw_password  # Will be hashed in create_user
                temporary_password = raw_password
            else:
                if not validated_data.get('password'):
                    raise serializers.ValidationError(
                        {'password': 'Password is required when generate_credentials=False'}
                    )
                temporary_password = None
            # Create user - password will be hashed by create_user
            user = User.objects.create_user(**validated_data)
            if generate_creds:
                user.temporary_password = temporary_password
                user.save()
            # Automatically assign as department director if role is director
            if user.role == User.Role.DIRECTOR and user.department:
                user.department.director = user
                user.department.save()
            return user
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[UserCreateSerializer][create] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during user creation: {str(e)}"})

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin user updates"""

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "department",
            "is_active",
        ]
        extra_kwargs = {
            "email": {"read_only": True},
            "role": {"read_only": True},  # Prevent role changes via this endpoint
        }

    def validate_role(self, value):
        try:
            instance = self.instance
            if instance and value != instance.role:
                raise serializers.ValidationError(
                    "Role cannot be changed through this endpoint"
                )
            return value
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"[UserUpdateSerializer][validate_role] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during role validation: {str(e)}"})

    def update(self, instance, validated_data):
        try:
            old_department = instance.department
            instance = super().update(instance, validated_data)
            # Automatically assign as department director if role is director
            if instance.role == User.Role.DIRECTOR and instance.department:
                instance.department.director = instance
                instance.department.save()
            # If user is no longer a director or changed department, clear old department's director
            if (instance.role != User.Role.DIRECTOR or (old_department and old_department != instance.department)):
                if old_department and old_department.director == instance:
                    old_department.director = None
                    old_department.save()
            return instance
        except Exception as e:
            print(f"[UserUpdateSerializer][update] Unexpected error: {e}")
            raise serializers.ValidationError({"detail": f"Server error during user update: {str(e)}"})

class TemporaryPasswordSerializer(serializers.Serializer):
    temporary_password = serializers.CharField()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.filter(email=value, is_active=True).first()
            return value
        except Exception as e:
            print(f"[ForgotPasswordSerializer][validate_email] Unexpected error: {e}")
            raise serializers.ValidationError("Unexpected error during email validation.")

    def save(self):
        try:
            if hasattr(self, 'user') and self.user:
                user = self.user
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                user.reset_token = token
                user.reset_token_expires = timezone.now() + timezone.timedelta(hours=1)
                user.save(update_fields=["reset_token", "reset_token_expires"])
                if hasattr(user, 'send_password_reset_email'):
                    user.send_password_reset_email(uid, token)
            return True
        except Exception as e:
            print(f"[ForgotPasswordSerializer][save] Unexpected error: {e}")
            raise serializers.ValidationError("Unexpected error during password reset process.")

class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({'uid': 'Invalid or expired link.'})
        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError({'token': 'Invalid or expired token.'})
        # Optionally check expiry
        if user.reset_token_expires and user.reset_token_expires < timezone.now():
            raise serializers.ValidationError({'token': 'Token has expired.'})
        self.user = user
        return data

    def save(self):
        user = self.user
        user.set_password(self.validated_data['new_password'])
        user.reset_token = ''
        user.reset_token_expires = None
        user.last_password_change = timezone.now()
        user.save()
        return user
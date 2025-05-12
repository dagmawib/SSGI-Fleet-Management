import random
import string
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from ssgi_fleet_api.users.models import Department
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
        requesting_user = self.context["request"].user
        requested_role = data.get("role", User.Role.EMPLOYEE)

        # Handle department name mapping to department object
        department_name = data.pop("department_name", None)
        if department_name:
            try:
                department = Department.objects.get(name=department_name)
                data["department"] = department
            except Department.DoesNotExist:
                raise serializers.ValidationError({"department_name": "Department not found"})


        # Only current SuperAdmins can create new SuperAdmins
        if requested_role == User.Role.SUPERADMIN:
            if not (
                requesting_user.role == User.Role.SUPERADMIN
                and requesting_user.is_superuser
            ):
                raise serializers.ValidationError(
                    "Only SuperAdmins can create other SuperAdmins"
                )

        # SuperAdmins can't be assigned to departments
        if requested_role == User.Role.SUPERADMIN:
            data["department"] = None

        return data

    def validate_role(self, value):
        """Ensure role is valid"""
        if value not in dict(User.Role.choices):
            raise serializers.ValidationError("Invalid role selection")
        return value

    def create(self, validated_data):
        generate_creds = validated_data.pop("generate_credentials", True)
        role = validated_data.get("role", User.Role.EMPLOYEE)
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")
        validated_data["username"] = self.generate_unique_username(first_name, last_name)
        temporary_password = None




        # Generate or hash password
        if generate_creds:
            raw_password = get_random_string(8)
            validated_data["password"] = raw_password
            temporary_password = raw_password
        else:
            raw_password = validated_data.get("password")
            if not raw_password:
                raise serializers.ValidationError(
                    "Password is required if generate_credentials is False"
                )
            validated_data["password"] = raw_password

        # SuperAdmin settings
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

        # Automatically assign as department director if role is director
        if user.role == User.Role.DIRECTOR and user.department:
            user.department.director = user
            user.department.save()

        return user


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

    def update(self, instance, validated_data):
        old_password = validated_data.pop("old_password", None)
        new_password = validated_data.pop("new_password", None)
        instance = super().update(instance, validated_data)
        if old_password and new_password:
            instance.set_password(new_password)
            instance.save()
        return instance


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
        """Ensure admins can't create SuperAdmins"""
        if data.get("role") == User.Role.SUPERADMIN:
            raise serializers.ValidationError(
                "Only SuperAdmins can create other SuperAdmins"
            )
        return data

    def create(self, validated_data):
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
        """Prevent role escalation"""
        instance = self.instance
        if instance and value != instance.role:
            raise serializers.ValidationError(
                "Role cannot be changed through this endpoint"
            )
        return value

    def update(self, instance, validated_data):
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

class TemporaryPasswordSerializer(serializers.Serializer):
    temporary_password = serializers.CharField()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Always return success for security, but check if user exists
        self.user = User.objects.filter(email=value, is_active=True).first()
        return value

    def save(self):
        if hasattr(self, 'user') and self.user:
            user = self.user
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            # Set expiry (optional, token already has built-in expiry logic)
            user.reset_token = token
            user.reset_token_expires = timezone.now() + timezone.timedelta(hours=1)
            user.save(update_fields=["reset_token", "reset_token_expires"])
            # Send email (implement send_password_reset_email on User)
            if hasattr(user, 'send_password_reset_email'):
                user.send_password_reset_email(uid, token)
        # Always return success
        return True

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
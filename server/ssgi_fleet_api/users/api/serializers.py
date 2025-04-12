from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from users.models import Department
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer




User = get_user_model()
# user = User.objects.first()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # First authenticate the user
        authenticate_kwargs = {
            'email': attrs[self.username_field],
            'password': attrs['password']
        }
        try:
            authenticate_kwargs['request'] = self.context['request']
        except KeyError:
            pass
            
        self.user = authenticate(**authenticate_kwargs)
        
        if not self.user:
            raise serializers.ValidationError("No active account found with the given credentials")

        # Get the default token response
        data = super().validate(attrs)
        
        # Add custom claims
        data.update({
            'user_id': self.user.id,
            'role': self.user.role,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name
        })
        return data
    
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class SuperAdminRegistrationSerializer(serializers.ModelSerializer):
    generate_credentials = serializers.BooleanField(
        write_only=True, 
        default=True,
        help_text="Auto-generate password if True"
    )
    temporary_password = serializers.CharField(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'department_id',
            'generate_credentials',
            'temporary_password'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def validate(self, data):
        """
        Ensure only SuperAdmins can create other SuperAdmins
        and enforce role-specific rules
        """
        requesting_user = self.context['request'].user
        requested_role = data.get('role', User.Role.EMPLOYEE)

        # Only current SuperAdmins can create new SuperAdmins
        if requested_role == User.Role.SUPERADMIN:
            if not (requesting_user.role == User.Role.SUPERADMIN and 
                    requesting_user.is_superuser):
                raise serializers.ValidationError(
                    "Only SuperAdmins can create other SuperAdmins"
                )

        # SuperAdmins can't be assigned to departments
        if requested_role == User.Role.SUPERADMIN:
            data['department'] = None

        # Regular admins must have a department
        if requested_role == User.Role.ADMIN and not data.get('department'):
            raise serializers.ValidationError(
                "Admins must be assigned to a department"
            )

        return data

    def validate_role(self, value):
        """Ensure role is valid"""
        if value not in dict(User.Role.choices):
            raise serializers.ValidationError("Invalid role selection")
        return value

    def create(self, validated_data):
        generate_creds = validated_data.pop('generate_credentials', True)
        role = validated_data.get('role', User.Role.EMPLOYEE)
        
        if generate_creds:
            raw_password = get_random_string(8)  # 8-character random string
            validated_data['password'] = make_password(raw_password)
            temporary_password = raw_password
        
        # Special handling for SuperAdmins
        if role == User.Role.SUPERADMIN:
            validated_data.update({
                'is_superuser': True,
                'is_staff': True,
                'department': None  # SuperAdmins shouldn't belong to departments
            })
        
        # Create the user
        user = User.objects.create_user(**validated_data)
        
        # Store temp password if generated
        if generate_creds:
            user.temporary_password = temporary_password
            user.save()  # Save again to store the temp password
        
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile viewing/updating"""
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'department',
            'department_id',
            'date_joined',
            'last_login'
        ]
        read_only_fields = ['email', 'role', 'date_joined', 'last_login']

class UserSerializer(serializers.ModelSerializer):
    """Default serializer for user listing"""
    department = DepartmentSerializer(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'department',
            'is_active',
            'is_superuser',
            'date_joined',
            'last_login'
        ]
        read_only_fields = fields

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin user creation"""
    generate_credentials = serializers.BooleanField(
        write_only=True,
        default=True,
        help_text="Auto-generate password if True"
    )
    temporary_password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'role',
            'department',
            'password',
            'generate_credentials',
            'temporary_password'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def validate(self, data):
        """Ensure admins can't create SuperAdmins"""
        if data.get('role') == User.Role.SUPERADMIN:
            raise serializers.ValidationError(
                "Only SuperAdmins can create other SuperAdmins"
            )
        return data

    def create(self, validated_data):
        generate_creds = validated_data.pop('generate_credentials', True)
        
        if generate_creds:
            validated_data['password'] = User.objects.make_random_password()
        
        user = User.objects.create_user(**validated_data)
        
        if generate_creds:
            user.temporary_password = validated_data['password']
            user.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin user updates"""
    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'department',
            'is_active'
        ]
        extra_kwargs = {
            'email': {'read_only': True},
            'role': {'read_only': True}  # Prevent role changes via this endpoint
        }

    def validate_role(self, value):
        """Prevent role escalation"""
        instance = self.instance
        if instance and value != instance.role:
            raise serializers.ValidationError(
                "Role cannot be changed through this endpoint"
            )
        return value
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from users.models import Department
import uuid

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for admin user registration"""
    generate_credentials = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text=_("Auto-generate username/password if True")
    )
    temporary_password = serializers.CharField(read_only=True)
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
            'role',
            'department_id',
            'password',
            'generate_credentials',
            'temporary_password'
        ]
        extra_kwargs = {
            'password': {
                'write_only': True,
                'required': False,
                'style': {'input_type': 'password'}
            }
        }

    def validate(self, data):
        if not data.get('generate_credentials') and not data.get('password'):
            raise serializers.ValidationError(
                _("Either provide a password or set generate_credentials=True")
            )
        return data

    def create(self, validated_data):
        generate_creds = validated_data.pop('generate_credentials', False)
        
        if generate_creds:
            validated_data['password'] = str(uuid.uuid4())[:8]  # Generate random password
            user = User.objects.create_user(**validated_data)
            user.temporary_password = validated_data['password']
        else:
            user = User.objects.create_user(**validated_data)
            
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
            'date_joined'
        ]
        read_only_fields = ['email', 'role', 'date_joined']

class UserSerializer(serializers.ModelSerializer):
    """Default serializer for user listing"""
    department = DepartmentSerializer(read_only=True)

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
            'date_joined'
        ]
        read_only_fields = fields

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin user creation"""
    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'role',
            'department',
            'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

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
            'email': {'read_only': True}
        }
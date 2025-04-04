from rest_framework import serializers
from users.models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'role': {'required': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role']
        )
        return user
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'department', 'role']    
        
class AdminUserCreateSerializer(serializers.ModelSerializer):
    temporary_password = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'department', 'temporary_password']
        extra_kwargs = {
            'password': {'write_only': False, 'required': False}  # Password will be auto-generated
        }

    def create(self, validated_data):
        user = User.objects.create(
            **validated_data,
            # Password will be auto-set via save() method
        )
        return user        
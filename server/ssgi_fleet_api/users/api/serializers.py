from rest_framework import serializers
from users.models import User
import uuid

class UserRegistrationSerializer(serializers.ModelSerializer):
    generate_credentials = serializers.BooleanField(
        default=False,
        write_only=True,
        help_text="Set to True to auto-generate username/password"
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
            'password': {
                'write_only': True,
                'required': False,
                'style': {'input_type': 'password'}
            }
        }

    def validate(self, data):
        if not data.get('generate_credentials') and not data.get('password'):
            raise serializers.ValidationError(
                "Either provide a password or set generate_credentials=True"
            )
        return data

    def create(self, validated_data):
        generate_creds = validated_data.pop('generate_credentials', False)
        
        if generate_creds:
            # Auto-generate credentials
            validated_data['password'] = str(uuid.uuid4())[:8]  # 8-char random password
            user = User.objects.create_user(**validated_data)
            user.temporary_password = validated_data['password']
        else:
            # Manual credentials
            user = User.objects.create_user(**validated_data)
            
        return user
    

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'department', 'role']    
        
# class AdminUserCreateSerializer(serializers.ModelSerializer):
#     temporary_password = serializers.CharField(read_only=True)
    
#     class Meta:
#         model = User
#         fields = ['email', 'first_name', 'last_name', 'role', 'department', 'temporary_password']
#         extra_kwargs = {
#             'password': {'write_only': False, 'required': False}  # Password will be auto-generated
#         }

#     def create(self, validated_data):
#         user = User.objects.create(
#             **validated_data,
#             # Password will be auto-set via save() method
#         )
#         return user        
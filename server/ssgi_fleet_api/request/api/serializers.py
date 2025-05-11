from django.utils import timezone
from rest_framework import serializers
from ..models import Vehicle_Request
from django.utils.dateparse import parse_datetime
from users.api.serializers import UserSerializer
from users.models import Department



class RequesterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle_Request
        fields = [
            'pickup_location',
            'destination',
            'duration',
            'purpose',
            'passenger_count',
            'urgency'
        ]
        extra_kwargs = {
            'passenger_count': {'min_value': 1, 'max_value': 15}
        }

class RequesterViewSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Vehicle_Request
        fields = [
            'request_id',
            'pickup_location',
            'destination',
            'duration',
            'status',
            'status_display',
            'department_approval',
            'created_at'
        ]
        read_only_fields = fields  

class RequestSerializer(serializers.ModelSerializer):
    passenger_names = serializers.JSONField(
        required=False,
        help_text="List of passenger names as JSON array"
    )

    class Meta:
        model = Vehicle_Request
        fields = [
            'request_id',
            'pickup_location',
            'destination',
            "start_dateTime",
            "end_dateTime",
            'purpose',
            'passenger_count',
            'passenger_names',
            'urgency',
            'status',
            'cancellation_reason',
            'created_at'
        ]
        read_only_fields = [
            'request_id',
            'status',
            'cancellation_reason',
            'created_at'
        ]
        extra_kwargs = {
            'passenger_count': {'min_value': 1, 'max_value': 15},
            'duration' : {'required' : True}
        }

    def get_can_cancel(self, obj):
        """Frontend can check this to show/hide cancel button"""
        return obj.status == Vehicle_Request.Status.PENDING

    def get_is_expired(self, obj):
        """Check if pending request has expired"""
        if obj.status == Vehicle_Request.Status.PENDING and obj.expiry_time:
            return timezone.now() > obj.expiry_time
        return False
    
    def validate_passenger_names(self, value):
        """Validate passenger names format"""

        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of names")
        if len(value) > 15:  
            raise serializers.ValidationError("Maximum 15 passengers allowed")
        return value

    def validate(self, data):
        validated_data = super().validate(data)
        errors = {}
        
        # Get datetime values
        start_time = validated_data.get('start_dateTime')
        end_time = validated_data.get('end_dateTime')

        # Check if both datetimes are provided
        if not start_time or not end_time:
            errors["datetime"] = "Both start_dateTime and end_dateTime must be provided"

        # Ensure both datetimes are timezone-aware
        if timezone.is_naive(start_time):
            start_time = timezone.make_aware(start_time)
        if timezone.is_naive(end_time):
            end_time = timezone.make_aware(end_time)

        # Validate time ranges
        if start_time >= end_time:
            errors["end_dateTime"] = "Must be after start_dateTime"
        
        # Validate request isn't being made for past time
        if start_time < timezone.now():
            errors["start_dateTime"] = "Cannot create request for past time"
        
        # Validate passenger count
        if 'passenger_count' in validated_data and validated_data['passenger_count'] > 15:
            errors["passenger_count"] = "Maximum 15 passengers allowed"
        
        if "passenger_names" in validated_data and len(validated_data['passenger_names']) != validated_data['passenger_count']:
            errors["passenger_names"] = "Passenger names count must match passenger_count"
            # 
        # Update with timezone-aware datetimes
        validated_data['start_dateTime'] = start_time
        validated_data['end_dateTime'] = end_time
        
        if errors:
            # Return a DRF-standard validation error with explicit custom structure
            raise serializers.ValidationError({
                "status": False,
                "error": "validation_error",
                "message": "Invalid request data",
                "errors": errors,
                "status_code": 400
            })

        
        return validated_data

    def create(self, validated_data):

        """Auto-set requester and status when creating"""

        validated_data['requester'] = self.context['request'].user
        

        return super().create(validated_data)


class RequestListSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    approver_name = serializers.CharField(source='department_approver.get_full_name', read_only=True)
    
    class Meta:
        model = Vehicle_Request
        fields = [
            'request_id',
            'requester',
            'requester_name',
            'department_approver',
            'approver_name',
            'pickup_location',
            'destination',
            'created_at',
            'status'
        ]

class EmployeeRequestStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle_Request
        fields = [
            'request_id',
            'created_at',
            'status',
            'purpose'  
        ]
        read_only_fields = fields 

class RequestRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(
        required=True,
        max_length=500,
        help_text="Detailed explanation for rejection"
    )

    def validate_reason(self, value):
        """Ensure reason is meaningful"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Please provide a detailed reason (minimum 10 characters)")
        return value
    

from users.models import Department
class EmployeeAndDirectorDepartemntSerilizer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'director']


from users.models import User
class UserMatchSerializer(serializers.ModelSerializer):
    department = EmployeeAndDirectorDepartemntSerilizer()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'department', 'role']

class DepartmentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

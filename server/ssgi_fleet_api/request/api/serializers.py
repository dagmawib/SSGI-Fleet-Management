from time import timezone
from rest_framework import serializers
from ..models import Vehicle_Request


class RequesterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle_Request
        fields = [
            'pickup_location',
            'destination',
            'start_time',
            'end_time',
            'purpose',
            'passenger_count',
            'urgency'
        ]
        extra_kwargs = {
            'passenger_count': {'min_value': 1, 'max_value': 10}
        }

class RequesterViewSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Vehicle_Request
        fields = [
            'request_id',
            'pickup_location',
            'destination',
            'start_time',
            'end_time',
            'status',
            'status_display',
            'department_approval',
            'created_at'
        ]
        read_only_fields = fields  

class RequestSerializer(serializers.ModelSerializer):
    # requester_email = serializers.EmailField(source='requester.email', read_only=True)
    # status_display = serializers.CharField(source='get_status_display', read_only=True)
    # can_cancel = serializers.SerializerMethodField()
    # is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle_Request
        fields = [
            'request_id',
            'pickup_location',
            'destination',
            'start_time',
            'end_time',
            'purpose',
            'passenger_count',
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
            'passenger_count': {'min_value': 1, 'max_value': 10},
            'start_time': {'required': True},
            'end_time': {'required': True}
        }

    def get_can_cancel(self, obj):
        """Frontend can check this to show/hide cancel button"""
        return obj.status == Vehicle_Request.Status.PENDING

    def get_is_expired(self, obj):
        """Check if pending request has expired"""
        if obj.status == Vehicle_Request.Status.PENDING and obj.expiry_time:
            return timezone.now() > obj.expiry_time
        return False

    def validate(self, data):
        # Validate time ranges
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time")
        
        # Validate request isn't being made for past time
        if data['start_time'] < timezone.now():
            raise serializers.ValidationError("Cannot create request for past time")
        
        # Validate passenger count vs vehicle capacity
        if 'passenger_count' in data and data['passenger_count'] > 10:
            raise serializers.ValidationError("Maximum 10 passengers allowed")
        
        return data

    def create(self, validated_data):
        """Auto-set requester and status when creating"""
        validated_data['requester'] = self.context['request'].user
        validated_data['status'] = Vehicle_Request.Status.PENDING
        return super().create(validated_data)

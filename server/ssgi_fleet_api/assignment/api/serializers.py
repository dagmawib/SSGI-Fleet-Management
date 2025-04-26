from django.shortcuts import get_object_or_404
from rest_framework import serializers
from ..models import Vehicle_Assignment
from request.models import Vehicle_Request
from users.models import User
from vehicles.models import Vehicle



class AssignCarSerializer(serializers.ModelSerializer):
    request_id = serializers.IntegerField(write_only=True)
    vehicle_id = serializers.IntegerField(write_only=True)
    driver_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Vehicle_Assignment
        fields = [
            'request_id',
            'vehicle_id',
            'driver_id',
            'estimated_distance',
            'estimated_duration',
            'note'
        ]
        extra_kwargs = {
            'estimated_distance': {'required': False},
            'estimated_duration': {'required': False},
            'note': {'required': False}
        }

    def validate_request_id(self, value):
        try:
            request = Vehicle_Request.objects.get(pk=value)
            if request.status != Vehicle_Request.Status.APPROVED:
                raise serializers.ValidationError(
                    "Only approved requests can be assigned vehicles"
                )
            return value
        except Vehicle_Request.DoesNotExist:
            raise serializers.ValidationError(
                f"No vehicle request found with ID {value}"
            )

    def validate_vehicle_id(self, value):
        try:
            vehicle = Vehicle.objects.get(pk=value)
            if vehicle.status != Vehicle.Status.AVAILABLE:
                raise serializers.ValidationError(
                    f"Vehicle is currently {vehicle.get_status_display()}"
                )
            return value
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError(
                f"No vehicle found with ID {value}"
            )

    def validate_driver_id(self, value):
        try:
            driver = User.objects.get(pk=value)
            if driver.role != User.Role.DRIVER:
                raise serializers.ValidationError(
                    "Selected user is not a driver"
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                f"No user found with ID {value}"
            )

    def validate(self, data):
        # Check if request already has an assignment
        request = Vehicle_Request.objects.get(pk=data['request_id'])
        if Vehicle_Assignment.objects.filter(request=request).exists():
            raise serializers.ValidationError(
                {"request_id": "This request already has a vehicle assigned"}
            )
        return data
    
class RejectCarAssignmentSerializer(serializers.ModelSerializer):
    request_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = Vehicle_Assignment
        fields = [
            'request_id',
            'estimated_duration',
            'note'
        ]
        extra_kwargs = {
            'note': {'required': True}
        }

    def validate_request_id(self, value):
        try:
            request = Vehicle_Request.objects.get(pk=value)
            if request.status != Vehicle_Request.Status.APPROVED:
                raise serializers.ValidationError(
                    "Only approved requests can be assigned vehicles"
                )
            return value
        except Vehicle_Request.DoesNotExist:
            raise serializers.ValidationError(
                f"No vehicle request found with ID {value}"
            )
        self._validated_request = request
        return value


    def validate(self, data):

        request = getattr(self, '_validated_request', None)
        if not request:
             request = Vehicle_Request.objects.get(pk=data['request_id'])

        if Vehicle_Assignment.objects.filter(request=request).exists():
            raise serializers.ValidationError(
                {"request_id": "This request already has a vehicle assigned"}
            )
        
        if not data.get('note'):
            raise serializers.ValidationError({
                "note": "Note field is required."
            })
        
        return data
    
class GetRequestsForDriverSerializer(serializers.Serializer):
    driver_id = serializers.IntegerField()

    def validate_driver_id(self, value):
        try:
            driver = User.objects.get(pk=value)
            if driver.role != User.Role.DRIVER:
                raise serializers.ValidationError("Selected user is not a driver.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(f"No user found with ID {value}")

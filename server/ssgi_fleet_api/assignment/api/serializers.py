from django.shortcuts import get_object_or_404
from rest_framework import serializers
from ..models import Vehicle_Assignment, Trips
from ssgi_fleet_api.request.models import Vehicle_Request
from ssgi_fleet_api.users.models import User
from ssgi_fleet_api.vehicles.models import Vehicle
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError


class AssignCarSerializer(serializers.ModelSerializer):
    """
    Serializer for creating vehicle assignments.
    
    This serializer handles the assignment of vehicles to approved requests,
    including validation of request and vehicle status.
    """
    request_id = serializers.IntegerField(write_only=True)
    vehicle_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Vehicle_Assignment
        fields = [
            'request_id',
            'vehicle_id',
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
        """Validate that the request exists and is in APPROVED status."""
        try:
            request = Vehicle_Request.objects.get(pk=value)
            if request.status != Vehicle_Request.Status.APPROVED:
                raise serializers.ValidationError({
                    "request_id": f"Request must be in APPROVED status. Current status: {request.status}",
                    "current_status": request.status
                })
            return value
        except Vehicle_Request.DoesNotExist:
            raise serializers.ValidationError({
                "request_id": f"No vehicle request found with ID {value}",
                "error_code": "request_not_found"
            })

    def validate_vehicle_id(self, value):
        """Validate that the vehicle exists and is available."""
        try:
            vehicle = Vehicle.objects.get(pk=value)
            if vehicle.status != Vehicle.Status.AVAILABLE:
                raise serializers.ValidationError({
                    "vehicle_id": f"Vehicle must be AVAILABLE. Current status: {vehicle.get_status_display()}",
                    "current_status": vehicle.status
                })
            if not vehicle.assigned_driver:
                raise serializers.ValidationError({
                    "vehicle_id": "Vehicle must have an assigned driver",
                    "error_code": "no_driver_assigned"
                })
            return value
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError({
                "vehicle_id": f"No vehicle found with ID {value}",
                "error_code": "vehicle_not_found"
            })

    def validate(self, data):
        """Validate the complete assignment data."""
        # Check if request already has an assignment
        request = Vehicle_Request.objects.get(pk=data['request_id'])
        if Vehicle_Assignment.objects.filter(request=request).exists():
            raise serializers.ValidationError({
                "request_id": "This request already has a vehicle assigned",
                "error_code": "already_assigned"
            })
            
        # Validate vehicle-driver compatibility
        vehicle = Vehicle.objects.get(pk=data['vehicle_id'])
        if not vehicle.assigned_driver:
            raise serializers.ValidationError({
                "vehicle_id": "Vehicle must have an assigned driver",
                "error_code": "no_driver_assigned"
            })
            
        return data


class RejectCarAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for rejecting vehicle requests by admin.
    
    This serializer handles the rejection of vehicle requests,
    requiring a mandatory note explaining the rejection reason.
    """
    request_id = serializers.IntegerField(write_only=True)
    note = serializers.CharField(
        required=True,
        min_length=10,
        help_text="Mandatory explanation for rejecting the request"
    )
    
    class Meta:
        model = Vehicle_Assignment
        fields = [
            'request_id',
            'note'
        ]

    def validate_request_id(self, value):
        """Validate that the request exists and can be rejected."""
        try:
            request = Vehicle_Request.objects.get(pk=value)
            if request.status != Vehicle_Request.Status.APPROVED:
                raise serializers.ValidationError({
                    "request_id": f"Only approved requests can be rejected. Current status: {request.status}",
                    "current_status": request.status
                })
            self._validated_request = request
            return value
        except Vehicle_Request.DoesNotExist:
            raise serializers.ValidationError({
                "request_id": f"No vehicle request found with ID {value}",
                "error_code": "request_not_found"
            })

    def validate(self, data):
        """Validate the complete rejection data."""
        if not data.get('note'):
            raise serializers.ValidationError({
                "note": "Note field is required for rejections",
                "error_code": "missing_note"
            })
        return data


class AcceptAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for drivers accepting assignments.
    
    This serializer handles the driver's acceptance of an assignment,
    including recording the start mileage and creating a trip record.
    """
    start_mileage = serializers.DecimalField(
        max_digits=12,
        decimal_places=1,
        required=True,
        min_value=0,
        help_text="Current mileage of the vehicle (in km) before trip starts"
    )
    
    class Meta:
        model = Trips
        fields = [
            "trip_id",
            "start_mileage",  
        ]
        read_only_fields = ["trip_id"]

    def validate(self, data):
        """Validate the acceptance data."""
        assignment_id = self.context.get('assignment_id')
        if not assignment_id:
            raise serializers.ValidationError({
                "error": "Assignment ID is required",
                "error_code": "missing_assignment_id"
            })
            
        try:
            assignment = Vehicle_Assignment.objects.select_related('vehicle').get(pk=assignment_id)
            vehicle = assignment.vehicle

            if data['start_mileage'] < vehicle.current_mileage:
                raise serializers.ValidationError({
                    "start_mileage": f"Mileage must be ≥ vehicle's current mileage ({vehicle.current_mileage} km)",
                    "current_mileage": vehicle.current_mileage
                })
                
            if assignment.driver_status != Vehicle_Assignment.DriverStatus.PENDING:
                raise serializers.ValidationError({
                    "error": f"Assignment cannot be accepted because its status is {assignment.driver_status}",
                    "current_status": assignment.driver_status
                })
                
            return data
        except Vehicle_Assignment.DoesNotExist:
            raise serializers.ValidationError({
                "error": "Invalid assignment ID",
                "error_code": "assignment_not_found"
            })
    
    @transaction.atomic
    def create(self, validated_data):
        """Create a new trip record for the accepted assignment."""
        assignment = Vehicle_Assignment.objects.get(pk=self.context["assignment_id"])
        
        # Update vehicle mileage
        assignment.vehicle.current_mileage = validated_data['start_mileage']
        assignment.vehicle.save()

        # Update assignment status
        assignment.driver_response_time = timezone.now()
        assignment.driver_status = Vehicle_Assignment.DriverStatus.ACCEPTED
        assignment.save()

        # Create trip record
        current_time = timezone.now()
        trip = Trips.objects.create(
            assignment=assignment,
            start_mileage=validated_data['start_mileage'],
            status=Trips.TripStatus.STARTED,
            start_time=current_time
        )
        return trip


class DeclineAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for drivers declining assignments.
    
    This serializer handles the driver's declination of an assignment,
    requiring a mandatory reason for the decline.
    """
    rejection_reason = serializers.CharField(
        required=True,
        min_length=10,
        help_text="Mandatory explanation for declining the assignment"
    )
    
    class Meta:
        model = Trips
        fields = [
            "trip_id",
            "rejection_reason"
        ]
        read_only_fields = ["trip_id"]

    def validate(self, data):
        """Validate the decline data."""
        assignment_id = self.context.get('assignment_id')
        if not assignment_id:
            raise serializers.ValidationError({
                "error": "Assignment ID is required",
                "error_code": "missing_assignment_id"
            })
            
        try:
            assignment = Vehicle_Assignment.objects.get(
                pk=assignment_id,
                driver_status=Vehicle_Assignment.DriverStatus.PENDING
            )
        except Vehicle_Assignment.DoesNotExist:
            raise serializers.ValidationError({
                "error": "No pending assignment found with this ID",
                "error_code": "assignment_not_found"
            })
            
        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create a declined trip record."""
        assignment = Vehicle_Assignment.objects.get(pk=self.context["assignment_id"])
        
        # Update assignment status
        assignment.driver_response_time = timezone.now()
        assignment.driver_status = Vehicle_Assignment.DriverStatus.DECLINED
        assignment.decline_reason = validated_data['rejection_reason']
        assignment.save()

        # Create declined trip record
        trip = Trips.objects.create(
            assignment=assignment,
            status=Trips.TripStatus.DECLINED,
            start_time=timezone.now(),  # Use current time as start time for declined trips
            start_mileage=assignment.vehicle.current_mileage  # Set start_mileage to vehicle's current mileage
        )
        return trip


class CompleteAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for completing trips.
    
    This serializer handles the completion of a trip, including:
    - Recording end mileage
    - Updating vehicle status
    - Calculating trip statistics
    """
    end_mileage = serializers.DecimalField(
        max_digits=12,
        decimal_places=1,
        required=True,
        min_value=0,
        help_text="Final mileage of the vehicle (in km) after trip completion"
    )
    
    class Meta:
        model = Trips
        fields = [
            "trip_id",
            "end_mileage"
        ]
        read_only_fields = ["trip_id"]

    def validate(self, data):
        """Validate the completion data."""
        instance = self.instance
        if not instance:
            raise serializers.ValidationError({
                "error": "Trip instance is required",
                "error_code": "missing_trip"
            })
            
        if instance.status != Trips.TripStatus.STARTED:
            raise serializers.ValidationError({
                "error": f"Cannot complete trip with status {instance.status}",
                "current_status": instance.status
            })
            
        if data['end_mileage'] < instance.start_mileage:
            raise serializers.ValidationError({
                "end_mileage": f"End mileage ({data['end_mileage']}) must be ≥ start mileage ({instance.start_mileage})",
                "start_mileage": instance.start_mileage
            })
            
        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update the trip and related records on completion."""
        # Update vehicle mileage
        vehicle = instance.assignment.vehicle
        vehicle.current_mileage = validated_data['end_mileage']
        vehicle.status = Vehicle.Status.AVAILABLE  # Make vehicle available again
        vehicle.save()

        # Update assignment status
        instance.assignment.driver_status = Vehicle_Assignment.DriverStatus.COMPLETED
        instance.assignment.save()

        # Update trip record
        instance.end_mileage = validated_data['end_mileage']
        instance.status = Trips.TripStatus.COMPLETED
        instance.end_time = timezone.now()
        instance.save()

        return instance


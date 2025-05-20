import logging
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from ..models import Vehicle_Assignment, Trips
from request.models import Vehicle_Request
from users.models import User
from vehicles.models import Vehicle
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

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
                logger.warning(f"[AssignCarSerializer][validate_request_id] Request {value} not APPROVED. Current status: {request.status}")
                raise serializers.ValidationError({
                    "request_id": f"Request must be in APPROVED status. Current status: {request.status}",
                    "current_status": request.status
                })
            return value
        except Vehicle_Request.DoesNotExist:
            logger.error(f"[AssignCarSerializer][validate_request_id] No vehicle request found with ID {value}")
            raise serializers.ValidationError({
                "request_id": f"No vehicle request found with ID {value}",
                "error_code": "request_not_found"
            })
        except Exception as e:
            logger.exception(f"[AssignCarSerializer][validate_request_id] Unexpected error: {e}")
            raise serializers.ValidationError({
                "request_id": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })

    def validate_vehicle_id(self, value):
        """Validate that the vehicle exists and is available."""
        try:
            vehicle = Vehicle.objects.get(pk=value)
            if vehicle.status != Vehicle.Status.AVAILABLE:
                logger.warning(f"[AssignCarSerializer][validate_vehicle_id] Vehicle {value} not AVAILABLE. Current status: {vehicle.get_status_display()}")
                raise serializers.ValidationError({
                    "vehicle_id": f"Vehicle must be AVAILABLE. Current status: {vehicle.get_status_display()}",
                    "current_status": vehicle.status
                })
            if not vehicle.assigned_driver:
                logger.warning(f"[AssignCarSerializer][validate_vehicle_id] Vehicle {value} has no assigned driver.")
                raise serializers.ValidationError({
                    "vehicle_id": "Vehicle must have an assigned driver",
                    "error_code": "no_driver_assigned"
                })
            return value
        except Vehicle.DoesNotExist:
            logger.error(f"[AssignCarSerializer][validate_vehicle_id] No vehicle found with ID {value}")
            raise serializers.ValidationError({
                "vehicle_id": f"No vehicle found with ID {value}",
                "error_code": "vehicle_not_found"
            })
        except Exception as e:
            logger.exception(f"[AssignCarSerializer][validate_vehicle_id] Unexpected error: {e}")
            raise serializers.ValidationError({
                "vehicle_id": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })

    def validate(self, data):
        """Validate the complete assignment data."""
        try:
            request = Vehicle_Request.objects.get(pk=data['request_id'])
            if Vehicle_Assignment.objects.filter(request=request).exists():
                logger.warning(f"[AssignCarSerializer][validate] Request {data['request_id']} already has an assignment.")
                raise serializers.ValidationError({
                    "request_id": "This request already has a vehicle assigned",
                    "error_code": "already_assigned"
                })
            vehicle = Vehicle.objects.get(pk=data['vehicle_id'])
            if not vehicle.assigned_driver:
                logger.warning(f"[AssignCarSerializer][validate] Vehicle {data['vehicle_id']} has no assigned driver.")
                raise serializers.ValidationError({
                    "vehicle_id": "Vehicle must have an assigned driver",
                    "error_code": "no_driver_assigned"
                })
            return data
        except Vehicle_Request.DoesNotExist:
            logger.error(f"[AssignCarSerializer][validate] No vehicle request found with ID {data.get('request_id')}")
            raise serializers.ValidationError({
                "request_id": f"No vehicle request found with ID {data.get('request_id')}",
                "error_code": "request_not_found"
            })
        except Vehicle.DoesNotExist:
            logger.error(f"[AssignCarSerializer][validate] No vehicle found with ID {data.get('vehicle_id')}")
            raise serializers.ValidationError({
                "vehicle_id": f"No vehicle found with ID {data.get('vehicle_id')}",
                "error_code": "vehicle_not_found"
            })
        except Exception as e:
            logger.exception(f"[AssignCarSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
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
                logger.warning(f"[RejectCarAssignmentSerializer][validate_request_id] Request {value} not APPROVED. Current status: {request.status}")
                raise serializers.ValidationError({
                    "request_id": f"Only approved requests can be rejected. Current status: {request.status}",
                    "current_status": request.status
                })
            self._validated_request = request
            return value
        except Vehicle_Request.DoesNotExist:
            logger.error(f"[RejectCarAssignmentSerializer][validate_request_id] No vehicle request found with ID {value}")
            raise serializers.ValidationError({
                "request_id": f"No vehicle request found with ID {value}",
                "error_code": "request_not_found"
            })
        except Exception as e:
            logger.exception(f"[RejectCarAssignmentSerializer][validate_request_id] Unexpected error: {e}")
            raise serializers.ValidationError({
                "request_id": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })

    def validate(self, data):
        """Validate the complete rejection data."""
        try:
            if not data.get('note'):
                logger.warning("[RejectCarAssignmentSerializer][validate] Note field is required for rejections.")
                raise serializers.ValidationError({
                    "note": "Note field is required for rejections",
                    "error_code": "missing_note"
                })
            return data
        except Exception as e:
            logger.exception(f"[RejectCarAssignmentSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })


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
            logger.error("[AcceptAssignmentSerializer][validate] Assignment ID is required in context.")
            raise serializers.ValidationError({
                "error": "Assignment ID is required",
                "error_code": "missing_assignment_id"
            })
        try:
            assignment = Vehicle_Assignment.objects.select_related('vehicle').get(pk=assignment_id)
            vehicle = assignment.vehicle
            if not vehicle:
                logger.error(f"[AcceptAssignmentSerializer][validate] Assignment {assignment_id} has no vehicle.")
                raise serializers.ValidationError({
                    "error": "Assignment has no associated vehicle",
                    "error_code": "no_vehicle"
                })
            if data['start_mileage'] < vehicle.current_mileage:
                logger.warning(f"[AcceptAssignmentSerializer][validate] Provided start_mileage {data['start_mileage']} < vehicle's current_mileage {vehicle.current_mileage} for assignment {assignment_id}.")
                raise serializers.ValidationError({
                    "start_mileage": f"Mileage must be ≥ vehicle's current mileage ({vehicle.current_mileage} km)",
                    "current_mileage": vehicle.current_mileage
                })
            if assignment.driver_status != Vehicle_Assignment.DriverStatus.PENDING:
                logger.warning(f"[AcceptAssignmentSerializer][validate] Assignment {assignment_id} not pending. Current status: {assignment.driver_status}")
                raise serializers.ValidationError({
                    "error": f"Assignment cannot be accepted because its status is {assignment.driver_status}",
                    "current_status": assignment.driver_status
                })
            return data
        except Vehicle_Assignment.DoesNotExist:
            logger.error(f"[AcceptAssignmentSerializer][validate] Invalid assignment ID {assignment_id}")
            raise serializers.ValidationError({
                "error": "Invalid assignment ID",
                "error_code": "assignment_not_found"
            })
        except Exception as e:
            logger.exception(f"[AcceptAssignmentSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })

    @transaction.atomic
    def create(self, validated_data):
        """Create a new trip record for the accepted assignment."""
        try:
            assignment = Vehicle_Assignment.objects.select_related('vehicle').get(pk=self.context["assignment_id"])
            vehicle = assignment.vehicle
            # Defensive: check again before update
            if validated_data['start_mileage'] < vehicle.current_mileage:
                logger.error(f"[AcceptAssignmentSerializer][create] Provided start_mileage {validated_data['start_mileage']} < vehicle's current_mileage {vehicle.current_mileage} for assignment {assignment.assignment_id}.")
                raise serializers.ValidationError({
                    "start_mileage": f"Mileage must be ≥ vehicle's current mileage ({vehicle.current_mileage} km)",
                    "current_mileage": vehicle.current_mileage
                })
            # Update vehicle mileage
            vehicle.current_mileage = validated_data['start_mileage']
            vehicle.save()
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
            logger.info(f"[AcceptAssignmentSerializer][create] Trip {trip.trip_id} created for assignment {assignment.assignment_id} by driver {assignment.driver_id}.")
            return trip
        except Vehicle_Assignment.DoesNotExist:
            logger.error(f"[AcceptAssignmentSerializer][create] Assignment not found for ID {self.context.get('assignment_id')}")
            raise serializers.ValidationError({
                "error": "Assignment not found",
                "error_code": "assignment_not_found"
            })
        except Exception as e:
            logger.exception(f"[AcceptAssignmentSerializer][create] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })


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
            logger.error("[DeclineAssignmentSerializer][validate] Assignment ID is required in context.")
            raise serializers.ValidationError({
                "error": "Assignment ID is required",
                "error_code": "missing_assignment_id"
            })
        try:
            assignment = Vehicle_Assignment.objects.get(
                pk=assignment_id,
                driver_status=Vehicle_Assignment.DriverStatus.PENDING
            )
            return data
        except Vehicle_Assignment.DoesNotExist:
            logger.error(f"[DeclineAssignmentSerializer][validate] No pending assignment found with ID {assignment_id}")
            raise serializers.ValidationError({
                "error": "No pending assignment found with this ID",
                "error_code": "assignment_not_found"
            })
        except Exception as e:
            logger.exception(f"[DeclineAssignmentSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })

    @transaction.atomic
    def create(self, validated_data):
        """Create a declined trip record."""
        try:
            assignment = Vehicle_Assignment.objects.select_related('vehicle').get(pk=self.context["assignment_id"])
            # Defensive: check assignment status
            if assignment.driver_status != Vehicle_Assignment.DriverStatus.PENDING:
                logger.error(f"[DeclineAssignmentSerializer][create] Assignment {assignment.assignment_id} is not pending.")
                raise serializers.ValidationError({
                    "error": "Assignment is not pending and cannot be declined",
                    "error_code": "not_pending"
                })
            # Update assignment status
            assignment.driver_response_time = timezone.now()
            assignment.driver_status = Vehicle_Assignment.DriverStatus.DECLINED
            assignment.decline_reason = validated_data['rejection_reason']
            assignment.save()
            # Create declined trip record
            trip = Trips.objects.create(
                assignment=assignment,
                status=Trips.TripStatus.DECLINED,
                start_time=timezone.now(),
                start_mileage=assignment.vehicle.current_mileage
            )
            logger.info(f"[DeclineAssignmentSerializer][create] Declined trip {trip.trip_id} created for assignment {assignment.assignment_id} by driver {assignment.driver_id}.")
            return trip
        except Vehicle_Assignment.DoesNotExist:
            logger.error(f"[DeclineAssignmentSerializer][create] Assignment not found for ID {self.context.get('assignment_id')}")
            raise serializers.ValidationError({
                "error": "Assignment not found",
                "error_code": "assignment_not_found"
            })
        except Exception as e:
            logger.exception(f"[DeclineAssignmentSerializer][create] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })


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
            logger.error("[CompleteAssignmentSerializer][validate] Trip instance is required.")
            raise serializers.ValidationError({
                "error": "Trip instance is required",
                "error_code": "missing_trip"
            })
        try:
            if instance.status != Trips.TripStatus.STARTED:
                logger.warning(f"[CompleteAssignmentSerializer][validate] Cannot complete trip with status {instance.status}")
                raise serializers.ValidationError({
                    "error": f"Cannot complete trip with status {instance.status}",
                    "current_status": instance.status
                })
            if data['end_mileage'] < instance.start_mileage:
                logger.warning(f"[CompleteAssignmentSerializer][validate] End mileage {data['end_mileage']} < start mileage {instance.start_mileage}")
                raise serializers.ValidationError({
                    "end_mileage": f"End mileage ({data['end_mileage']}) must be ≥ start mileage ({instance.start_mileage})",
                    "start_mileage": instance.start_mileage
                })
            return data
        except Exception as e:
            logger.exception(f"[CompleteAssignmentSerializer][validate] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update the trip and related records on completion."""
        try:
            vehicle = instance.assignment.vehicle
            # Defensive: check mileage
            if validated_data['end_mileage'] < instance.start_mileage:
                logger.error(f"[CompleteAssignmentSerializer][update] End mileage {validated_data['end_mileage']} < start mileage {instance.start_mileage}")
                raise serializers.ValidationError({
                    "end_mileage": f"End mileage ({validated_data['end_mileage']}) must be ≥ start mileage ({instance.start_mileage})",
                    "start_mileage": instance.start_mileage
                })
            # Update vehicle mileage
            vehicle.current_mileage = validated_data['end_mileage']
            vehicle.status = Vehicle.Status.AVAILABLE
            vehicle.save()
            # Update assignment status
            instance.assignment.driver_status = Vehicle_Assignment.DriverStatus.COMPLETED
            instance.assignment.save()
            # Update trip record
            instance.end_mileage = validated_data['end_mileage']
            instance.status = Trips.TripStatus.COMPLETED
            instance.end_time = timezone.now()
            instance.save()
            logger.info(f"[CompleteAssignmentSerializer][update] Trip {instance.trip_id} completed for assignment {instance.assignment.assignment_id} by driver {instance.assignment.driver_id}.")
            return instance
        except Exception as e:
            logger.exception(f"[CompleteAssignmentSerializer][update] Unexpected error: {e}")
            raise serializers.ValidationError({
                "error": f"Unexpected error: {str(e)}",
                "error_code": "unexpected_error"
            })


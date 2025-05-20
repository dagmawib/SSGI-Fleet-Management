from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    AssignCarSerializer,
    RejectCarAssignmentSerializer,
    AcceptAssignmentSerializer,
    DeclineAssignmentSerializer,
    CompleteAssignmentSerializer
)
from .permissions import IsAdminOrSuperAdmin, IsDriver
from .docs import (
    assign_car_docs,
    reject_car_assignment_docs,
    DRIVER_REQUEST_GET_DOCS,
    ACCEPT_ASSIGNMENT_DOCS,
    DECLINE_ASSIGNMENT_DOCS,
    COMPLETE_ASSIGNMENT_DOCS,
    admin_assignment_history_docs
)
from ..models import Vehicle_Assignment, Trips
from request.models import Vehicle_Request
from vehicles.models import Vehicle
from users.models import User


class AssignCarAPIView(APIView):
    """
    API endpoint for admins to assign vehicles to approved requests.
    
    This endpoint allows admins to:
    1. Assign a specific vehicle to an approved request
    2. Automatically assign the vehicle's driver
    3. Update vehicle and request status
    
    Permissions:
    - User must be authenticated
    - User must be an admin or superadmin
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    @assign_car_docs
    def post(self, request):
        """Create a new vehicle assignment."""
        serializer = AssignCarSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                # Get validated objects
                vehicle_request = Vehicle_Request.objects.select_related('requester', 'department_approver').get(pk=serializer.validated_data['request_id'])
                vehicle = Vehicle.objects.select_related('assigned_driver').get(pk=serializer.validated_data['vehicle_id'])
                driver = vehicle.assigned_driver
                
                # Create the assignment
                assignment = Vehicle_Assignment.objects.create(
                    request=vehicle_request,
                    vehicle=vehicle,
                    driver=driver,
                    assigned_by=request.user,
                    note=serializer.validated_data.get('note', ''),
                    estimated_distance=serializer.validated_data.get('estimated_distance'),
                    estimated_duration=serializer.validated_data.get('estimated_duration')
                )
                
                # Update request status
                vehicle_request.status = Vehicle_Request.Status.ASSIGNED
                vehicle_request.save()
                
                # Update vehicle status
                vehicle.status = Vehicle.Status.IN_USE
                vehicle.save()
                
                # Send emails to requester and driver after commit
                from django.db import transaction as dj_transaction
                def send_assignment_emails():
                    try:
                        from django.core.mail import send_mail
                        # Email to requester
                        requester_email = vehicle_request.requester.email
                        requester_subject = "Vehicle Assignment Notification"
                        requester_message = (
                            f"Dear {vehicle_request.requester.get_full_name()},\n\n"
                            f"Your vehicle request has been assigned.\n"
                            f"Vehicle: {vehicle.make} {vehicle.model} ({vehicle.license_plate})\n"
                            f"Driver: {driver.get_full_name()} ({driver.phone_number})\n\n"
                            f"Pickup: {vehicle_request.pickup_location}\nDestination: {vehicle_request.destination}\n"
                            f"Start: {vehicle_request.start_dateTime}\nEnd: {vehicle_request.end_dateTime}\n"
                            f"Purpose: {vehicle_request.purpose}\n\n"
                            f"Thank you,\nSSGI Fleet Management Team"
                        )
                        send_mail(
                            requester_subject,
                            requester_message,
                            None,
                            [requester_email],
                            fail_silently=False,
                        )
                        # Email to driver
                        if driver and driver.email:
                            driver_subject = "New Vehicle Assignment"
                            driver_message = (
                                f"Dear {driver.get_full_name()},\n\n"
                                f"You have been assigned to a new vehicle request.\n"
                                f"Requester: {vehicle_request.requester.get_full_name()} ({vehicle_request.requester.phone_number})\n"
                                f"Vehicle: {vehicle.make} {vehicle.model} ({vehicle.license_plate})\n"
                                f"Pickup: {vehicle_request.pickup_location}\nDestination: {vehicle_request.destination}\n"
                                f"Start: {vehicle_request.start_dateTime}\nEnd: {vehicle_request.end_dateTime}\n"
                                f"Purpose: {vehicle_request.purpose}\n\n"
                                f"Please check your dashboard for more details.\n\n"
                                f"Thank you,\nSSGI Fleet Management Team"
                            )
                            send_mail(
                                driver_subject,
                                driver_message,
                                None,
                                [driver.email],
                                fail_silently=False,
                            )
                    except Exception as email_exc:
                        print(f"[AssignCarAPIView][send_assignment_emails] Email sending failed: {email_exc}")
                dj_transaction.on_commit(send_assignment_emails)
                
                return Response(
                    {
                        "assignment_id": assignment.assignment_id,
                        "request_id": assignment.request.request_id,
                        "vehicle": {
                            "id": assignment.vehicle.id,
                            "license_plate": assignment.vehicle.license_plate,
                            "make_model": f"{assignment.vehicle.make} {assignment.vehicle.model}",
                            "status": assignment.vehicle.get_status_display()
                        },
                        "driver": {
                            "id": assignment.driver.id,
                            "name": assignment.driver.get_full_name(),
                            "phone": assignment.driver.phone_number
                        },
                        "requester": {
                            "name": assignment.request.requester.get_full_name(),
                            "department": assignment.request.requester.department.name if assignment.request.requester.department else None
                        },
                        "trip_details": {
                            "pickup": assignment.request.pickup_location,
                            "destination": assignment.request.destination,
                            "start_time": assignment.request.start_dateTime,
                            "end_time": assignment.request.end_dateTime,
                            "purpose": assignment.request.purpose,
                            "passengers": assignment.request.passenger_count
                        },
                        "assigned_by": request.user.get_full_name(),
                        "assigned_at": assignment.assigned_at,
                        "assignment_status": assignment.get_driver_status_display(),
                        "note": assignment.note,
                        "estimated_distance": assignment.estimated_distance,
                        "estimated_duration": assignment.estimated_duration
                    },
                    status=status.HTTP_201_CREATED
                )
                
        except (Vehicle_Request.DoesNotExist, Vehicle.DoesNotExist) as e:
            print(f"[AssignCarAPIView][POST] Not found: {e}")
            return Response(
                {
                    "error": str(e),
                    "error_code": "not_found",
                    "details": "The requested vehicle or request does not exist."
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"[AssignCarAPIView][POST] Assignment failed: {e}")
            return Response(
                {
                    "error": str(e),
                    "error_code": "assignment_failed",
                    "details": "Failed to create the assignment. Please try again."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
class CarRejectAPIView(APIView):
    """
    API endpoint for admins to reject vehicle requests.
    
    This endpoint allows admins to:
    1. Reject an approved request
    2. Provide a mandatory rejection reason
    
    Permissions:
    - User must be authenticated
    - User must be an admin or superadmin
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    @reject_car_assignment_docs
    def post(self, request):
        """Reject a vehicle request."""
        serializer = RejectCarAssignmentSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                vehicle_request = Vehicle_Request.objects.select_related('requester').get(
                    request_id=serializer.validated_data['request_id']
                )
                vehicle_request.status = Vehicle_Request.Status.REJECTED
                vehicle_request.save()
                
                # Send rejection email to requester after commit
                from django.db import transaction as dj_transaction
                def send_rejection_email():
                    try:
                        from django.core.mail import send_mail
                        requester_email = vehicle_request.requester.email
                        subject = "Vehicle Request Rejected"
                        message = (
                            f"Dear {vehicle_request.requester.get_full_name()},\n\n"
                            f"Your vehicle request has been rejected.\n"
                            f"Reason: {serializer.validated_data.get('note', 'No reason provided.')}\n\n"
                            f"If you have questions, please contact your administrator.\n\n"
                            f"Thank you,\nSSGI Fleet Management Team"
                        )
                        send_mail(
                            subject,
                            message,
                            None,
                            [requester_email],
                            fail_silently=False,
                        )
                    except Exception as email_exc:
                        print(f"[CarRejectAPIView][send_rejection_email] Email sending failed: {email_exc}")
                dj_transaction.on_commit(send_rejection_email)
                
                return Response({
                    "status": "rejected",
                    "message": f"Vehicle request {vehicle_request.request_id} has been rejected.",
                    "request_id": vehicle_request.request_id,
                    "note": serializer.validated_data.get('note', ''),
                    "rejected_by": request.user.get_full_name(),
                    "rejected_at": timezone.now()
                }, status=status.HTTP_200_OK)
                
        except Vehicle_Request.DoesNotExist:
            print("[CarRejectAPIView][POST] Request not found.")
            return Response(
                {
                    'error': 'The requested vehicle request does not exist.',
                    'error_code': 'request_not_found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"[CarRejectAPIView][POST] Rejection failed: {e}")
            return Response(
                {
                    "error": str(e),
                    "error_code": "rejection_failed",
                    "details": "Failed to reject the request. Please try again."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        

class DriverRequestView(APIView):
    """
    API endpoint for drivers to view their current assignments.
    
    This endpoint allows drivers to:
    1. View their pending assignments
    2. Get complete details about the request and requester
    
    Permissions:
    - User must be authenticated
    - User must be a driver
    """
    permission_classes = [IsAuthenticated, IsDriver]
    @DRIVER_REQUEST_GET_DOCS
    def get(self, request):
        """Get the driver's current assignment or ongoing trip."""
        try:
            # 1. Check for an ongoing trip (status=STARTED) for this driver
            ongoing_trip = Trips.objects.filter(
                assignment__driver=request.user,
                status=Trips.TripStatus.STARTED
            ).select_related(
                'assignment',
                'assignment__request',
                'assignment__request__requester',
                'assignment__request__requester__department',
                'assignment__vehicle'
            ).first()
            if ongoing_trip:
                assignment = ongoing_trip.assignment
                vc_request = assignment.request
                requester = vc_request.requester
                return Response({
                    "assignment_id": assignment.assignment_id,
                    "trip_id": ongoing_trip.trip_id,
                    "request_id": vc_request.request_id,
                    "pickup": vc_request.pickup_location,
                    "destination": vc_request.destination,
                    "requester": {
                        "name": requester.get_full_name(),
                        "department": requester.department.name if requester.department else None,
                        "phone": requester.phone_number
                    },
                    "vehicle": {
                        "id": assignment.vehicle.id,
                        "license_plate": assignment.vehicle.license_plate,
                        "make_model": f"{assignment.vehicle.make} {assignment.vehicle.model}"
                    },
                    "trip_details": {
                        "passenger_count": vc_request.passenger_count,
                        "start_time": ongoing_trip.start_time,
                        "start_mileage": ongoing_trip.start_mileage,
                        "purpose": vc_request.purpose,
                        "estimated_distance": assignment.estimated_distance,
                        "estimated_duration": assignment.estimated_duration
                    },
                    "assignment_status": assignment.get_driver_status_display(),
                    "note": assignment.note,
                    "assigned_at": assignment.assigned_at
                }, status=status.HTTP_200_OK)

            # 2. If no ongoing trip, check for a pending assignment
            assignment = Vehicle_Assignment.objects.filter(
                driver=request.user,
                driver_status=Vehicle_Assignment.DriverStatus.PENDING
            ).select_related(
                'request',
                'request__requester',
                'request__requester__department',
                'vehicle'
            ).first()
            if not assignment:
                return Response(
                    {
                        "detail": "No pending or ongoing assignment found.",
                        "error_code": "no_pending_or_ongoing_assignment"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            vc_request = assignment.request
            if vc_request.status != Vehicle_Request.Status.ASSIGNED:
                return Response(
                    {
                        "detail": "No active assigned request found.",
                        "error_code": "no_active_request"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            requester = vc_request.requester
            return Response({
                "assignment_id": assignment.assignment_id,
                "request_id": vc_request.request_id,
                "pickup": vc_request.pickup_location,
                "destination": vc_request.destination,
                "requester": {
                    "name": requester.get_full_name(),
                    "department": requester.department.name if requester.department else None,
                    "phone": requester.phone_number
                },
                "vehicle": {
                    "id": assignment.vehicle.id,
                    "license_plate": assignment.vehicle.license_plate,
                    "make_model": f"{assignment.vehicle.make} {assignment.vehicle.model}"
                },
                "trip_details": {
                    "passenger_count": vc_request.passenger_count,
                    "start_time": vc_request.start_dateTime,
                    "end_time": vc_request.end_dateTime,
                    "purpose": vc_request.purpose,
                    "estimated_distance": assignment.estimated_distance,
                    "estimated_duration": assignment.estimated_duration
                },
                "assignment_status": assignment.get_driver_status_display(),
                "note": assignment.note,
                "assigned_at": assignment.assigned_at
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "error_code": "fetch_failed",
                    "details": "Failed to fetch assignment details. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AcceptAssignmentAPIView(APIView):
    """
    API endpoint for drivers to accept assignments.
    
    This endpoint allows drivers to:
    1. Accept a pending assignment
    2. Record the starting mileage
    3. Create a trip record
    
    Permissions:
    - User must be authenticated
    - User must be a driver
    """
    permission_classes = [IsAuthenticated, IsDriver]
    @ACCEPT_ASSIGNMENT_DOCS
    def post(self, request, assignment_id):
        """Accept an assignment and start a trip."""
        try:
            # Try to fetch the assignment for this driver
            assignment = Vehicle_Assignment.objects.select_related('vehicle', 'driver').filter(
                pk=assignment_id,
                driver=request.user
            ).first()
            if not assignment:
                return Response(
                    {
                        "error": f"No assignment found with ID {assignment_id} for this driver.",
                        "error_code": "assignment_not_found",
                        "user": request.user.get_full_name(),
                        "assignment_id": assignment_id
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            if assignment.driver_status != Vehicle_Assignment.DriverStatus.PENDING:
                return Response(
                    {
                        "error": f"Assignment {assignment_id} is not pending. Current status: {assignment.driver_status}",
                        "error_code": "assignment_not_pending",
                        "current_status": assignment.driver_status
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "error_code": "assignment_lookup_failed",
                    "details": "Failed to fetch assignment for acceptance."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = AcceptAssignmentSerializer(
            data=request.data,
            context={'assignment_id': assignment_id}
        )
        if not serializer.is_valid():
            return Response(
                {
                    "errors": serializer.errors,
                    "error_code": "validation_error"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            with transaction.atomic():
                trip = serializer.save()
                return Response({
                    "status": "accepted",
                    "trip_id": trip.trip_id,
                    "assignment_id": assignment_id,
                    "start_mileage": trip.start_mileage,
                    "start_time": trip.start_time,
                    "driver": request.user.get_full_name(),
                    "vehicle": {
                        "id": assignment.vehicle.id,
                        "license_plate": assignment.vehicle.license_plate,
                        "make_model": f"{assignment.vehicle.make} {assignment.vehicle.model}"
                    },
                    "trip_details": {
                        "pickup": assignment.request.pickup_location,
                        "destination": assignment.request.destination,
                        "purpose": assignment.request.purpose,
                        "passenger_count": assignment.request.passenger_count
                    }
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "error_code": "acceptance_failed",
                    "details": "Failed to accept the assignment. Please try again."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    

class DeclineAssignmentAPIView(APIView):
    """
    API endpoint for drivers to decline assignments.
    
    This endpoint allows drivers to:
    1. Decline a pending assignment
    2. Provide a mandatory reason for declining
    3. Create a declined trip record
    
    Permissions:
    - User must be authenticated
    - User must be a driver
    """
    permission_classes = [IsAuthenticated, IsDriver]

    @DECLINE_ASSIGNMENT_DOCS
    @transaction.atomic  
    def post(self, request, assignment_id):
        """Decline an assignment."""
        try:
            assignment = get_object_or_404(
                Vehicle_Assignment.objects.select_related('driver', 'vehicle', 'request'),
                pk=assignment_id,
                driver=request.user,
                driver_status=Vehicle_Assignment.DriverStatus.PENDING
            )
        except Vehicle_Assignment.DoesNotExist:
            return Response(
                {
                    "error": "No pending assignment found with this ID",
                    "error_code": "assignment_not_found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DeclineAssignmentSerializer(
            data=request.data,
            context={
                'assignment_id': assignment_id,
                'request': request
            }
        )
        
        if not serializer.is_valid():
            return Response(
                {
                    "errors": serializer.errors,
                    "error_code": "validation_error"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                # Update vehicle status back to available
                assignment.vehicle.status = Vehicle.Status.AVAILABLE
                assignment.vehicle.save()
                
                trip = serializer.save()
                
                return Response(
                    {
                        "status": "declined",
                        "assignment_id": assignment_id,
                        "trip_id": trip.trip_id,
                        "reason": assignment.decline_reason,
                        "timestamp": timezone.now().isoformat(),
                        "driver": request.user.get_full_name(),
                        "vehicle": {
                            "id": assignment.vehicle.id,
                            "license_plate": assignment.vehicle.license_plate,
                            "status": assignment.vehicle.get_status_display()
                        }
                    },
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "error_code": "decline_failed",
                    "details": "Failed to decline the assignment. Please try again."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

class CompleteAssignmentAPIView(APIView):
    """
    API endpoint for drivers to complete trips.
    
    This endpoint allows drivers to:
    1. Complete an ongoing trip
    2. Record the final mileage
    3. Update vehicle and assignment status
    
    Permissions:
    - User must be authenticated
    - User must be a driver
    """
    permission_classes = [IsAuthenticated, IsDriver]
    @COMPLETE_ASSIGNMENT_DOCS
    @transaction.atomic
    def patch(self, request, trip_id):
        """Complete a trip."""
        try:
            trip = get_object_or_404(
                Trips.objects.select_related(
                    'assignment',
                    'assignment__vehicle',
                    'assignment__request',
                    'assignment__request__requester'
                ),
                pk=trip_id,
                assignment__driver=request.user,
                status=Trips.TripStatus.STARTED 
            )
        except Trips.DoesNotExist:
            return Response(
                {
                    "error": "No active trip found with this ID",
                    "error_code": "trip_not_found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CompleteAssignmentSerializer(
            instance=trip,
            data=request.data,
            partial=True
        )
        
        if not serializer.is_valid():
            return Response(
                {
                    "errors": serializer.errors,
                    "error_code": "validation_error"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                trip = serializer.save()
                return Response({
                    "status": "completed",
                    "trip_id": trip.trip_id,
                    "assignment_id": trip.assignment.assignment_id,
                    "trip_details": {
                        "start_mileage": trip.start_mileage,
                        "end_mileage": trip.end_mileage,
                        "distance_km": trip.distance,
                        "duration_seconds": trip.duration.total_seconds() if trip.duration else None,
                        "start_time": trip.start_time,
                        "end_time": trip.end_time
                    },
                    "driver": request.user.get_full_name(),
                    "vehicle": {
                        "id": trip.assignment.vehicle.id,
                        "license_plate": trip.assignment.vehicle.license_plate,
                        "current_mileage": trip.assignment.vehicle.current_mileage,
                        "status": trip.assignment.vehicle.get_status_display()
                    },
                    "request": {
                        "id": trip.assignment.request.request_id,
                        "requester": trip.assignment.request.requester.get_full_name(),
                        "purpose": trip.assignment.request.purpose
                    }
                })
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "error_code": "completion_failed",
                    "details": "Failed to complete the trip. Please try again."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

class DriverCompletedTripsView(APIView):
    """
    API endpoint for drivers to view their completed trips.
    
    This endpoint allows drivers to:
    1. View all their completed trips
    2. Get trip statistics and details
    
    Permissions:
    - User must be authenticated
    - User must be a driver
    """
    permission_classes = [IsAuthenticated, IsDriver]
    
    def get(self, request):
        """Get all completed trips for the current driver."""
        try:
            completed_trips = Trips.objects.filter(
                assignment__driver=request.user,
                status=Trips.TripStatus.COMPLETED
            ).select_related(
                'assignment',
                'assignment__vehicle',
                'assignment__request',
                'assignment__request__requester',
                'assignment__request__requester__department'
            ).order_by('-end_time')
            
            trips_data = []
            for trip in completed_trips:
                trips_data.append({
                    "trip_id": trip.trip_id,
                    "assignment_id": trip.assignment.assignment_id,
                    "request_id": trip.assignment.request.request_id,
                    "vehicle": {
                        "id": trip.assignment.vehicle.id,
                        "license_plate": trip.assignment.vehicle.license_plate,
                        "make_model": f"{trip.assignment.vehicle.make} {trip.assignment.vehicle.model}"
                    },
                    "trip_details": {
                        "pickup": trip.assignment.request.pickup_location,
                        "destination": trip.assignment.request.destination,
                        "start_time": trip.start_time,
                        "end_time": trip.end_time,
                        "duration_seconds": trip.duration.total_seconds() if trip.duration else None,
                        "distance_km": trip.distance,
                        "start_mileage": trip.start_mileage,
                        "end_mileage": trip.end_mileage
                    },
                    "requester": {
                        "name": trip.assignment.request.requester.get_full_name(),
                        "department": trip.assignment.request.requester.department.name if trip.assignment.request.requester.department else None,
                        "phone": trip.assignment.request.requester.phone_number
                    },
                    "purpose": trip.assignment.request.purpose,
                    "passengers": trip.assignment.request.passenger_count,
                    "completed_at": trip.end_time
                })
                
            return Response(
                {
                    "count": len(trips_data),
                    "trips": trips_data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "error_code": "fetch_failed",
                    "details": "Failed to fetch completed trips. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminAssignmentHistoryAPIView(APIView):
    """
    Returns a list of all completed assignments (trips) for admin dashboard history table.
    Each row includes: assigned date, requester, vehicle, driver, approver, completed trip pickup, destination, and total km.
    Department is omitted as requested.
    """
    permission_classes = [IsAuthenticated]
    @admin_assignment_history_docs
    def get(self, request):
        # Only allow admin/superadmin
        if not (request.user.role in [User.Role.ADMIN, User.Role.SUPERADMIN]):
            return Response({'detail': 'Not authorized.'}, status=403)

        # Get all completed assignments (trips)
        completed_trips = Trips.objects.filter(
            status=Trips.TripStatus.COMPLETED
        ).select_related(
            'assignment',
            'assignment__vehicle',
            'assignment__driver',
            'assignment__assigned_by',
            'assignment__request',
            'assignment__request__requester',
            'assignment__request__department_approver',
        ).order_by('-end_time')

        data = []
        for trip in completed_trips:
            assignment = trip.assignment
            request_obj = assignment.request
            data.append({
                'assigned_date': assignment.assigned_at.date() if assignment.assigned_at else None,
                'requester': request_obj.requester.get_full_name() if request_obj.requester else None,
                'vehicle': f"{assignment.vehicle.make} {assignment.vehicle.model} - {assignment.vehicle.license_plate}" if assignment.vehicle else None,
                'driver': assignment.driver.get_full_name() if assignment.driver else None,
                'approver': request_obj.department_approver.get_full_name() if request_obj.department_approver else None,
                'pickup': request_obj.pickup_location,
                'destination': request_obj.destination,
                'total_km': float(trip.end_mileage - trip.start_mileage) if trip.end_mileage is not None and trip.start_mileage is not None else None,
            })
        return Response({'history': data})
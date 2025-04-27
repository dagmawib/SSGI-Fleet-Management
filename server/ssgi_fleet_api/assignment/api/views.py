from django.shortcuts import get_object_or_404
from .serializers import(
     AssignCarSerializer,
    GetRequestsForDriverSerializer ,
    RejectCarAssignmentSerializer ,
    AcceptAssignmentSerializer ,
    DeclineAssigmentSerializer
)
from rest_framework.views import APIView
from request.models import Vehicle_Request
from ..models import Vehicle_Assignment , Trips
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminOrSuperAdmin , IsDriver
from rest_framework.response import Response
from rest_framework import status
from vehicles.models import Vehicle
from users.models import User
from .docs import assign_car_docs ,reject_car_assignment_docs
from django.db import transaction
from django.utils import timezone


class AssignCarAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    @assign_car_docs
    def post(self, request):
        serializer = AssignCarSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get validated objects
            vehicle_request = Vehicle_Request.objects.get(pk=serializer.validated_data['request_id'])
            vehicle = Vehicle.objects.get(pk=serializer.validated_data['vehicle_id'])
            driver = User.objects.get(pk=serializer.validated_data['driver_id'])
            
            # Create the assignment
            assignment = Vehicle_Assignment.objects.create(
                request=vehicle_request,
                vehicle=vehicle,
                driver=driver,
                assigned_by=request.user,
                note=serializer.validated_data.get('note', '')
            )
            
            # Update request status
            vehicle_request.status = Vehicle_Request.Status.ASSIGNED
            vehicle_request.save()
            
            # Update vehicle status and assigned driver
            vehicle.status = Vehicle.Status.IN_USE
            vehicle.assigned_driver = driver
            vehicle.save()
            
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
                    "assignment_status": "Pending driver acceptance",
                    "note": assignment.note
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
class CarRejectAPIView(APIView):
    permission_classes = [IsAuthenticated , IsAdminOrSuperAdmin]
    @reject_car_assignment_docs
    def post(self, request):
        serializer = RejectCarAssignmentSerializer(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)
        
        try:
            vheicle_request = Vehicle_Request.objects.get(
                id = serializer.validated_data['request_id']
            )

            vheicle_request.status = vheicle_request.Status.REJECTED
            vheicle_request.save()
            

            return Response({
                "request_id": vheicle_request.id,
                "note": serializer.validated_data.get('note', '')
            }, status=status.HTTP_200_OK)


        except Vehicle_Request.DoesNotExist:
            raise('the resource does not eist.')
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
class DriverAcceptView(APIView):
    permission_classes = [IsAuthenticated , IsDriver]
    def post(self, request):
        pass


class DriverRejectView(APIView):
    permission_classes = [IsAuthenticated , IsDriver]
    def post(self, request):
        pass


class DriverRequestView(APIView):
    permission_classes = [IsAuthenticated , IsDriver]

    def get(self, request):
        driver = request.user 

        assignment = Vehicle_Assignment.objects.filter(driver=driver).first()
        
        if not assignment:
            return Response({"detail": "No assignment found."}, status=status.HTTP_404_NOT_FOUND)

        vc_request = assignment.request
        if vc_request.status != Vehicle_Request.Status.ASSIGNED:
            return Response({"detail": "No active assigned request found."}, status=status.HTTP_404_NOT_FOUND)

        requester = vc_request.requester

        return Response({
            "pickup": vc_request.pickup_location,
            "destination": vc_request.destination,
            "requester": requester.get_full_name(),
            "department": requester.department.name,
            "phone": requester.phone_number,
            "passenger": vc_request.passenger_count
        }, status=status.HTTP_200_OK)

class AcceptAssignmentAPIView(APIView):
    permission_classes = [IsAuthenticated , IsDriver]
    def post(self, request, assignment_id):
        """POST /api/assignments/<id>/accept/"""
        try:
            assignment = Vehicle_Assignment.objects.select_related('vehicle').get(
                pk=assignment_id,
                driver=request.user  # Ensure requester is the driver
            )
        except Vehicle_Assignment.DoesNotExist:
            return Response({"error": "Invalid assignment"}, status=404)

        if assignment.driver_status != Vehicle_Assignment.DriverStatus.PENDING:
            return Response({"error": "Assignment already processed"}, status=400)

        serializer = AcceptAssignmentSerializer(
            data=request.data,
            context={'assignment_id': assignment_id} 
        )
        serializer.is_valid(raise_exception=True)
        trip = serializer.save()

        return Response({
            "status": "accepted",
            "trip_id": trip.trip_id,
            "start_mileage": trip.start_mileage
        }, status=201)
    

class DeclineAssignmentAPIView(APIView):
    permission_classes = [IsAuthenticated , IsDriver]
    @transaction.atomic  
    def post(self, request, assignment_id):   
        assignment = get_object_or_404(
            Vehicle_Assignment.objects.select_related('driver'),
            pk=assignment_id,
            driver_status=Vehicle_Assignment.DriverStatus.PENDING
        )

        serializer = DeclineAssigmentSerializer(
            data=request.data,
            context={
                'assignment_id': assignment_id,
                'request': request
            }
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "status": "Declined",
                "assignment_id": assignment_id,
                "reason": assignment.decline_reason,
                "timestamp": timezone.now().isoformat()
            },
            status=status.HTTP_200_OK
        )

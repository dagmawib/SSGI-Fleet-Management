from .serializers import AssignCarSerializer
from rest_framework.views import APIView
from request.models import Vehicle_Request
from ..models import Vehicle_Assignment
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminOrSuperAdmin
from rest_framework.response import Response
from rest_framework import status
from vehicles.models import Vehicle
from users.models import User
from .docs import assign_car_docs


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
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from request.models import Vehicle_Request
from users.models import User, Department
from .serializers import RequestSerializer, RequestListSerializer, RequestRejectSerializer, EmployeeRequestStatusSerializer, UserMatchSerializer, DepartmentListSerializer
from users.api.permissions import IsRegularAdmin, IsSuperAdmin
from rest_framework.permissions import OR
from django.utils import timezone
from .permissions import IsEmployee, IsDirector, IsEmployeeOrDirector
from .docs import (
    request_create_docs,
    pending_requests_docs,
    cancel_request_docs,
    reject_request_docs,
    request_status_docs,
    admin_requests_docs,
    approve_request_docs,
    user_request_history_docs,
)
from django.db.models import Prefetch


class RequestCreateAPIView(APIView):
    """
    Creates vehicle requests with auto-approval for directors
    """
    permission_classes = [IsAuthenticated, IsEmployeeOrDirector]
    
    @request_create_docs
    def post(self, request):
        serializer = RequestSerializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

       
        is_director = hasattr(request.user, 'role') and request.user.role == User.Role.DIRECTOR
        print(f"User role: {getattr(request.user, 'role', 'NONE')}")
        print(f"Is director: {is_director}")
        print(f"Status to set: {'APPROVED' if is_director else 'PENDING'}")
        requester = User.objects.get(
            pk =request.user.id
        )
        print(f'requester : {requester}')
        
        vehicle_request = serializer.save(
            requester=request.user,
            status=Vehicle_Request.Status.APPROVED if is_director else Vehicle_Request.Status.PENDING,
            department_approver=request.user if is_director else None,
            department_approval=is_director
        )
        passenger_count = serializer.validated_data.get('passenger_count', 0)
        passenger_names = serializer.validated_data.get('passenger_names', [])

        return Response(
            {
                "id": vehicle_request.request_id,
                "status": vehicle_request.status,
                "requester_dept" : requester.department.name,
                "passenger_count": passenger_count,
                "passenger_names": passenger_names,
                "auto_approved": is_director,
                "approver": request.user.get_full_name() if is_director else None
            },
            status=status.HTTP_201_CREATED
        )

class PendingRequestsAPI(APIView):
    """
    Retrieves pending requests only from:
    - Departments where the current user is director
    - Only shows PENDING status requests
    """
    permission_classes = [IsAuthenticated, IsDirector]
    
    @pending_requests_docs
    def get(self, request):
        # Get departments where current user is director
        directed_depts = Department.objects.filter(director=request.user)
        
        if not directed_depts.exists():
            return Response(
                {"detail": "You are not assigned as director of any department"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get pending requests from these departments
        requests = Vehicle_Request.objects.filter(
            status=Vehicle_Request.Status.PENDING,
            requester__department__in=directed_depts
        ).select_related('requester', 'requester__department')
        
        # Prepare response data
        data = []
        for req in requests:
            data.append({
                "request_id": req.request_id,
                "status": req.status,
                "requester": {
                    "email": req.requester.email,
                    "full_name": req.requester.get_full_name(),
                    "department": req.requester.department.name if req.requester.department else None
                },
                "pickup_location": req.pickup_location,
                "destination": req.destination,
                "start_dateTime" : req.start_dateTime,
                "end_dateTiem" : req.end_dateTime,
                "purpose": req.purpose,
                "passenger_count": req.passenger_count,
                "created_at": req.created_at,
                "urgency": req.urgency
            })
        
        return Response({
            "count": len(data),
            "department": [dept.name for dept in directed_depts],
            "requests": data
        })
    
class RequestApproveAPI(APIView):
    """
    Approves the request if:
    1. User is a director
    2. Request is pending
    3. Director is the assigned director of the requester's department
    """
    permission_classes = [IsAuthenticated, IsDirector]

    @approve_request_docs
    def patch(self, request, request_id):
        req = get_object_or_404(Vehicle_Request, pk=request_id)

        if req.status != Vehicle_Request.Status.PENDING:
            return Response(
                {"error": "Only pending requests can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get requester's department
        requester_dept = req.requester.department
        print(f'requester : {requester_dept}')
        print(f'requester_id : {requester_dept.id}')


        # Get the department where the request.user is the director
        try:
            director_dept = Department.objects.get(director=request.user)

        except Department.DoesNotExist:
            return Response(
                {"error": "You are not assigned as a director for any department"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Ensure requester has a department
        if not requester_dept:
            return Response(
                {"error": "Requester is not assigned to any department"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Ensure the director is the one who can approve requests from the same department
        if requester_dept.id != director_dept.id:
            return Response(
                {"error": "You can only approve requests from your own department"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Approve the request
        req.department_approval = True
        req.department_approver = request.user
        req.status = Vehicle_Request.Status.APPROVED
        req.department_approval_time = timezone.now()
        req.save()

        # Prepare response data
        response_data = {
            "id": req.request_id,
            "new_status": req.status,
            "approved_at": req.department_approval_time.isoformat(),
            "requester": {
                "id": req.requester.id,
                "name": req.requester.get_full_name(),
                "department": requester_dept.name
            },
            "approved_by": {
                "id": request.user.id,
                "name": request.user.get_full_name(),
                "department": director_dept.name
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)


class RequestRejectAPI(APIView):
    """
    API for rejecting requests by director
    - Only requests from director's department(s) can be rejected
    - Only pending requests can be rejected
    - Requires rejection reason
    """
    permission_classes = [IsAuthenticated, IsDirector]
    
    @reject_request_docs
    def patch(self, request, request_id):
        req = get_object_or_404(Vehicle_Request, pk=request_id)
        
        # Check if request is pending
        if req.status != Vehicle_Request.Status.PENDING:
            return Response(
                {"error": "Only pending requests can be rejected"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if director can reject this request (same department)
        if not req.requester.department or req.requester.department.director != request.user:
            return Response(
                {
                    "error": "You can only reject requests from your department",
                    "your_department": request.user.department.name if request.user.department else None,
                    "requester_department": req.requester.department.name if req.requester.department else None
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate rejection reason
        serializer = RequestRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update the request
        req.status = Vehicle_Request.Status.REJECTED
        req.department_approval = False
        req.department_approver = request.user  # Using consistent field name
        req.rejection_reason = serializer.validated_data['reason']
        req.rejected_at = timezone.now()
        req.save()
        
        return Response(
            {
                "id": req.request_id,
                "new_status": req.status,
                "rejected_by": request.user.get_full_name(),
                "rejection_reason": req.rejection_reason,
                "rejected_at": req.rejected_at,
                "department": req.requester.department.name if req.requester.department else None
            },
            status=status.HTTP_200_OK
        )


class RequestCancelAPI(APIView):
    permission_classes = [IsAuthenticated , IsEmployee]
    @cancel_request_docs
    def post(self, request, request_id):
        """Allows requester to cancel pending requests"""
        req = get_object_or_404(Vehicle_Request, pk=request_id)
        
        if req.requester != request.user:
            return Response(
                {"error": "You can only cancel your own requests"},
                status=403
            )
        
        if req.status != 'Pending':
            return Response(
                {"error": "Only pending requests can be cancelled"},
                status=400
            )
        
        req.status = req.Status.CANCELLED
        req.cancellation_reason  = request.data['cancel_reason']
        req.save()
        
        return Response(
            {"id": req.request_id, "new_status": "Cancelled"}
        )
    
class RequestsListAPIView(APIView):
    permission_classes = [IsAuthenticated , IsRegularAdmin]
    def get(self, request):
        queryset = Vehicle_Request.objects.filter(department_approver__isnull=False,department_approval=True)
        serializer = RequestListSerializer(queryset, many=True)
        return Response(serializer.data)
    
class EmployeeRequestStatusView(APIView):
    permission_classes = [IsAuthenticated, IsEmployee]
    @request_status_docs
    def get(self, request):
        # Get only the current employee's requests, ordered newest first
        requests = Vehicle_Request.objects.filter(
            requester=request.user
        ).order_by('-created_at')
        
        serializer = EmployeeRequestStatusSerializer(requests, many=True)
        return Response(serializer.data)
    

class DepartmentListWithDirectorsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        # Get all departments with related directors
        departments = Department.objects.all().prefetch_related(
            Prefetch(
                'director',
                queryset=User.objects.filter(role=User.Role.DIRECTOR),
                to_attr='directors'
            )
        )
        # Serialize the data
        serializer = DepartmentListSerializer(departments, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserRequestHistoryAPIView(APIView):
    """
    Returns the request history for a user (current user if user_id is not provided).
    See user_request_history_docs in docs.py for full documentation.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id=None):
        """
        Returns the request history for a user (current user if user_id is not provided).
        See user_request_history_docs in docs.py for full documentation.
        """
        # Only allow access to own history or if admin/superuser
        if user_id is None:
            user = request.user
        else:
            if not (request.user.is_superuser or request.user.id == int(user_id)):
                return Response({'detail': 'Not authorized.'}, status=403)
            user = get_object_or_404(User, pk=user_id)

        requests = Vehicle_Request.objects.filter(requester=user).order_by('-created_at')
        total_requests = requests.count()
        accepted_requests = requests.filter(status=Vehicle_Request.Status.ASSIGNED).count()
        declined_requests = requests.filter(status=Vehicle_Request.Status.REJECTED).count()

        request_list = []
        for req in requests:
            vehicle = None
            driver = None
            reason = req.purpose
            # If assigned, get assignment details
            if req.status == Vehicle_Request.Status.ASSIGNED:
                assignment = req.assignments.first()  # related_name='assignments'
                if assignment:
                    vehicle = f"{assignment.vehicle.make} {assignment.vehicle.model} - {assignment.vehicle.license_plate}" if assignment.vehicle else None
                    driver = assignment.driver.get_full_name() if assignment.driver else None
                    reason = assignment.note or req.purpose
            elif req.status == Vehicle_Request.Status.REJECTED:
                reason = req.rejection_reason or req.purpose

            request_list.append({
                "request_id": req.request_id,
                "date": req.created_at.strftime('%d %b, %Y'),
                "requester": req.requester.get_full_name(),
                "approver": req.department_approver.get_full_name() if req.department_approver else None,
                "vehicle": vehicle,
                "driver": driver,
                "pickup": req.pickup_location,
                "destination": req.destination,
                "reason": reason,
                "status": req.status,
            })

        return Response({
            "total_requests": total_requests,
            "accepted_requests": accepted_requests,
            "declined_requests": declined_requests,
            "requests": request_list
        })

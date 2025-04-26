from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import Vehicle_Request
from .serializers import RequestSerializer , RequestListSerializer , RequestRejectSerializer ,EmployeeRequestStatusSerializer ,UserMatchSerializer
from users.api.permissions import IsRegularAdmin
from rest_framework.permissions import OR
from users.models import User , Department
from django.utils import timezone


from .permissions import IsEmployee , IsDirector ,IsEmployeeOrDirector
from .docs import (
    request_create_docs,
    pending_requests_docs,
    cancel_request_docs,
    reject_request_docs,
    request_status_docs,
    admin_requests_docs,
    approve_request_docs
)


class RequestCreateAPIView(APIView):
    """
    Creates vehicle requests with auto-approval for directors
    """
    permission_classes = [IsAuthenticated, IsEmployeeOrDirector]
    
    @request_create_docs
    def post(self, request):
        serializer = RequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        passenger_count = serializer.validated_data.get('passenger_count', 0)
        passenger_names = serializer.validated_data.get('passenger_names', [])
        
        if passenger_names and len(passenger_names) != passenger_count:
            return Response(
                {"error": "Passenger names count must match passenger_count"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_director = hasattr(request.user, 'role') and request.user.role == User.Role.DIRECTOR
        
        vehicle_request = serializer.save(
            requester=request.user,
            status=Vehicle_Request.Status.APPROVED if is_director else Vehicle_Request.Status.PENDING,
            department_approver=request.user if is_director else None,
            department_approval=is_director
        )

        return Response(
            {
                "id": vehicle_request.request_id,
                "status": vehicle_request.status,
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
        
        # Check if request is pending
        if req.status != Vehicle_Request.Status.PENDING:
            return Response(
                {"error": "Only pending requests can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize both users for department comparison
        requester = UserMatchSerializer(req.requester).data
        director = UserMatchSerializer(request.user).data
        
        # Get department info
        requester_dept = requester.get('department')
        director_dept = director.get('department')
        
        # Check if requester has a department
        if not requester_dept:
            return Response(
                {"error": "Requester is not assigned to any department"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if director is actually the director of requester's department
        is_valid_director = (
            requester_dept and 
            requester_dept.get('director') == request.user.id
        )
        
        if not is_valid_director:
            return Response(
                {
                    "error": "You can only approve requests from departments you direct",
                    "requester_department": requester_dept.get('name') if requester_dept else None,
                    "your_departments": [d['name'] for d in request.user.directed_departments.values('name')]
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Approve the request
        req.department_approval = True
        req.department_approver = request.user
        req.status = Vehicle_Request.Status.APPROVED
        req.department_approval_time = timezone.now()
        req.save()
        
        # Prepare response
        response_data = {
            "id": req.request_id,
            "new_status": req.status,
            "approved_at": req.department_approval_time.isoformat(),
            "requester": {
                "id": req.requester.id,
                "name": req.requester.get_full_name(),
                "department": requester_dept.get('name')
            },
            "approved_by": {
                "id": request.user.id,
                "name": request.user.get_full_name(),
                "department": director_dept.get('name') if director_dept else None
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
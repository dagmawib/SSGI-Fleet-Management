from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import Vehicle_Request
from .serializers import RequestSerializer , RequestListSerializer
from users.api.permissions import IsRegularAdmin

from .permissions import IsEmployee , IsDirector 
from .docs import (
    request_create_docs,
    pending_requests_docs,
    approve_request_docs,
    cancel_request_docs,
    reject_request_docs
)


class RequestCreateAPIView(APIView):
    "it creates request when employee requestes for cars"
    permission_classes = [IsAuthenticated , IsEmployee]
    @request_create_docs
    def post(self, request):

        serializer = RequestSerializer(data=request.data , context ={'request' : request})
        serializer.is_valid(raise_exception=True)
        
        # Validate passenger count matches names
        passenger_count = serializer.validated_data.get('passenger_count', 0)
        passenger_names = serializer.validated_data.get('passenger_names', [])
        
        if passenger_names and len(passenger_names) != passenger_count:
            return Response(
                {"error": "Passenger names count must match passenger_count"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request = serializer.save(
            requester=request.user,
            status='Pending'
        )

        return Response(
            {
                "id": request.request_id,
                "status": "Pending",
                "passenger_count": passenger_count,
                "passenger_names": passenger_names
            },
            status=201
        )

class PendingRequestsAPI(APIView):
    """
        Retrives the pending requests for the director to approve 
    """
    permission_classes = [IsAuthenticated , IsDirector]
    @pending_requests_docs
    def get(self, request):
        requests = Vehicle_Request.objects.filter(
            status='Pending'
        ).select_related('requester')
        data = [{
            "id": r.request_id,
            "status" : r.status,
            "requester": r.requester.email,
            "pickup": r.pickup_location,
            "destination": r.destination,
            "duration": r.duration
        } for r in requests]
        
        return Response(data)
    
class RequestApproveAPI(APIView):
    """
        Aprroves the request if only director is there
    """
    permission_classes = [IsAuthenticated , IsDirector]
    @approve_request_docs
    def patch(self, request, request_id):
        
        req = get_object_or_404(Vehicle_Request, pk=request_id)
        
        if req.status != 'Pending':
            return Response(
                {"error": "Only pending requests can be approved"},
                status=400
            )

        req.department_approval = True
        req.department_approver = request.user
        req.save()
        
        return Response(
            {"id": req.request_id, "new_status": "Approved"}
        )

class RequestRejectAPI(APIView):
    permission_classes = [IsAuthenticated , IsDirector]
    @reject_request_docs
    def patch(self, request, request_id):
        
        req = get_object_or_404(Vehicle_Request, pk=request_id)
        
        if req.status != 'Pending':
            return Response(
                {"error": "Only pending requests can be approved"},
                status=400
            )

        req.department_approval = False
        req.approved_by = request.user
        req.save()
        
        return Response(
            {"id": req.request_id, "new_status": "Rejected"}
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
    permission_classes = [IsAuthenticated , IsRegularAdmin ]
    def get(self, request):
        queryset = Vehicle_Request.objects.all()
        serializer = RequestListSerializer(queryset, many=True)
        return Response(serializer.data)
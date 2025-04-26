# Django imports
from django.shortcuts import get_object_or_404
from django.utils import timezone

# DRF imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated

# Documentation imports
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
    OpenApiParameter,
    OpenApiTypes
)

# App model imports
from ..models import Vehicle_Assignment
from vehicles.models import Vehicle
from request.models import Vehicle_Request 
from users.models import User

# Permission imports
from .permissions import IsAdminOrSuperAdmin

# Local serializer imports
from .serializers import AssignCarSerializer

# Documentation constants (typically in docs.py)
COMMON_RESPONSES = {
    400: OpenApiResponse(description="Bad Request - Invalid input"),
    401: OpenApiResponse(description="Unauthorized - Missing credentials"),
    403: OpenApiResponse(description="Forbidden - Insufficient permissions"),
    404: OpenApiResponse(description="Not Found - Resource doesn't exist")
}
assign_car_docs = extend_schema(
    tags=["Assignment Endpoints"],
    summary="Assign Vehicle to Approved Request",
    description="""
**Admin/Superadmin-only endpoint**  
Assigns a specific vehicle and driver to an approved request.
""",
    request=AssignCarSerializer,  # 🛠️ Note: use the Serializer class here, not OpenApiExample
    responses={
        201: OpenApiResponse(
            response=AssignCarSerializer,
            description="Vehicle successfully assigned",
            examples=[
                OpenApiExample(
                    name="Success Example",
                    value={
                        "assignment_id": 21,
                        "request_id": 11,
                        "vehicle": {
                            "id": 1,
                            "license_plate": "ABC-1234",
                            "make_model": "Toyota Land Cruiser",
                            "status": "In Use"
                        },
                        "driver": {
                            "id": 40,
                            "name": "Ahmed Ali",
                            "phone": "+251911000000"
                        },
                        "requester": {
                            "name": "Hanna Mekonnen",
                            "department": "VIP Services"
                        },
                        "trip_details": {
                            "pickup": "Addis Ababa Airport",
                            "destination": "Sheraton Hotel",
                            "start_time": "2025-04-27T10:00:00Z",
                            "end_time": "2025-04-27T12:00:00Z",
                            "purpose": "Client Pickup",
                            "passengers": 1
                        },
                        "assigned_by": "Admin User",
                        "assigned_at": "2025-04-26T13:00:00Z",
                        "assignment_status": "Pending driver acceptance",
                        "note": "VIP client - handle with care"
                    }
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    examples=[
        OpenApiExample(
            name="Assignment Request Example",
            value={
                "request_id": 11,
                "vehicle_id": 1,
                "driver_id": 40,
                "note": "VIP client - handle with care"
            },
            request_only=True  # 🔥 Means: This example appears for REQUEST only
        )
    ]
)

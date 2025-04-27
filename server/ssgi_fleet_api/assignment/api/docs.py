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
from .serializers import AcceptAssignmentSerializer, AssignCarSerializer \
,DeclineAssigmentSerializer , CompleteAssignmentSerializer

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



from .serializers import RejectCarAssignmentSerializer

reject_car_assignment_docs = extend_schema(
    tags=["Assignment Endpoints"],
    summary="Reject a Vehicle Request",
    description="""
**Admin/Superadmin-only endpoint**

This endpoint allows an Admin or Superadmin to reject a vehicle request that was previously approved.  
The admin must provide a rejection note explaining the reason.

Once rejected, the request cannot be assigned a vehicle unless it is re-approved.
""",
    request=RejectCarAssignmentSerializer,   # 👈 correct way!
    responses={
        200: OpenApiResponse(
            description="Vehicle request successfully rejected by Admin",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "request_id": 11,
                        "note": "Admin rejected due to scheduling conflict"
                    }
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    examples=[
        OpenApiExample(
            name="Admin Reject Request Example",
            value={
                "request_id": 11,
                "note": "Admin rejected due to scheduling conflict"
            },
            request_only=True
        )
    ]
)

DRIVER_REQUEST_GET_DOCS = extend_schema(
    tags=["Driver Endpoints"],
    summary="Get Current Driver Assignment",
    description="""
**Driver-only endpoint**  
Returns complete details of the driver's currently active assignment including:
- Pickup/destination information
- Requester contact details
- Trip specifications
    
**Requirements:**
- Authenticated driver account
- Active assigned request in 'ASSIGNED' status
""",
    responses={
        200: OpenApiResponse(
            description="Active assignment details",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "pickup": "Building A, 123 Main St",
                        "destination": "Airport Terminal 2",
                        "requester": "John Doe",
                        "department": "Operations",
                        "phone": "+1234567890", 
                        "passenger": 3
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Invalid/missing token"),
        403: OpenApiResponse(description="Forbidden - User is not a driver"),
        404: OpenApiResponse(
            description="Not Found",
            examples=[
                OpenApiExample(
                    "No Assignment",
                    value={"detail": "No active assigned request found."}
                )
            ]
        ),
    },
    parameters=[
        OpenApiParameter(
            name="Authorization",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.HEADER,
            description="Bearer token",
            required=True
        )
    ]
)

ACCEPT_ASSIGNMENT_DOCS = extend_schema(
    tags=["Driver Endpoints"],
    summary="Accept Vehicle Assignment",
    description="""
**Driver-only endpoint**  
Allows drivers to accept a pending vehicle assignment by recording:
- Starting mileage (must ≥ vehicle's current mileage)
- Timestamp of acceptance

**Flow:**
1. Updates vehicle's current mileage
2. Marks assignment as ACCEPTED
3. Creates a new TRIP record with STARTED status
""",
    request=AcceptAssignmentSerializer,
    responses={
        201: OpenApiResponse(
            description="Assignment successfully accepted",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "status": "accepted",
                        "trip_id": 42,
                        "start_mileage": 1500.5
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Bad Request",
            examples=[
                OpenApiExample(
                    "Already Processed",
                    value={"error": "Assignment already processed"}
                ),
                OpenApiExample(
                    "Invalid Mileage",
                    value={"error": "Mileage must be ≥ vehicle's current mileage (1500 km)"}
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Invalid/missing token"),
        403: OpenApiResponse(description="Forbidden - User is not the assigned driver"),
        404: OpenApiResponse(
            description="Not Found",
            examples=[
                OpenApiExample(
                    "Invalid Assignment",
                    value={"error": "Invalid assignment"}
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Acceptance Request Example",
            value={"start_mileage": 1500.5},
            request_only=True
        )
    ],
    parameters=[
        OpenApiParameter(
            name="assignment_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID of the assignment to accept"
        ),
        OpenApiParameter(
            name="Authorization",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.HEADER,
            description="Bearer token",
            required=True
        )
    ]
)

# In your docs.py
DECLINE_ASSIGNMENT_DOCS = extend_schema(
    tags=["Driver Endpoints"],
    summary="Decline Vehicle Assignment",
    description="""
**Driver-only endpoint**  
Allows drivers to decline a pending vehicle assignment by providing:
- Mandatory rejection reason
- Automatic timestamp recording

**System Actions:**
1. Updates assignment status to DECLINED
2. Records rejection reason and timestamp
3. Creates a DECLINED trip record for audit purposes
""",
    request=DeclineAssigmentSerializer,
    responses={
        200: OpenApiResponse(
            description="Assignment successfully declined",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "status": "Declined",
                        "assignment_id": 42,
                        "reason": "Vehicle maintenance required",
                        "timestamp": "2023-09-20T14:30:00Z"
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Bad Request",
            examples=[
                OpenApiExample(
                    "Missing Reason",
                    value={"rejection_reason": ["This field is required."]}
                ),
                OpenApiExample(
                    "Already Processed",
                    value={"error": "Assignment already processed"}
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Invalid/missing token"),
        403: OpenApiResponse(
            description="Forbidden",
            examples=[
                OpenApiExample(
                    "Wrong Driver",
                    value={"error": "Only the assigned driver can decline this assignment"}
                )
            ]
        ),
        404: OpenApiResponse(
            description="Not Found",
            examples=[
                OpenApiExample(
                    "Invalid Assignment",
                    value={"error": "No pending assignment found with this ID"}
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Decline Request Example",
            value={"rejection_reason": "Vehicle maintenance required"},
            request_only=True
        )
    ],
    parameters=[
        OpenApiParameter(
            name="assignment_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID of the assignment to decline"
        ),
        OpenApiParameter(
            name="Authorization",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.HEADER,
            description="Bearer token",
            required=True
        )
    ]
)
# In your docs.py
COMPLETE_ASSIGNMENT_DOCS = extend_schema(
    tags=["Driver Endpoints"],
    summary="Complete Vehicle Assignment",
    description="""
**Driver-only endpoint**  
Marks a started trip as completed by recording:
- Final vehicle mileage (must ≥ trip's start mileage)
- Automatic completion timestamp

**System Actions:**
1. Updates vehicle's current mileage
2. Marks assignment as COMPLETED
3. Updates trip status and records end mileage
4. Calculates total distance traveled
""",
    request=CompleteAssignmentSerializer,
    responses={
        200: OpenApiResponse(
            description="Trip successfully completed",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "status": "completed",
                        "trip_id": 42,
                        "distance_km": 120.5
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Bad Request",
            examples=[
                OpenApiExample(
                    "Invalid Mileage",
                    value={"error": "Mileage must be ≥ trip's start mileage (1500 km)"}
                ),
                OpenApiExample(
                    "Wrong Status",
                    value={"error": "Cannot complete a trip that hasn't started"}
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Invalid/missing token"),
        403: OpenApiResponse(
            description="Forbidden",
            examples=[
                OpenApiExample(
                    "Wrong Driver",
                    value={"error": "Only the assigned driver can complete this trip"}
                )
            ]
        ),
        404: OpenApiResponse(
            description="Not Found",
            examples=[
                OpenApiExample(
                    "Invalid Trip",
                    value={"error": "No started trip found with this ID"}
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Completion Request Example",
            value={"end_mileage": 1620.5},
            request_only=True
        )
    ],
    parameters=[
        OpenApiParameter(
            name="trip_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID of the trip to complete"
        ),
        OpenApiParameter(
            name="Authorization",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.HEADER,
            description="Bearer token",
            required=True
        )
    ]
)
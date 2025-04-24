# api/docs.py
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
    OpenApiParameter,
    OpenApiTypes
)
from .serializers import (
    RequestSerializer,
    RequesterViewSerializer
)

# Common responses
COMMON_RESPONSES = {
    400: OpenApiResponse(description="Bad Request - Invalid input"),
    401: OpenApiResponse(description="Unauthorized - Missing credentials"),
    403: OpenApiResponse(description="Forbidden - Insufficient permissions"),
    404: OpenApiResponse(description="Not Found - Resource doesn't exist")
}

# Request Create Documentation
request_create_docs = extend_schema(
    tags=["Requester Endpoints"],
    summary="Create Vehicle Request",
    description="""**Employee-only endpoint**  
    Submit a new vehicle request.  
    **Status automatically set to Pending**  
    **Auto-expires after 24h if not approved**""",
    request=RequestSerializer,
    responses={
        201: OpenApiResponse(
            response=RequestSerializer,
            description="Request created successfully",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "status": "Pending"
                    }
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    examples=[
        OpenApiExample(
            "Example Request with Passengers",
            value={
                "pickup_location": "HQ",
                "destination": "Airport",
                "start_time": "2023-06-20T09:00:00Z",
                "end_time": "2023-06-20T11:00:00Z",
                "purpose": "VIP Transport",
                "passenger_count": 2,
                "passenger_names": ["John Doe", "Jane Smith"],
                "urgency": "Priority"
            }
        )
    ]
)

# Pending Requests Documentation
pending_requests_docs = extend_schema(
    tags=["Director Endpoints"],
    summary="List Pending Requests",
    description="""**Director-only endpoint**  
    Returns all requests awaiting approval.  
    **Auto-rejects requests older than 24h**""",
    responses={
        200: OpenApiResponse(
            description="List of pending requests",
            examples=[
                OpenApiExample(
                    "Example Response",
                    value=[{
                        "id": 1,
                        "requester": "employee@company.com",
                        "pickup": "Headquarters",
                        "destination": "Client Site",
                        "start_time": "2023-06-20T09:00:00Z"
                    }]
                )
            ]
        ),
        **COMMON_RESPONSES
    }
)

# Approval Documentation
approve_request_docs = extend_schema(
    tags=["Director Endpoints"],
    summary="Approve Request",
    description="""**Director-only endpoint**  
    Approves a pending vehicle request.  
    **Changes status to Approved**  
    **Records approving director**""",
    responses={
        200: OpenApiResponse(
            description="Request approved",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "new_status": "Approved"
                    }
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    parameters=[
        OpenApiParameter(
            name="request_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID of the request to approve"
        )
    ]
)
# Reject Request Documentation
reject_request_docs = extend_schema(
    tags=["Director Endpoints"],
    summary="Reject Request",
    description="""**Director-only endpoint**  
    Rejects a pending vehicle request.  
    **Changes status to Rejected**  
    **Records rejecting director**""",
    responses={
        200: OpenApiResponse(
            description="Request rejected successfully",
            examples=[
                OpenApiExample(
                    "Success Response",
                    summary="Successful rejection",
                    value={
                        "id": 42,
                        "new_status": "Rejected"
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Request not in Pending status",
            examples=[
                OpenApiExample(
                    "Already Approved or Rejected",
                    summary="Validation error",
                    value={"error": "Only pending requests can be approved"}
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    parameters=[
        OpenApiParameter(
            name="request_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID of the request to reject"
        )
    ]
)


# Cancellation Documentation
cancel_request_docs = extend_schema(
    tags=["Requester Endpoints"],
    summary="Cancel Request",
    description="""**Employee-only endpoint**  
    Cancels a pending request.  
    **Requires ownership verification**  
    **Must provide cancellation reason**""",
    responses={
        200: OpenApiResponse(
            description="Request cancelled",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "new_status": "Cancelled"
                    }
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    parameters=[
        OpenApiParameter(
            name="request_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="ID of the request to cancel"
        )
    ],
    request={
        "application/json": {
            "example": {
                "cancel_reason": "Meeting was postponed"
            }
        }
    }
)

# Request Status Transitions (For Schema)
STATUS_TRANSITIONS = OpenApiExample(
    "Status Flow",
    description="""
    Pending → Approved (by Director)
    Pending → Cancelled (by Requester)
    Pending → Rejected (by Director)
    Approved → Assigned (by Admin)
    """,
    value=None
)
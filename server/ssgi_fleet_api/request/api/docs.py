from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
    OpenApiParameter,
    OpenApiTypes
)
from .serializers import (
    RequestSerializer,
    RequestRejectSerializer,
    EmployeeRequestStatusSerializer,
    RequestListSerializer
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
    description="""**Endpoint for Employees and Directors**  
    Submit a new vehicle request.  
    
    **Status Behavior:**  
    - Employees: Automatically set to *Pending*  
    - Directors: Automatically *Approved* (self-approved)  
    
    **Department Validation:**  
    - Directors can only approve requests from their department  
    
    **Special Director Privileges:**  
    - Requests are immediately approved  
    - Director becomes the approver automatically""",
    request=RequestSerializer,
    responses={
        201: OpenApiResponse(
            response=RequestSerializer,
            description="Request created successfully",
            examples=[
                OpenApiExample(
                    "Employee Response",
                    value={
                        "id": 1,
                        "status": "Pending",
                        "message": "Pending approval",
                        "passenger_count": 2,
                        "passenger_names": ["John Doe", "Jane Smith"]
                    }
                ),
                OpenApiExample(
                    "Director Response",
                    value={
                        "id": 2,
                        "status": "Approved",
                        "auto_approved": True,
                        "approver": "Dr. Smith (Director)",
                        "passenger_count": 1,
                        "passenger_names": ["VIP Client"],
                        "message": "Auto-approved by director"
                    }
                )
            ]
        ),
        **COMMON_RESPONSES
    },
    examples=[
        OpenApiExample(
            "Employee Request Example",
            value={
                "pickup_location": "HQ",
                "destination": "Client Office",
                "start_dateTime": "2025-06-20T09:00:00Z",
                "end_dateTime": "2025-06-20T11:00:00Z",
                "passenger_count": 3,
                "purpose": "Team meeting transport",
                "urgency": "Regular"
            }
        ),
        OpenApiExample(
            "Director Request Example",
            value={
                "pickup_location": "HQ",
                "destination": "Airport",
                "start_dateTime": "2025-06-20T14:00:00Z",
                "end_dateTime": "2025-06-20T16:00:00Z",
                "passenger_count": 2,
                "purpose": "VIP Transport",
                "urgency": "Priority"
            },
            description="Note: Director requests skip approval queue"
        )
    ]
)

# Pending Requests Documentation
pending_requests_docs = extend_schema(
    tags=["Director Endpoints"],
    summary="List Pending Requests",
    description="""**Director-only endpoint**  
    Returns all pending requests from director's department(s).  
    
    **Filters:**  
    - Only shows requests from director's departments  
    - Only shows PENDING status requests  
    
    **Auto-rejects requests older than 24h**""",
    responses={
        200: OpenApiResponse(
            description="List of pending requests",
            response=RequestListSerializer,
            examples=[
                OpenApiExample(
                    "Example Response",
                    value={
                        "count": 2,
                        "department": ["Operations"],
                        "requests": [
                            {
                                "request_id": 42,
                                "status": "Pending",
                                "requester": {
                                    "email": "employee@company.com",
                                    "full_name": "John Employee",
                                    "department": "Operations"
                                },
                                "pickup_location": "HQ",
                                "destination": "Client Site",
                                "start_dateTime": "2025-06-20T09:00:00Z",
                                "end_dateTime": "2025-06-20T11:00:00Z",
                                "purpose": "Client meeting",
                                "passenger_count": 2,
                                "created_at": "2025-06-19T14:30:00Z",
                                "urgency": "Priority"
                            }
                        ]
                    }
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
    
    **Requirements:**  
    - Request must be PENDING  
    - Director must be assigned to requester's department  
    
    **Effects:**  
    - Changes status to PROCESSING  
    - Records approving director and timestamp""",
    responses={
        200: OpenApiResponse(
            description="Request approved",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 42,
                        "new_status": "Processing",
                        "approved_at": "2025-06-20T10:15:30Z",
                        "requester": {
                            "id": 101,
                            "name": "John Employee",
                            "department": "Operations"
                        },
                        "approved_by": {
                            "id": 201,
                            "name": "Jane Director",
                            "department": "Operations"
                        }
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
    
    **Requirements:**  
    - Request must be PENDING  
    - Director must be assigned to requester's department  
    - Must provide rejection reason  
    
    **Effects:**  
    - Changes status to REJECTED  
    - Records rejecting director, reason, and timestamp""",
    request=RequestRejectSerializer,
    responses={
        200: OpenApiResponse(
            description="Request rejected successfully",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 42,
                        "new_status": "Rejected",
                        "rejected_by": "Jane Director",
                        "rejection_reason": "No vehicles available",
                        "rejected_at": "2025-06-20T10:15:30Z",
                        "department": "Operations"
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
            description="ID of the request to reject"
        )
    ],
    examples=[
        OpenApiExample(
            "Rejection Reason Example",
            value={
                "reason": "No vehicles available for the requested time"
            }
        )
    ]
)

# Cancellation Documentation
cancel_request_docs = extend_schema(
    tags=["Requester Endpoints"],
    summary="Cancel Request",
    description="""**Employee-only endpoint**  
    Cancels a pending request.  
    
    **Requirements:**  
    - Request must be PENDING  
    - Must be the original requester  
    - Must provide cancellation reason  
    
    **Effects:**  
    - Changes status to CANCELLED  
    - Records cancellation reason and timestamp""",
    responses={
        200: OpenApiResponse(
            description="Request cancelled",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "new_status": "Cancelled",
                        "cancellation_reason": "Meeting was postponed"
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

# Request Status Documentation
request_status_docs = extend_schema(
    tags=["Employee Endpoints"],
    summary="Get Request Status",
    description="""**Employee-only endpoint**  
    Returns all requests for the current employee.  
    
    **Features:**  
    - Ordered by creation date (newest first)  
    - Shows all statuses (Pending, Approved, Rejected, etc.)  
    - Includes full request details""",
    responses={
        200: OpenApiResponse(
            response=EmployeeRequestStatusSerializer,
            description="List of employee's requests",
            examples=[
                OpenApiExample(
                    "Example Response",
                    value=[
                        {
                            "request_id": 42,
                            "created_at": "2025-06-19T14:30:00Z",
                            "status": "Approved",
                            "purpose": "Client meeting"
                        }
                    ]
                )
            ]
        ),
        **COMMON_RESPONSES
    }
)

# Admin List Documentation
admin_requests_docs = extend_schema(
    tags=["Admin Endpoints"],
    summary="List Approved Requests",
    description="""**Admin-only endpoint**  
    Returns all approved requests for vehicle assignment.  
    
    **Filters:**  
    - Only shows APPROVED status requests  
    - Only shows requests with department approval""",
    responses={
        200: OpenApiResponse(
            response=RequestListSerializer,
            description="List of approved requests",
            examples=[
                OpenApiExample(
                    "Example Response",
                    value=[
                        {
                            "requester": "employee@company.com",
                            "department_approver": "director@company.com",
                            "pickup_location": "HQ",
                            "destination": "Airport",
                            "created_at": "2025-06-19T14:30:00Z",
                            "status": "Approved"
                        }
                    ]
                )
            ]
        ),
        **COMMON_RESPONSES
    }
)

# Status Transitions Documentation
status_transitions_docs = OpenApiExample(
    "Status Flow",
    description="""
    Pending → Approved (by Director)
    Pending → Cancelled (by Requester)
    Pending → Rejected (by Director)
    Approved → Assigned (by Admin)
    Approved → Completed (by Driver)
    """,
    value=None
)

user_request_history_docs = """
get:
Returns a summary and list of all requests for the specified user (by user_id),
including counts for total, accepted, and declined requests, and all request details for the dashboard.
Only accessible by the user themselves or an admin.

- If no user_id is provided, returns the history for the current authenticated user.
- If user_id is provided, only the user themselves or a superuser can access that user's history.

Response example:
{
    "total_requests": 6,
    "accepted_requests": 3,
    "declined_requests": 2,
    "requests": [
        {
            "request_id": "#001",
            "date": "11 Feb, 2024",
            "requester": "John Doe",
            "approver": "Jane Smith",
            "vehicle": "Sedan",
            "driver": "Michael Smith",
            "pickup": "Location A",
            "destination": "Location B",
            "reason": "Business Trip",
            "status": "Accepted"
        },
        ...
    ]
}
"""
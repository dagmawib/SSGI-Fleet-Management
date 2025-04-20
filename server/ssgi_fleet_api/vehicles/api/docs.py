from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
    OpenApiParameter,
    OpenApiTypes
)
from .serializers import VehicleSerializer

# Common API responses
common_responses = {
    401: OpenApiResponse(description="Unauthorized - Missing or invalid authentication credentials"),
    403: OpenApiResponse(description="Forbidden - User lacks required permissions"),
    404: OpenApiResponse(description="Vehicle not found")
}

# Add Vehicle Documentation
vehicle_create_docs = extend_schema(
    tags=["Vehicle Management"],
    summary="Register new vehicle",
    description="""Create a new vehicle in the fleet management system.
    **Permissions:** Admin or Superadmin only.
    """,
    examples=[
        OpenApiExample(
            "Valid Vehicle Creation",
            value={
                "license_plate": "ABC-1234",
                "make": "Toyota",
                "model": "Land Cruiser",
                "year": 2023,
                "color": "White",
                "fuel_type": "diesel",
                "capacity": 7,
                "status": "available"
            },
            request_only=True
        )
    ],
    responses={
        201: OpenApiResponse(
            response=VehicleSerializer,
            description="Vehicle successfully registered",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "license_plate": "ABC-1234",
                        "make": "Toyota",
                        "model": "Land Cruiser",
                        "status": "available",
                        "assigned_driver": None
                    }
                )
            ]
        ),
        **common_responses
    }
)

# List Vehicles Documentation
vehicle_list_docs = extend_schema(
    tags=["Vehicle Management"],
    summary="List all vehicles",
    description="""Retrieve paginated list of vehicles with filtering capabilities.
    **Permissions:** All authenticated users.
    """,
    parameters=[
        OpenApiParameter(
            name="status",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by vehicle status",
            enum=["available", "in_use", "maintenance", "out_of_service"],
            required=False
        ),
        OpenApiParameter(
            name="make",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by vehicle manufacturer",
            required=False
        ),
        OpenApiParameter(
            name="capacity_min",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Minimum passenger capacity",
            required=False
        )
    ],
    responses={
        200: OpenApiResponse(
            response=VehicleSerializer(many=True),
            description="Paginated list of vehicles",
            examples=[
                OpenApiExample(
                    "Filtered Response",
                    value=[{
                        "id": 1,
                        "license_plate": "ABC-1234",
                        "make": "Toyota",
                        "status": "available"
                    }]
                )
            ]
        ),
        **common_responses
    }
)

# Vehicle Detail Documentation
vehicle_retrieve_docs = extend_schema(
    tags=["Vehicle Management"],
    summary="Get vehicle details",
    description="""Retrieve complete details for a specific vehicle.
    **Permissions:** All authenticated users.
    """,
    responses={
        200: OpenApiResponse(
            response=VehicleSerializer,
            description="Vehicle details",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "id": 1,
                        "license_plate": "ABC-1234",
                        "make": "Toyota",
                        "model": "Land Cruiser",
                        "year": 2023,
                        "current_mileage": 15000,
                        "last_service_date": "2023-06-15",
                        "status": "available"
                    }
                )
            ]
        ),
        **common_responses
    }
)

# Update Vehicle Documentation
vehicle_update_docs = extend_schema(
    tags=["Vehicle Management"],
    summary="Update vehicle details",
    description="""Update vehicle information or status.
    **Permissions:** Admin or Superadmin only.
    """,
    examples=[
        OpenApiExample(
            "Status Update",
            value={"status": "maintenance", "notes": "Engine check required"},
            request_only=True
        ),
        OpenApiParameter(
            name="id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="Vehicle ID"
        )
    ],
    responses={
        200: OpenApiResponse(
            response=VehicleSerializer,
            description="Vehicle updated successfully",
            examples=[
                OpenApiExample(
                    "Update Response",
                    value={
                        "id": 1,
                        "status": "maintenance",
                        "notes": "Engine check required"
                    }
                )
            ]
        ),
        **common_responses
    }
)
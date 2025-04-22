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

# Vehicle Create Endpoint
vehicle_create_docs = extend_schema(
    tags=["Vehicle Management"],
    operation_id="vehicle_create",
    summary="Register a new vehicle",
    description="""
    Register a new vehicle in the system.

    **Permissions Required:** Admin or Superadmin.

    **Request URL:** `/api/vehicles/`
    **Method:** POST

    **Example Request Body:**
    ```json
    {
        "license_plate": "ABC-1234",
        "make": "Toyota",
        "model": "Land Cruiser",
        "year": 2023,
        "color": "White",
        "fuel_type": "diesel",
        "capacity": 7,
        "status": "available"
    }
    ```
    """,
    request=VehicleSerializer,
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

# Vehicle List Endpoint
vehicle_list_docs = extend_schema(
    tags=["Vehicle Management"],
    operation_id="vehicle_list",
    summary="List all vehicles",
    description="""
    Retrieve a paginated list of all vehicles.

    **Permissions Required:** Authenticated users.

    **Request URL:** `/api/vehicles/list/`
    **Method:** GET

    **Query Parameters (Optional):**
      - `status`: Filter by status (available, in_use, maintenance, out_of_service)
      - `make`: Filter by manufacturer (e.g., Toyota)
      - `capacity_min`: Minimum capacity (e.g., 4)
      - `search`: Keyword to search in license plate, make, or model
    """,
    parameters=[
        OpenApiParameter(
            name="status",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by vehicle status",
            enum=["available", "in_use", "maintenance", "out_of_service"]
        ),
        OpenApiParameter(
            name="make",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by manufacturer"
        ),
        OpenApiParameter(
            name="capacity_min",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description="Minimum passenger capacity"
        ),
        OpenApiParameter(
            name="search",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Search by license plate, make, or model"
        )
    ],
    responses={
        200: OpenApiResponse(
            response=VehicleSerializer(many=True),
            description="List of vehicles",
            examples=[
                OpenApiExample(
                    "Vehicle List Response",
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

# Vehicle Retrieve Endpoint
vehicle_retrieve_docs = extend_schema(
    tags=["Vehicle Management"],
    operation_id="vehicle_retrieve",
    summary="Retrieve details of a vehicle",
    description="""
    Retrieve detailed information about a specific vehicle.

    **Permissions Required:** Authenticated users.

    **Request URL:** `/api/vehicles/{id}/`
    **Method:** GET
    """,
    responses={
        200: OpenApiResponse(
            response=VehicleSerializer,
            description="Vehicle details",
            examples=[
                OpenApiExample(
                    "Vehicle Detail",
                    value={
                        "id": 1,
                        "license_plate": "ABC-1234",
                        "make": "Toyota",
                        "model": "Land Cruiser",
                        "year": 2023,
                        "status": "available",
                        "current_mileage": 15000,
                        "last_service_date": "2023-06-15"
                    }
                )
            ]
        ),
        **common_responses
    }
)

# Vehicle Update Endpoint
vehicle_update_docs = extend_schema(
    tags=["Vehicle Management"],
    operation_id="vehicle_update",
    summary="Update vehicle information",
    description="""
    Update specific fields of a vehicle (e.g., status or notes).

    **Permissions Required:** Admin or Superadmin.

    **Request URL:** `/api/vehicles/{id}/`
    **Method:** PUT/PATCH
    """,
    request=VehicleSerializer,
    responses={
        200: OpenApiResponse(
            response=VehicleSerializer,
            description="Updated vehicle info",
            examples=[
                OpenApiExample(
                    "Vehicle Updated",
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

# Vehicle Maintenance Custom Action
vehicle_maintenance_docs = extend_schema(
    tags=["Vehicle Management"],
    operation_id="vehicle_set_maintenance",
    summary="Mark vehicle as needing maintenance",
    description="""
    Set a vehicle's status to 'maintenance'.

    **Permissions Required:** Admin or Superadmin.

    **Request URL:** `/api/vehicles/{id}/maintenance/`
    **Method:** POST
    """,
    responses={
        200: OpenApiResponse(
            description="Vehicle marked for maintenance",
            examples=[
                OpenApiExample(
                    "Maintenance Set",
                    value={"status": "maintenance scheduled"}
                )
            ]
        ),
        **common_responses
    }
)

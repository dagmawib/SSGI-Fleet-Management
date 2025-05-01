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

    **Vehicle Categories:**
    - `field`: Field Car
    - `pool`: Pool Car (All pool cars that have been in use or available within the last 24 hours will be set to available at 8:40 AM automatically)

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
        "status": "available",
        "category": "pool",
        "driver_name": "John Smith"
    }
    ```

    **Notes:**
    - The `driver_name` field must contain the full name of an existing active driver
    - The system will validate that the named person exists and has the driver role
    - The driver must be active in the system
    - The `category` field is required and must be either `field` or `pool`.
    - All pool cars that have been in use or available within the last 24 hours will be set to available at 8:40 AM automatically.
    - All fields are required unless otherwise specified.
    
    **Error Handling:**
    - Returns `400 Bad Request` for validation errors (e.g., missing fields, invalid driver, invalid category)
    - Returns `403 Forbidden` if user lacks permission
    - Returns `401 Unauthorized` if not authenticated
    
    **Example Error Response:**
    ```json
    {
        "driver_name": ["No active driver found with this name. Please ensure the driver exists and is active."]
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
                        "category": "pool",
                        "assigned_driver": 5,
                        "driver_name": "John Smith"
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Validation Error",
            examples=[
                OpenApiExample(
                    "Driver Not Found Error",
                    value={
                        "driver_name": [
                            "No active driver found with this name. Please ensure the driver exists and is active."
                        ]
                    }
                ),
                OpenApiExample(
                    "Missing Category Error",
                    value={
                        "category": ["This field is required."]
                    }
                ),
                OpenApiExample(
                    "Invalid Category Error",
                    value={
                        "category": ["Value 'invalid' is not a valid choice."]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Missing or invalid authentication credentials"),
        403: OpenApiResponse(description="Forbidden - User lacks required permissions"),
        404: OpenApiResponse(description="Vehicle not found")
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
      - `category`: Filter by vehicle category (`field` or `pool`)

    **Example Response:**
    ```json
    [
      {
        "id": 1,
        "license_plate": "ABC-1234",
        "make": "Toyota",
        "model": "Land Cruiser",
        "status": "available",
        "category": "pool"
      }
    ]
    ```

    **Error Handling:**
    - Returns `401 Unauthorized` if not authenticated
    - Returns `403 Forbidden` if user lacks permission
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
        ),
        OpenApiParameter(
            name="category",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by vehicle category (field or pool)",
            enum=["field", "pool"]
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
                        "model": "Land Cruiser",
                        "status": "available",
                        "category": "pool"
                    }]
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - Missing or invalid authentication credentials"),
        403: OpenApiResponse(description="Forbidden - User lacks required permissions")
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

    **Error Handling:**
    - Returns `404 Not Found` if the vehicle does not exist
    - Returns `401 Unauthorized` if not authenticated
    - Returns `403 Forbidden` if user lacks permission
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
                        "category": "pool",
                        "current_mileage": 15000,
                        "last_service_date": "2023-06-15"
                    }
                )
            ]
        ),
        404: OpenApiResponse(description="Vehicle not found"),
        401: OpenApiResponse(description="Unauthorized - Missing or invalid authentication credentials"),
        403: OpenApiResponse(description="Forbidden - User lacks required permissions")
    }
)

# Vehicle Update Endpoint
vehicle_update_docs = extend_schema(
    tags=["Vehicle Management"],
    operation_id="vehicle_update",
    summary="Update vehicle information",
    description="""
    Update specific fields of a vehicle (e.g., status, notes, category).

    **Permissions Required:** Admin or Superadmin.

    **Request URL:** `/api/vehicles/{id}/`
    **Method:** PUT/PATCH

    **Error Handling:**
    - Returns `400 Bad Request` for validation errors
    - Returns `404 Not Found` if the vehicle does not exist
    - Returns `401 Unauthorized` if not authenticated
    - Returns `403 Forbidden` if user lacks permission
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
                        "category": "field",
                        "notes": "Engine check required"
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Validation Error",
            examples=[
                OpenApiExample(
                    "Invalid Category Error",
                    value={
                        "category": ["Value 'invalid' is not a valid choice."]
                    }
                )
            ]
        ),
        404: OpenApiResponse(description="Vehicle not found"),
        401: OpenApiResponse(description="Unauthorized - Missing or invalid authentication credentials"),
        403: OpenApiResponse(description="Forbidden - User lacks required permissions")
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

    **Error Handling:**
    - Returns `404 Not Found` if the vehicle does not exist
    - Returns `401 Unauthorized` if not authenticated
    - Returns `403 Forbidden` if user lacks permission
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
        404: OpenApiResponse(description="Vehicle not found"),
        401: OpenApiResponse(description="Unauthorized - Missing or invalid authentication credentials"),
        403: OpenApiResponse(description="Forbidden - User lacks required permissions")
    }
)

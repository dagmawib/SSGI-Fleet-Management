from typing import Generic
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiResponse, OpenApiParameter, OpenApiTypes
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework.views import APIView
from assignment.models import Trips
from django.utils import timezone
from datetime import datetime
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import JSONParser
from django.http import HttpResponse
import csv

from vehicles.models import Vehicle, VehicleDriverAssignmentHistory
from users.models import User
from users.api.serializers import UserSerializer
from .serializers import VehicleSerializer
from .permissions import IsAdminOrSuperAdmin
from .docs import (
    vehicle_create_docs,
    vehicle_list_docs,
    vehicle_retrieve_docs,
    vehicle_update_docs
)

@extend_schema_view(post=vehicle_create_docs)
class AddVehicleView(generics.CreateAPIView):
    """
    Endpoint for admin to register new fleet vehicles
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

@extend_schema_view(get=vehicle_list_docs)
class ListVehiclesView(generics.ListAPIView):
    """
    Public vehicle listing with advanced filtering
    """
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'make', 'fuel_type', 'category']

    def get_queryset(self):
        queryset = Vehicle.objects.select_related(
            'assigned_driver', 
            'department'
        )
        
        # Custom filters
        params = self.request.query_params
        if capacity := params.get('capacity_min'):
            queryset = queryset.filter(capacity__gte=capacity)
        if search := params.get('search'):
            queryset = queryset.filter(
                Q(license_plate__icontains=search) |
                Q(make__icontains=search) |
                Q(model__icontains=search))
        return queryset.order_by('make', 'model')

class VehicleViewSet(viewsets.ModelViewSet):
    """
    Complete vehicle management endpoint
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrSuperAdmin()]

    # @extend_schema(**vehicle_retrieve_docs)
    @vehicle_retrieve_docs
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # @extend_schema(**vehicle_update_docs)
    @vehicle_update_docs
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    # @extend_schema(**vehicle_update_docs)
    @vehicle_update_docs
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def maintenance(self, request, pk=None):
        """Mark vehicle as needing maintenance"""
        vehicle = self.get_object()
        vehicle.status = Vehicle.Status.MAINTENANCE
        vehicle.save()
        return Response({'status': 'maintenance scheduled'})

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'status' in serializer.validated_data:
            self._log_status_change(instance)

    def _log_status_change(self, vehicle):
        # Implement status change logging here
        pass

@extend_schema(
    summary="Monthly vehicle usage report (all vehicles, filterable)",
    description="Returns a list of all vehicles with their name, plate, driver(s), department, category, status, trip count, and total kilometers driven for the selected period (default: current month). Supports CSV export. Only accessible to admins and superadmins.",
    parameters=[
        OpenApiParameter("start", OpenApiTypes.DATE, OpenApiParameter.QUERY, description="Start date (YYYY-MM-DD) for the report period. Default: first day of current month."),
        OpenApiParameter("end", OpenApiTypes.DATE, OpenApiParameter.QUERY, description="End date (YYYY-MM-DD) for the report period. Default: today."),
        OpenApiParameter("export", OpenApiTypes.STR, OpenApiParameter.QUERY, description="If 'csv', returns a CSV file instead of JSON."),
    ],
    responses={
        200: OpenApiResponse(
            response=None,
            description="A list of all vehicles with their usage and stats for the selected period."
        )
    },
    tags=["Vehicle History"]
)
class VehicleHistoryListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        # Date range
        now = timezone.now()
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        try:
            if start_str:
                start = timezone.make_aware(datetime.strptime(start_str, "%Y-%m-%d"))
            else:
                start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if end_str:
                end = timezone.make_aware(datetime.strptime(end_str, "%Y-%m-%d"))
            else:
                end = now
        except Exception:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        vehicles = Vehicle.objects.select_related('assigned_driver', 'department').all()
        data = []
        for vehicle in vehicles:
            # All completed trips for this vehicle in the period
            trips = Trips.objects.filter(
                assignment__vehicle=vehicle,
                status=Trips.TripStatus.COMPLETED,
                start_time__gte=start,
                start_time__lte=end
            )
            total_km = sum([t.distance for t in trips])
            trip_count = trips.count()
            # All drivers for this vehicle in the period
            driver_ids = trips.values_list('assignment__driver', flat=True).distinct()
            drivers = User.objects.filter(id__in=driver_ids)
            driver_names = [f"{d.first_name} {d.last_name}" for d in drivers]
            # Current driver
            current_driver = vehicle.assigned_driver
            # Maintenance alert
            maintenance_due = False
            if vehicle.next_service_mileage and vehicle.current_mileage >= vehicle.next_service_mileage:
                maintenance_due = True
            data.append({
                "id": vehicle.id,
                "vehicle": f"{vehicle.make} {vehicle.model}",
                "license_plate": vehicle.license_plate,
                "department": vehicle.department.name if vehicle.department else None,
                "category": vehicle.category,
                "status": vehicle.status,
                "current_driver": f"{current_driver.first_name} {current_driver.last_name}" if current_driver else None,
                "drivers_this_period": driver_names,
                "trip_count": trip_count,
                "total_km": total_km,
                "maintenance_due": maintenance_due
            })
        # CSV export
        if request.query_params.get('export') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="vehicle_history.csv"'
            writer = csv.writer(response)
            writer.writerow(["Vehicle", "License Plate", "Department", "Category", "Status", "Current Driver", "Drivers This Period", "Trip Count", "Total KM", "Maintenance Due"])
            for row in data:
                writer.writerow([
                    row["vehicle"], row["license_plate"], row["department"], row["category"], row["status"],
                    row["current_driver"], ", ".join(row["drivers_this_period"]), row["trip_count"], row["total_km"],
                    "Yes" if row["maintenance_due"] else "No"
                ])
            return response
        return Response(data)

@extend_schema(
    summary="Monthly vehicle usage report (single vehicle)",
    description="Returns the name, plate, driver, and total kilometers driven for the current month for a single vehicle. Only accessible to admins and superadmins.",
    responses={
        200: OpenApiResponse(
            response=None,
            description="Vehicle monthly usage: {vehicle, license_plate, driver, total_km_this_month}"
        ),
        404: OpenApiResponse(
            response=None,
            description="Vehicle not found."
        )
    },
    tags=["Vehicle History"]
)
class VehicleHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request, id):
        """
        Returns vehicle name, plate, driver, and total km for the current month.
        """
        try:
            vehicle = Vehicle.objects.select_related('assigned_driver').get(id=id)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found."}, status=404)

        # Get first and last day of current month
        now = timezone.now()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Get all completed trips for this vehicle in the current month
        trips = Trips.objects.filter(
            assignment__vehicle=vehicle,
            status=Trips.TripStatus.COMPLETED,
            start_time__gte=first_day,
            start_time__lte=now
        )
        total_km = sum([t.distance for t in trips])
        driver = vehicle.assigned_driver
        return Response({
            "vehicle": f"{vehicle.make} {vehicle.model}",
            "license_plate": vehicle.license_plate,
            "driver": f"{driver.first_name} {driver.last_name}" if driver else None,
            "total_km_this_month": total_km
        })

@extend_schema(
    summary="Vehicle assignment history (all drivers)",
    description="Returns the full assignment history for a vehicle, including all drivers, assigned_at, and unassigned_at dates. Only accessible to admins and superadmins.",
    responses={
        200: OpenApiResponse(
            response=None,
            description="A list of driver assignments for the vehicle [{driver, assigned_at, unassigned_at}]"
        ),
        404: OpenApiResponse(
            response=None,
            description="Vehicle not found."
        )
    },
    tags=["Vehicle History"]
)
class VehicleAssignmentHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request, id):
        try:
            vehicle = Vehicle.objects.get(id=id)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found."}, status=404)
        assignments = VehicleDriverAssignmentHistory.objects.filter(vehicle=vehicle).select_related('driver').order_by('-assigned_at')
        data = [
            {
                "driver": f"{a.driver.first_name} {a.driver.last_name}",
                "assigned_at": a.assigned_at,
                "unassigned_at": a.unassigned_at
            }
            for a in assignments
        ]
        return Response(data)

@extend_schema(
    summary="List unassigned drivers",
    description="Returns a list of all drivers who are not currently assigned to any vehicle. Useful for assigning drivers to vehicles. Each driver includes id, first_name, last_name, and email.",
    responses={
        200: OpenApiResponse(
            response=None,  # You can define a serializer if you want strict schema
            description="A list of unassigned drivers [{id, first_name, last_name, email}]"
        )
    },
    tags=["Drivers"]
)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def unassigned_drivers(request):
    """
    List all drivers not currently assigned to any vehicle.
    Returns: [{"id": ..., "first_name": ..., "last_name": ..., "email": ...}]
    """
    assigned_driver_ids = Vehicle.objects.exclude(assigned_driver=None).values_list("assigned_driver", flat=True)
    drivers = User.objects.filter(role=User.Role.DRIVER, is_active=True).exclude(id__in=assigned_driver_ids)
    data = [
        {"id": d.id, "first_name": d.first_name, "last_name": d.last_name, "email": d.email}
        for d in drivers
    ]
    return Response(data)

@extend_schema(
    summary="List all active drivers",
    description="Returns a list of all active drivers (id, first_name, last_name, email, and assigned_vehicle if any). Useful for admin assignment UI.",
    responses={
        200: OpenApiResponse(
            response=None,
            description="A list of all active drivers [{id, first_name, last_name, email, assigned_vehicle}]"
        )
    },
    tags=["Drivers"]
)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def all_drivers(request):
    """
    List all active drivers, including their current assigned vehicle (if any).
    Returns: [{"id": ..., "first_name": ..., "last_name": ..., "email": ..., "assigned_vehicle": {"id": ..., "license_plate": ...} or null}]
    """
    drivers = User.objects.filter(role=User.Role.DRIVER, is_active=True)
    data = []
    for d in drivers:
        assigned_vehicle = None
        vehicle = getattr(d, 'assigned_vehicles', None)
        if vehicle and vehicle.exists():
            v = vehicle.first()
            assigned_vehicle = {"id": v.id, "license_plate": v.license_plate}
        data.append({
            "id": d.id,
            "first_name": d.first_name,
            "last_name": d.last_name,
            "email": d.email,
            "assigned_vehicle": assigned_vehicle
        })
    return Response(data)
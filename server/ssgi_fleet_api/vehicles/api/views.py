from typing import Generic
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from vehicles.models import Vehicle
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
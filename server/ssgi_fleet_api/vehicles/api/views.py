from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from vehicles.models import Vehicle
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
    filterset_fields = ['status', 'make', 'fuel_type']

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
                Q(model__icontains=search)
            )
        
        return queryset.order_by('make', 'model')

@extend_schema_view(
    get=vehicle_retrieve_docs,
    put=vehicle_update_docs,
    patch=vehicle_update_docs
)
class UpdateVehicleView(generics.RetrieveUpdateAPIView):
    """
    Vehicle detail management endpoint
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrSuperAdmin()]

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'status' in serializer.validated_data:
            self._log_status_change(instance)

    def _log_status_change(self, vehicle):
        # Implement status change logging here
        pass
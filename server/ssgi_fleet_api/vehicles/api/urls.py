from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AddVehicleView, ListVehiclesView, VehicleViewSet, unassigned_drivers

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')

urlpatterns = [
    path('vehicles/add/', AddVehicleView.as_view(), name='vehicle-add'),
    path('vehicles/list/', ListVehiclesView.as_view(), name='vehicle-list'),
    path('drivers/unassigned/', unassigned_drivers, name='unassigned-drivers'),
    *router.urls,
]
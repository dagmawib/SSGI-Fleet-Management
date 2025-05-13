from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AddVehicleView, ListVehiclesView, VehicleViewSet, unassigned_drivers, all_drivers, VehicleHistoryView, VehicleHistoryListView

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')

urlpatterns = [
    path('vehicles/add/', AddVehicleView.as_view(), name='vehicle-add'),
    path('vehicles/list/', ListVehiclesView.as_view(), name='vehicle-list'),
    path('vehicles/history/', VehicleHistoryListView.as_view(), name='vehicle-history-list'),
    path('vehicles/<int:id>/history/', VehicleHistoryView.as_view(), name='vehicle-history'),
    path('drivers/unassigned/', unassigned_drivers, name='unassigned-drivers'),
    path('drivers/all/', all_drivers, name='all-drivers'),
    *router.urls,
]
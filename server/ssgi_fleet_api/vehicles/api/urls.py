from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    AddVehicleView,
    ListVehiclesView,
    UpdateVehicleView
)

router = DefaultRouter()
router.register(r'vehicles', UpdateVehicleView, basename='vehicle')

urlpatterns = [
    path('vehicles/add/', AddVehicleView.as_view(), name='vehicle-add'),
    path('vehicles/list/', ListVehiclesView.as_view(), name='vehicle-list'),
    *router.urls,
]
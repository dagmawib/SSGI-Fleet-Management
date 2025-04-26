from django.urls import path
from .views import AssignCarAPIView

urlpatterns = [
    path('assign/', AssignCarAPIView.as_view(), name='assign-vehicle')
]
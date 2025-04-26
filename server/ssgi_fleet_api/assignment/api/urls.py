from django.urls import path
from .views import AssignCarAPIView , CarRejectAPIView

urlpatterns = [
    path('assign/', AssignCarAPIView.as_view(), name='assign-vehicle'),
    path('reject/', CarRejectAPIView.as_view(), name="reject-vehicle")
]
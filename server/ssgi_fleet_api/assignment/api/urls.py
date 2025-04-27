from django.urls import path
from .views import AssignCarAPIView , CarRejectAPIView ,DriverRequestView , AcceptAssignmentAPIView

urlpatterns = [
    path('assign/', AssignCarAPIView.as_view(), name='assign-vehicle'),
    path('reject/', CarRejectAPIView.as_view(), name="reject-vehicle"),
    path('driver/requests/',DriverRequestView.as_view() , name="driver-requests"),
    path('<int:id>/accept/' , AcceptAssignmentAPIView.as_view() , name="accept-assigment")
]
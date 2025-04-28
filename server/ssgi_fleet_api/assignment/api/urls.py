from django.urls import path
from .views import(
    AssignCarAPIView ,
    CarRejectAPIView ,
    DriverRequestView ,
    AcceptAssignmentAPIView ,
    DeclineAssignmentAPIView,
    CompleteAssignmentAPIView
)

urlpatterns = [
    path('assign/', AssignCarAPIView.as_view(), name='assign-vehicle'),
    path('reject/', CarRejectAPIView.as_view(), name="reject-vehicle"),
    path('driver/requests/',DriverRequestView.as_view() , name="driver-requests"),
    path('<int:id>/accept/' , AcceptAssignmentAPIView.as_view() , name="accept-assigment"),
    path('<assignment_id>/decline/',DeclineAssignmentAPIView.as_view(), name = "decline-assignment"),
    path('<int:trip_id>/complete/',
        CompleteAssignmentAPIView.as_view(),
        name='complete-assignment'
    )
]

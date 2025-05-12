from django.urls import path
from .views import(
    AssignCarAPIView,
    CarRejectAPIView,
    DriverRequestView,
    AcceptAssignmentAPIView,
    DeclineAssignmentAPIView,
    CompleteAssignmentAPIView,
    DriverCompletedTripsView,
    AdminAssignmentHistoryAPIView
)

urlpatterns = [
    path('assign/', AssignCarAPIView.as_view(), name='assign-vehicle'),
    path('reject/', CarRejectAPIView.as_view(), name="reject-vehicle"),
    path('driver/requests/',DriverRequestView.as_view() , name="driver-requests"),
    path('<int:assignment_id>/accept/' , AcceptAssignmentAPIView.as_view() , name="accept-assigment"),
    path('<int:assignment_id>/decline/',DeclineAssignmentAPIView.as_view(), name = "decline-assignment"),
    path('<int:trip_id>/complete/',
        CompleteAssignmentAPIView.as_view(),
        name='complete-assignment'
    ),
    path('driver/completed-trips/', DriverCompletedTripsView.as_view(), name='driver-completed-trips'),
    path('admin/assignment-history/', AdminAssignmentHistoryAPIView.as_view(), name='admin-assignment-history'),
    path('assignments/admin/history/', AdminAssignmentHistoryAPIView.as_view(), name='admin-assignment-history')
]

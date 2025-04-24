from django.urls import path
from .views import (
    RequestCreateAPIView,
    PendingRequestsAPI,
    RequestApproveAPI,
    RequestCancelAPI,
    RequestRejectAPI,
    RequestsListAPIView,
    EmployeeRequestStatusView
)

urlpatterns = [
    # Requester endpoints
    path('requests/', RequestCreateAPIView.as_view(), name='request-create'),
    path('requests/pending/', PendingRequestsAPI.as_view(), name='pending-requests'),
    path('requests/<int:request_id>/approve/', RequestApproveAPI.as_view(), name='approve-request'),
    path('requests/<int:request_id>/reject/', RequestRejectAPI.as_view(), name='reject-request'),
    path('requests/<int:request_id>/cancel/', RequestCancelAPI.as_view(), name='cancel-request'),
    path('requests/list/',RequestsListAPIView.as_view(), name='request-list'),
    path('requests/status/',EmployeeRequestStatusView.as_view(), name= 'employee-pr-requests')
]
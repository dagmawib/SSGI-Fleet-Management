from django.urls import path
from .views import (
    RequestCreateAPIView,
    PendingRequestsAPI,
    RequestApproveAPI,
    RequestCancelAPI
)

urlpatterns = [
    # Requester endpoints
    path('requests/', RequestCreateAPIView.as_view(), name='request-create'),
    
    # Director endpoints
    path('requests/pending/', PendingRequestsAPI.as_view(), name='pending-requests'),
    path('requests/<int:request_id>/approve/', RequestApproveAPI.as_view(), name='approve-request'),
    
    # Requester cancellation
    path('requests/<int:request_id>/cancel/', RequestCancelAPI.as_view(), name='cancel-request'),
]
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from ssgi_fleet_api.users.views import welcome


urlpatterns = [
    path("", welcome),
    
    path("admin/", admin.site.urls),
    path("api/auth/", include("ssgi_fleet_api.users.api.urls")),          
    path("api/vehicles/", include("ssgi_fleet_api.vehicles.api.urls")),   
    path('api/request/' , include("ssgi_fleet_api.request.api.urls")),
    path('api/assignments/', include("ssgi_fleet_api.assignment.api.urls")),

    # OpenAPI Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),

    # Swagger UI
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    # Redoc UI
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

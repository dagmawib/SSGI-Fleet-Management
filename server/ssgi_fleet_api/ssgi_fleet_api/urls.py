from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from users.views import welcome



urlpatterns = [
    path("", welcome),
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.api.urls")),
    path("api/vehicles/", include("vehicles.api.urls")),
    path('api/request/' , include("request.api.urls")),
    path('api/assignments/', include("assignment.api.urls")),

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
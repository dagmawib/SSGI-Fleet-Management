from django.shortcuts import render
from django.http import JsonResponse

def welcome(request):
    return JsonResponse({
        "message": "Welcome to SSGI Fleet API",
        "endpoints": {
            "admin": "/admin/",
            "api_docs": "/api/docs/",
            "api_schema": "/api/schema/",
            "auth": "/api/auth/"
        }
    })

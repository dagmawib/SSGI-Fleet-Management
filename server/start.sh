#!/bin/sh
# Start cron service
service cron start
# Set PYTHONPATH so Gunicorn can find the Django project
export PYTHONPATH=/app/ssgi_fleet_api
# Start gunicorn in the foreground from the Django project directory
exec gunicorn ssgi_fleet_api.wsgi:application --chdir /app/ssgi_fleet_api --bind 0.0.0.0:8000

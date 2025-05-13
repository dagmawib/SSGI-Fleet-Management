#!/bin/sh
# Start cron in the background
echo "Starting cron at $(date)" > /tmp/cron_start.log
cron & CRON_PID=$!
echo "Cron started with PID $CRON_PID at $(date)" >> /tmp/cron_start.log
# Start Gunicorn in the foreground
exec gunicorn ssgi_fleet_api.wsgi:application --chdir ssgi_fleet_api --bind 0.0.0.0:8000
#!/bin/sh
# Start cron in the background
service cron start
# Print running crontab for debug
echo "Current crontab:" && crontab -l
# Start Gunicorn in the foreground
exec gunicorn ssgi_fleet_api.wsgi:application --chdir ssgi_fleet_api --bind 0.0.0.0:8000

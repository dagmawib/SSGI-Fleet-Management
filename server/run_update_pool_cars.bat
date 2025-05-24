@echo off
REM Batch file to run Django update_pool_cars command for Windows Task Scheduler

REM Set environment variables
set DJANGO_SETTINGS_MODULE=ssgi_fleet_api.settings
set DB_NAME=postgres
set DB_USER=postgres.wyskppbfbbydmslwecgo
set DB_PASSWORD=jMDXNscy0bdIoFSv
set DB_HOST=aws-0-ap-south-1.pooler.supabase.com
set DB_PORT=6543

REM Change to the Django project directory
cd /d %~dp0ssgi_fleet_api

REM Run the management command
python manage.py update_pool_cars >> %~dp0update_pool_cars.log 2>&1

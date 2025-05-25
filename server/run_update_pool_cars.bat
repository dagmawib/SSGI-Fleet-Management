@echo off
REM Batch file to run Django update_pool_cars command using Docker

set CONTAINER_NAME=ssgi_backend

REM Log start time
set LOGFILE=%~dp0update_pool_cars.log
set DATETIME=[%date% %time%]
echo %DATETIME% Starting update_pool_cars >> %LOGFILE%

REM Clear CONTAINER_ID and CONTAINER_FOUND before checking
set CONTAINER_ID=
set CONTAINER_FOUND=

REM Get all running containers with a name containing CONTAINER_NAME
for /f "delims=" %%i in ('docker ps --filter "name=%CONTAINER_NAME%" --filter "status=running" --format "{{.Names}}"') do (
    if "%%i"=="%CONTAINER_NAME%" set CONTAINER_FOUND=1
)

REM Debug: log the detection result
if defined CONTAINER_FOUND (
    echo %DATETIME% Detected running container: %CONTAINER_NAME% >> %LOGFILE%
) else (
    echo %DATETIME% ERROR: Container %CONTAINER_NAME% is not running. >> %LOGFILE%
    echo Container %CONTAINER_NAME% is not running.
    exit /b 1
)

REM Run the management command inside the running backend container
docker exec %CONTAINER_NAME% python /app/ssgi_fleet_api/manage.py update_pool_cars >> %LOGFILE% 2>&1

REM Check exit code and log result
if errorlevel 1 (
    echo %DATETIME% ERROR: update_pool_cars command failed. >> %LOGFILE%
    echo update_pool_cars command failed.
    exit /b 1
) else (
    echo %DATETIME% update_pool_cars command completed successfully. >> %LOGFILE%
    echo update_pool_cars command completed successfully.
)

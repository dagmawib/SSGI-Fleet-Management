# Use official Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set timezone to Africa/Nairobi
RUN ln -snf /usr/share/zoneinfo/Africa/Nairobi /etc/localtime && echo "Africa/Nairobi" > /etc/timezone

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --default-timeout=100 --retries=10 -r requirements.txt

# Install cron
RUN apt-get update && apt-get install -y cron

# Create cron.log and set permissions
RUN touch /cron.log
RUN chmod 666 /cron.log

# Copy project files
COPY . /app/

# Copy crontab file and set permissions
COPY crontab.txt /etc/cron.d/update_pool_cars
RUN chmod 0644 /etc/cron.d/update_pool_cars

# Set workdir to Django project root for collectstatic
WORKDIR /app/ssgi_fleet_api
RUN python manage.py collectstatic --noinput

# Set workdir back to /app for Gunicorn
WORKDIR /app

# Expose port (default for Django)
EXPOSE 8000

# Start cron in the background and gunicorn in the foreground
CMD cron && gunicorn ssgi_fleet_api.wsgi:application --chdir ssgi_fleet_api --bind 0.0.0.0:8000
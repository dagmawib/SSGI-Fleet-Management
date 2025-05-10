# Use official Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Install cron
RUN apt-get update && apt-get install -y cron

# Set timezone to Africa/Nairobi
RUN apt-get update && apt-get install -y tzdata \
    && ln -fs /usr/share/zoneinfo/Africa/Nairobi /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata
ENV TZ=Africa/Nairobi

# Copy project files
COPY . /app/

# Copy crontab file and install it as user crontab
COPY crontab.txt /crontab.txt
RUN crontab /crontab.txt

# Copy start.sh and make it executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Set workdir to Django project root for collectstatic
WORKDIR /app/ssgi_fleet_api
RUN python manage.py collectstatic --noinput

# Set workdir back to /app for Gunicorn
WORKDIR /app

# Expose port (default for Django)
EXPOSE 8000

# Start both cron and gunicorn using start.sh
ENTRYPOINT ["/start.sh"]

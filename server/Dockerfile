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

# Copy project files
COPY . /app/

# Set workdir to Django project root for collectstatic
WORKDIR /app/ssgi_fleet_api
RUN python manage.py collectstatic --noinput

# Set workdir back to /app for Gunicorn
WORKDIR /app

# Expose port (default for Django)
EXPOSE 8000

# Start server
CMD ["gunicorn", "ssgi_fleet_api.wsgi:application", "--chdir", "ssgi_fleet_api", "--bind", "0.0.0.0:8000"]

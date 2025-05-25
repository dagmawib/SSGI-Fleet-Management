# --- Build Stage ---
FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set timezone to Africa/Nairobi
RUN ln -snf /usr/share/zoneinfo/Africa/Nairobi /etc/localtime && echo "Africa/Nairobi" > /etc/timezone

# Set work directory
WORKDIR /app

# Install system dependencies for Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev --fix-missing && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --default-timeout=100 --retries=10 -r requirements.txt

# Copy project files
COPY . .

# Set workdir for Django commands
WORKDIR /app/ssgi_fleet_api

# Set workdir back for Gunicorn
WORKDIR /app

EXPOSE 8000

CMD ["gunicorn", "ssgi_fleet_api.wsgi:application", "--chdir", "ssgi_fleet_api", "--bind", "0.0.0.0:8000"]
# SSGI-Fleet-Management

# Vehicle Request & Tracking System

## Overview
The **Vehicle Request & Tracking System** is a fleet management solution designed for government facilities to streamline vehicle requests, assignments, tracking, and reporting. This system ensures efficient vehicle allocation, real-time tracking, and detailed reporting to optimize resource utilization.

## Features
### 1. **Authentication & User Roles**
- Secure login using company credentials (No self-signups)
- Role-based access control (Employee, Driver, Admin)
- Multi-Factor Authentication (MFA) for security

### 2. **Vehicle Request System**
- Employees submit vehicle requests with pickup location, destination, duration, and urgency
- Approval workflow involving department directors and admins
- View assigned driver details and ETA
- Request cancellation with valid reasons

### 3. **Vehicle Assignment & Availability**
- Admin manually assigns vehicles and drivers
- Drivers can accept/decline assignments (with reasons)
- Real-time vehicle availability status
- Notification system for assignments

### 4. **Real-Time Tracking & Trip Updates**
- Live tracking using Google Maps API / OpenStreetMap
- Firebase Realtime Database for instant updates
- Drivers input trip details (start/end time, kilometers, fuel tracking, etc.)
- Office-hour tracking enforcement (with exceptions for long trips)

### 5. **Admin & Driver Dashboard**
- Admins manage requests, approve assignments, and track fleet
- Drivers receive trip details with route information
- Fleet managers generate vehicle usage reports

### 6. **Notifications & Alerts**
- Push notifications for request approvals, rejections, vehicle assignments, and trip status updates
- ETA notifications for employees
- Alerts for directors to approve requests

### 7. **Feedback & Reporting**
- Employees submit feedback after trips
- Weekly & monthly reports on vehicle usage, mileage, trip frequency, and maintenance records
- Automated report generation & email notifications

## Tech Stack
- **Frontend (Admin Dashboard):** React.js
- **Mobile App (Employee & Driver UI):** Flutter
- **Backend:** Django (REST API)
- **Database:** PostgreSQL
- **Real-Time Tracking:** Google Maps API / OpenStreetMap, Firebase Realtime Database
- **Cloud Hosting:** AWS / Google Cloud / Azure

## API & External Interfaces
- Secure API endpoints with OAuth2 / JWT authentication
- GPS tracking integration for real-time location updates
- Secure communication with encryption

## Installation
### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/vehicle-request-tracking.git
cd vehicle-request-tracking
```
### **2. Backend Setup (Django)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
### **3. Frontend Setup (Next.js)**
```bash
cd frontend
npm install
npm run dev
```
### **4. Mobile App Setup (Flutter)**
```bash
cd mobile
flutter pub get
flutter run
```

## Contribution
1. Create a new branch (`feature-branch`)
2. Commit your changes (`git commit -m "Added new feature"`)
3. Push to your branch (`git push origin feature-branch`)
4. Open a Pull Request



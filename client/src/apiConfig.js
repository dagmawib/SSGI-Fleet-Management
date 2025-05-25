// Use a relative API base URL so requests go through NGINX in all environments
export const API_BASE_URL = "/api";

// Base URL for server-to-server communication (Next.js API route to Django backend)
// This should be the address of your Django backend service from within the Docker network.
// It can be overridden by an environment variable NEXT_PUBLIC_BACKEND_API_URL.
export const SERVER_SIDE_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://backend:8000";

export const API_ENDPOINTS = {
    LOGIN: "/api/auth/login/",
    LOGOUT: "/api/auth/logout/",
    PROFILE: "/api/auth/profile/",
    FORGOT_PASSWORD: "/api/auth/forgot-password/",
    RESET_PASSWORD: "/api/auth/reset-password/",

    GENERATE_PASSWORD: "/api/auth/generate-password/",
    REGISTER_USER: "/api/auth/superadmin/register/",
    USERS_LIST: "/api/auth/users/",
    EDIT_USER: "/api/auth/users",
    DELETE_USER: "/api/auth/users",

    ADD_VEHICLE:"/api/vehicles/vehicles/add/",
    GET_VEHICLE:"/api/vehicles/vehicles/list/",
    DELETE_VEHICLE:"/api/vehicles/vehicles",
    EDIT_VEHICLE:"/api/vehicles/vehicles",
    VEHICLES_HISTORY:"/api/vehicles/vehicles/history",
    GET_DRIVERS:"/api/vehicles/drivers/unassigned/",
    VEHICLE_REQUEST:"/api/request/requests/",
    REQUESTS_FOR_DIRECTOR:"/api/request/requests/pending/",
    APPROVE_REQUEST:"/api/request/requests",
    APPROVE_REQUEST_BY_ID:"approve/",
    REJECT_REQUEST:"/api/request/requests",
    REJECT_REQUEST_BY_ID:"reject/",

    APPROVE_REQUEST_BY_DIRECTOR:"/api/request/requests/list/",

    ADMIN_REQUESTS:"/api/request/requests/list/",
    ADMIN_REJECT_REQUEST:"/api/assignments/reject/",
    ADMIN_ASSIGN_REQUEST:"/api/assignments/assign/",

    GET_DEPARTMENTS: "/api/auth/departments/",

    DRIVER_REQUESTS:"/api/assignments/driver/requests/",
    DRIVER_ACCEPT_REQUEST:"/api/assignments",
    DRIVER_DECLINE_REQUEST:"/api/assignments",
    DRIVER_COMPLETE_TRIP:"/api/assignments",
    DRIVER_COMPLETED_TRIPS:"/api/assignments/driver/completed-trips/",
    ALL_DRIVERS:"/api/vehicles/drivers/all/",

    HISTORY:"/api/request/user/history/",
    ADMIN_HISTORY:"/api/assignments/admin/history/",

    EXPORT_CSV:"/api/vehicles/vehicles/history",
}


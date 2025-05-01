export const API_BASE_URL = "http://127.0.0.1:8000/api"; 

export const API_ENDPOINTS = {
    // Authentication Endpoints
    LOGIN: "/auth/login/",
    LOGOUT: "/auth/logout/",
    PROFILE: "/auth/profile/",

    // User Management Endpoints
    GENERATE_PASSWORD: "/auth/auth/generate-password/",
    REGEISTER_USER: "/auth/superadmin/register/",
    USERS_LIST: "/auth/users/",
    EDTI_USER: "auth/users",
    DELETE_USER: "/auth/users",
    
    // Vehicle Management Endpoints
    ADD_VEHICLE:"/vehicles/vehicles/add/",
    GET_VEHICLE:"/vehicles/vehicles/list/",
    GET_DRIVERS:"/vehicles/drivers/unassigned/",
    VEHICLE_REQUEST:"/request/requests/",
    REQUESTS_FOR_DIRECTOR:"/request/requests/pending/",
    APPROVE_REQUEST:"/request/requests",
    APPROVE_REQUEST_BY_ID:"approve/",
    REJECT_REQUEST:"/request/requests",
    REJECT_REQUEST_BY_ID:"reject/",

    APPROVE_REQUEST_BY_DIRECTOR:"/request/requests/list/",

    // Admin Endpoints
    ADMIN_REQUESTS:"/request/requests/list/",
    ADMIN_REJECT_REQUEST:"/assignments/reject/",
    ADMIN_ASSIGN_REQUEST:"/assignments/assign/",

    GET_DEPARTMENTS:"/auth/departments/",

    // Driver Endpoints
    DRIVER_REQUESTS:"/assignments/driver/requests/",
    DRIVER_ACCEPT_REQUEST:"/assignments",
    DRIVER_DECLINE_REQUEST:"/assignments",
    DRIVER_COMPLETE_TRIP:"/assignments",
    DRIVER_COMPLETED_TRIPS:"/assignments/driver/completed-trips/",
}


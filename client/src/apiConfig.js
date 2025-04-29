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
    VEHICLE_REQUEST:"/request/requests/",
    REQUESTS_FOR_DIRECTOR:"/request/requests/pending/",
}


import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: Missing credentials" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { vehicleId, driverId } = await request.json();

        const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.ASSIGN_DRIVER}`,
            {
                vehicle_id: vehicleId,
                driver_id: driverId,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        return new Response(JSON.stringify(response.data), {
            status: response.status,
        });
    } catch (error) {
        const errorMessage =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            "An unexpected error occurred.";

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: error.response?.data || "No additional details",
            }),
            { status: error.response?.status || 500 }
        );
    }
} 
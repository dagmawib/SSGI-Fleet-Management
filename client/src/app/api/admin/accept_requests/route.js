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

        const { start_mileage, assignment_id } = await request.json();

        if (!assignment_id || start_mileage === undefined) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: assignment_id and start_mileage" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.DRIVER_ACCEPT_REQUEST}/${assignment_id}/accept/`,
            {
                start_mileage: start_mileage,
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
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        const errorMessage =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message ||
            "An unexpected error occurred.";

        console.error("Error accepting request:", errorMessage);
        console.error("Error details:", error.response?.data);

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: error.response?.data || "No additional details",
            }),
            { status: error.response?.status || 500, headers: { "Content-Type": "application/json" } }
        );
    }
}


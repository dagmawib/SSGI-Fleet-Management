import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export async function PATCH(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: Missing credentials" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { trip_id, end_mileage } = body;

        if (!trip_id || !end_mileage) {
            return new Response(
                JSON.stringify({ error: "Trip ID and end mileage are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Use the admin-specific endpoint
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.ADMIN_COMPLETE_TRIP}/${trip_id}/complete/`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ end_mileage }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return new Response(
                JSON.stringify({ error: errorData.error || "Failed to complete trip" }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error completing trip:', error);
        return new Response(
            JSON.stringify({
                error: "An unexpected error occurred while completing the trip",
                details: error.message
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}


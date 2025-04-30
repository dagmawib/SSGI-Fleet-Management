import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: Missing credentials" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.APPROVE_REQUEST_BY_DIRECTOR}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return new Response(
                JSON.stringify({ error: errorData.error || "Failed to fetch requests" }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        return new Response(
            JSON.stringify({
                error: "An unexpected error occurred while fetching requests",
                details: error.message
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
} 
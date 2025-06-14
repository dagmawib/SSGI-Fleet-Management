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
        const { request_id, reason } = body;

        if (!request_id || !reason) {
            return new Response(
                JSON.stringify({ error: "Request ID and reason are required in the request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.REJECT_REQUEST}/${request_id}/${API_ENDPOINTS.REJECT_REQUEST_BY_ID}`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ reason }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return new Response(
                JSON.stringify({ error: errorData.error || "Failed to reject request" }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error rejecting request:', error);
        return new Response(
            JSON.stringify({
                error: "An unexpected error occurred while rejecting the request",
                details: error.message
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
} 
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
        const { id } = body;

        if (!id) {
            return new Response(
                JSON.stringify({ error: "Request ID is required in the request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.APPROVE_REQUEST}/${id}/${API_ENDPOINTS.APPROVE_REQUEST_BY_ID}`,
            {
                method: 'PATCH',
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
                JSON.stringify({ error: errorData.error || "Failed to approve request" }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error approving request:', error);
        return new Response(
            JSON.stringify({
                error: "An unexpected error occurred while approving the request",
                details: error.message
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
} 
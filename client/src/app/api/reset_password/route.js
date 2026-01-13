import axios from "axios";
import { SERVER_SIDE_API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export const POST = async (req) => {
    try {
        const body = await req.json();
        const {
            new_password,
            token,
            uid
        } = body;

        if (!new_password || !token || !uid) {
            return new Response(JSON.stringify({ error: "Missing required data" }), {
                status: 400,
            });
        }

        // Prepare request body
        const requestBody = {
            new_password,
            token,
            uid
        };

        // Make the POST request to the token API
        const response = await axios.post(
            `${SERVER_SIDE_API_BASE_URL}${API_ENDPOINTS.RESET_PASSWORD}`,
            requestBody,
            {
                headers: {
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

        console.error("Password reset failed:", errorMessage);

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: error.response?.data || "No additional details",
            }),
            { status: error.response?.status || 500 }
        );
    }
};

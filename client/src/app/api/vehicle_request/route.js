import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export const POST = async (req) => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: Missing credentials" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const {
            pickup_location,
            destination,
            start_dateTime,
            end_dateTime,
            passenger_count,
            passenger_names,
            purpose,
            urgency,
        } = body;

        if (
            !pickup_location ||
            !destination ||
            !start_dateTime ||
            !end_dateTime ||
            !passenger_count ||
            !passenger_names ||
            !purpose ||
            !urgency
        ) {
            return new Response(JSON.stringify({ error: "There are missed data" }), {
                status: 400,
            });
        }

        const requestBody = {
            pickup_location,
            destination,
            start_dateTime,
            end_dateTime,
            passenger_count,
            passenger_names,
            purpose,
            urgency,
        };

        const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.VEHICLE_REQUEST}`,
            requestBody,
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
};

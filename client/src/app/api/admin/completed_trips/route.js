import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";
import axios from "axios";

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: Missing credentials" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get all completed trips (admin history)
        const response = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.ADMIN_HISTORY}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        // Transform admin history to match driver format
        const history = response.data?.history || [];
        const trips = history.map(item => ({
            trip_details: {
                pickup: item.pickup,
                destination: item.destination,
                start_mileage: null,
                end_mileage: item.total_km,
            },
            purpose: "",
            passengers: 0,
            requester: {
                name: item.requester,
                phone: "",
            },
            driver_name: item.driver,
        }));

        return new Response(JSON.stringify({ trips }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";

    console.error("Error fetching completed trips:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.response?.data || "No additional details",
        trips: [],
      }),
      { status: error.response?.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


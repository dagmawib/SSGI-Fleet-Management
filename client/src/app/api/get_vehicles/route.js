import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await axios.get(
      `${API_BASE_URL}${API_ENDPOINTS.GET_VEHICLE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Transform the response to include driver information
    const vehiclesWithDrivers = response.data.map(vehicle => ({
      ...vehicle,
      driver: vehicle.driver || { name: "Not Assigned", id: null }
    }));

    return new Response(JSON.stringify(vehiclesWithDrivers), {
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

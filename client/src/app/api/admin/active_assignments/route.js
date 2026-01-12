import { cookies } from "next/headers";
import { SERVER_SIDE_API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";
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

    // Fetch all assignments that need admin action
    // This will need to be implemented on the backend, but for now we'll use the driver endpoint structure
    // and adapt it for admin use
    const response = await axios.get(
      `${SERVER_SIDE_API_BASE_URL}/api/assignments/admin/active/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // If the endpoint doesn't exist yet, return empty array
    if (error.response?.status === 404) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error fetching active assignments:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}


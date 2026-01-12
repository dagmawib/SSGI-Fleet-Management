import { cookies } from "next/headers";
import { API_BASE_URL } from "@/apiConfig";
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

    // Get ALL active assignments for all drivers
    const response = await axios.get(
      `${API_BASE_URL}/assignments/admin/active/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return new Response(JSON.stringify(response.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";

    console.error("Error fetching all assignments:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.response?.data || "No additional details",
      }),
      { status: error.response?.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


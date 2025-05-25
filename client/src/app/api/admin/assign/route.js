import axios from "axios";
import { cookies } from "next/headers";
import { SERVER_SIDE_API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

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
      request_id,
      vehicle_id,
      note,
    } = body;

    if (
      !request_id ||
      !vehicle_id
    ) {
      return new Response(JSON.stringify({ error: "There are missed data" }), {
        status: 400,
      });
    }

    // Prepare URL-encoded request body
    const requestBody = {
        request_id,
        vehicle_id,
        note,
    };

    // Make the POST request to the backend
    const response = await axios.post(
      `${SERVER_SIDE_API_BASE_URL}${API_ENDPOINTS.ADMIN_ASSIGN_REQUEST}`,
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

    console.error("Register failed:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.response?.data || "No additional details",
      }),
      { status: error.response?.status || 500 }
    );
  }
};

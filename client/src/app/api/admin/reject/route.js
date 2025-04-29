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
      request_id,
      note,
    } = body;

    if (
      !request_id
    ) {
      return new Response(JSON.stringify({ error: "There are missed data" }), {
        status: 400,
      });
    }

    // Prepare URL-encoded request body
    const requestBody = {
        request_id,
        note,
    };

    console.log("Request Body:", requestBody);

    // Make the POST request to the token API
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_REJECT_REQUEST}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    
    console.log("Response:", response);

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

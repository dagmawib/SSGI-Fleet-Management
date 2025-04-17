import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";


export const POST = async (req) => {
  try {
    const body = await req.json();
    const { Refresh } = body;
    // Prepare URL-encoded request body
    const requestBody = {
      Refresh
    };

    // Make the POST request to the token API
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.LOGOUT}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
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

    console.error("Logout failed:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.response?.data || "No additional details",
      }),
      { status: error.response?.status || 500 }
    );
  }
};
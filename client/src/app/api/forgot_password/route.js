import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export const POST = async (req) => {
  try {
    const body = await req.json();
    const {
      email
    } = body;

    if (
      !email
    ) {
      return new Response(JSON.stringify({ error: "There are missed data" }), {
        status: 400,
      });
    }

    // Prepare URL-encoded request body
    const requestBody = {
        email
    };

    console.log("Request Body:", requestBody);
    console.log("URL:", `${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`);

    // Make the POST request to the token API
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`,
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

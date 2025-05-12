import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export const POST = async (req) => {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400 }
      );
    }

    // Prepare URL-encoded request body
    const requestBody = {
      email,
      password,
    };

    console.log("Request Body:", requestBody);
    console.log("Request URL:", `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`);
    // Make the POST request to the token API
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }
    );
    console.log("Response Data:", response);
    return new Response(JSON.stringify(response.data), {
        status: response.status,
      });
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "An unexpected error occurred.";

    console.error("Login failed:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.response?.data || "No additional details",
      }),
      { status: error.response?.status || 500 }
    );
  }
};
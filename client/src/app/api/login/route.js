import axios from "axios";
import { SERVER_SIDE_API_BASE_URL, API_ENDPOINTS } from "@/apiConfig"; // Use SERVER_SIDE_API_BASE_URL

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

    const requestBody = {
      email,
      password,
    };
    
    // Use the server-side base URL for calls from Next.js API routes to the backend
    const targetUrl = `${SERVER_SIDE_API_BASE_URL}${API_ENDPOINTS.LOGIN}`;
    console.log(`[API Route /api/login] Attempting to POST to: ${targetUrl}, Request body: ${JSON.stringify(requestBody)}`);

    // Use application/json for Django REST
    const response = await axios.post(
      targetUrl,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
  
    console.log("[API Route /api/login] Successfully received response from backend:", JSON.stringify(response.data));
    return new Response(JSON.stringify(response.data), {
        status: response.status,
      });
  } catch (error) {
    // Log the full error object structure for better debugging
    console.error("[API Route /api/login] Error during login attempt. Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    let errorMessage = "An unexpected error occurred.";
    let errorStatus = 500;
    let errorDetails = "No additional details";

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("[API Route /api/login] Error response data:", error.response.data);
      console.error("[API Route /api/login] Error response status:", error.response.status);
      // console.error("[API Route /api/login] Error response headers:", error.response.headers); // Can be verbose
      
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        (typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : errorMessage); // Handle plain string errors, truncate if too long
      errorStatus = error.response.status;
      errorDetails = error.response.data || errorDetails;
    } else if (error.request) {
      // The request was made but no response was received
      console.error("[API Route /api/login] No response received. Error request details (might be large):", error.request);
      errorMessage = "No response from server. Check network or backend service status.";
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("[API Route /api/login] Error in setting up request:", error.message);
      errorMessage = error.message || errorMessage;
    }

    console.error("[API Route /api/login] Processed error. Message:", errorMessage, "Status:", errorStatus);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails, // Send back what was received if possible
      }),
      { status: errorStatus }
    );
  }
};
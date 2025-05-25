import { cookies } from "next/headers";
import { SERVER_SIDE_API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `${SERVER_SIDE_API_BASE_URL}${API_ENDPOINTS.APPROVE_REQUEST_BY_DIRECTOR}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errorData;
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        const rawText = await response.text();
        return new Response(
          JSON.stringify({
            error: "Backend did not return JSON. Raw response:",
            details: rawText.substring(0, 500),
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: errorData.error || "Failed to fetch requests",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      return new Response(
        JSON.stringify({
          error: "Backend did not return JSON. Raw response:",
          details: rawText.substring(0, 500),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    let errorMessage = "An unexpected error occurred while fetching requests";
    let errorDetails = "No additional details";
    let status = 500;
    if (error.response) {
      if (typeof error.response.data === "object") {
        errorMessage =
          error.response.data.detail ||
          error.response.data.message ||
          errorMessage;
        errorDetails = error.response.data;
        status = error.response.status;
      } else if (typeof error.response.data === "string") {
        errorMessage = error.response.data.substring(0, 500);
        errorDetails = error.response.data;
        status = error.response.status;
      }
    } else if (error.request) {
      errorMessage = "No response from backend server.";
      errorDetails = error.request;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error("Error fetching requests:", errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
}

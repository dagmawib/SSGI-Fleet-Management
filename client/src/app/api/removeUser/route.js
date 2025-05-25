import { cookies } from "next/headers";
import { SERVER_SIDE_API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";
import axios from "axios";

export async function DELETE(req) {
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
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await axios.delete(
      `${SERVER_SIDE_API_BASE_URL}${API_ENDPOINTS.DELETE_USER}/${id}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting user:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

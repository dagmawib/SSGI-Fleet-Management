import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";
import axios from "axios";

export async function PUT(req) {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json(); // Get the request body
    const { first_name, last_name, phone_number, email, old_password, new_password } = body;

    const response = await axios.put(
      `${API_BASE_URL}${API_ENDPOINTS.PROFILE}`,
      {
        first_name,
        last_name,
        phone_number,
        email,
        old_password,
        new_password,
      },
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
    console.error("Error updating profile:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

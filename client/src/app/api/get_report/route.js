import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";
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

    const backendUrl = `${API_BASE_URL}${API_ENDPOINTS.EXPORT_CSV}`;
    const urlWithParams = req.nextUrl.search ? `${backendUrl}${req.nextUrl.search}` : backendUrl;
    
    const response = await axios.get(urlWithParams, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "arraybuffer", 
    });

    return new Response(response.data, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=vehicles_report.xlsx",
      },
    });
  } catch (error) {
    console.error("Error fetching report:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { cookies } from "next/headers";
import { API_BASE_URL, API_ENDPOINTS } from "@/apiConfig";
import axios from "axios";

export async function POST(req) {
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
    const { id, ...updateFields } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing vehicle_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validFields = [
      "driver_id",
      "category",
      "license_plate",
      "make",
      "model",
      "year",
      "color",
      "fuel_type",
      "fuel_efficiency",
      "capacity",
      "current_mileage",
      "status",
      "last_service_date",
      "next_service_mileage",
      "notes",
      "department"
    ];

    const payload = {};

    for (const key of validFields) {
      if (updateFields[key] !== undefined) {
        payload[key] = updateFields[key];
      }
    }

    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.EDIT_VEHICLE}/${id}/maintenance/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("Vehicle updated successfully:", response);

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error updating vehicle:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

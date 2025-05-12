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
      license_plate,
      make,
      model,
      year,
      color,
      capacity,
      current_mileage,
      last_service_date,
      next_service_mileage,
      fuel_type,
      fuel_efficiency,
      status,
      department,
      driver_id,
      department_id,
    } = body;

    if (
      !license_plate ||
      !make ||
      !model ||
      !year ||
      !color ||
      !capacity ||
      !current_mileage ||
      !fuel_type ||
      !status 
    ) {
      return new Response(JSON.stringify({ error: "There are missed data" }), {
        status: 400,
      });
    }

    // Prepare URL-encoded request body
    const requestBody = {
        license_plate,
        make,
        model,
        year,
        color,
        capacity,
        current_mileage,
        last_service_date,
        next_service_mileage,
        fuel_type,
        fuel_efficiency,
        status,
        department,
        driver_id,
        department_id,
    };

    // Make the POST request to the token API
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.ADD_VEHICLE}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

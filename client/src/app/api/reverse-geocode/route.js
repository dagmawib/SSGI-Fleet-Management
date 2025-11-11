import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing latitude or longitude" },
      { status: 400 }
    );
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  try {
    const response = await axios.get(nominatimUrl, {
      headers: {
        "User-Agent": "SSGI-Fleet-Management/1.0", // Nominatim requires a User-Agent header
      },
    });
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching from Nominatim:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch data from Nominatim" },
      { status: 502 } // Bad Gateway
    );
  }
}

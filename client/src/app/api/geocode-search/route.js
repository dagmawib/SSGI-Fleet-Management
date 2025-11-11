import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing search query" },
      { status: 400 }
    );
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search`;

  try {
    const response = await axios.get(nominatimUrl, {
      params: {
        q: query,
        format: "json",
        limit: 5,
        addressdetails: 1,
        countrycodes: "ET",
      },
      headers: {
        "User-Agent": "SSGI-Fleet-Management/1.0", // Nominatim requires a User-Agent header
      },
    });
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching from Nominatim search:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch data from Nominatim search" },
      { status: 502 } // Bad Gateway
    );
  }
}

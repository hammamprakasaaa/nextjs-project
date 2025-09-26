import { NextResponse } from "next/server";
import { callExternalApi } from "@/lib/api";

export async function GET(request) {
  try {
    const pathSegments = request.nextUrl.pathname.split("/").slice(3);
    const tmdbPath = "/" + pathSegments.join("/");

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());

    const data = await callExternalApi(tmdbPath, params);

    const response = NextResponse.json(data);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error("API Error:", error);

    const errorResponse = NextResponse.json(
      {
        error: "An internal server error occurred.",
        details: error.message,
      },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return errorResponse;
  }
}

export async function OPTIONS(request) {
  const response = new NextResponse(null, { status: 204 }); 
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
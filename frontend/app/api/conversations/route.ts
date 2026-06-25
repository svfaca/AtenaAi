import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export async function GET(request: NextRequest) {
  try {
    // ✅ Extrair query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "25";

    // 🔑 Extrair cookies do request
    const cookieHeader = request.headers.get("cookie");
    console.log("[/api/conversations] Cookie header received:", !!cookieHeader);

    // ✅ Proxia GET /conversations para o backend COM COOKIES
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/conversations?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // 🔑 Repassar cookies do cliente para o backend
          ...(cookieHeader && { "cookie": cookieHeader }),
        },
      }
    );

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao buscar conversas" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar conversas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

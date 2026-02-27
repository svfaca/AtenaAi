import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export async function GET(request: NextRequest) {
  try {
    // 🔑 Extrair cookies do request
    const cookieHeader = request.headers.get("cookie");
    console.log("[/api/classrooms] Cookie header received:", !!cookieHeader);

    // ✅ Proxia GET /classrooms/my para o backend COM COOKIES
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/classrooms/my`,
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
        { error: "Erro ao buscar salas" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar salas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

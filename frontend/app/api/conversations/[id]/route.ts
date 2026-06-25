import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 🔑 Extrair cookies do request
    const cookieHeader = request.headers.get("cookie");
    console.log("[/api/conversations/[id]] Cookie header received:", !!cookieHeader);

    // ✅ Proxia GET /conversations/{id} para o backend COM COOKIES
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/conversations/${id}`,
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
      if (backendResponse.status === 404) {
        return NextResponse.json(
          { error: "Conversa não encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao buscar conversa" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar conversa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // ✅ Proxia POST /conversations/{id}/messages para o backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/conversations/${id}/messages`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        );
      }
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: errorData || "Erro ao enviar mensagem" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar mensagem";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

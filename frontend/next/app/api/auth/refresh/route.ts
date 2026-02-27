import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export async function POST(request: NextRequest) {
  try {
    // ✅ REAL REFRESH TOKEN:
    // - refresh_token HttpOnly cookie é enviado automaticamente
    // - Backend valida refresh_token e gera novo access_token
    // - Rotação: Backend também gera novo refresh_token
    
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        credentials: "include",  // ✅ Envia refresh_token cookie
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return NextResponse.json(
          { error: "Refresh token inválido ou expirado. Faça login novamente." },
          { status: 401 }
        );
      }
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: errorData || "Erro ao renovar token" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    const response = NextResponse.json(
      {
        message: "Token renovado com sucesso",
        user: data.user,
      },
      { status: 200 }
    );

    // ✅ Copiar NOVOS cookies (access_token + refresh_token)
    const setCookieHeaders = backendResponse.headers.getSetCookie();
    for (const setCookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", setCookie);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao renovar token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

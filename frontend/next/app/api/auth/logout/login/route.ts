import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ Proxia para o backend
    // Nota: FormData é esperado pelo backend (OAuth2PasswordRequestForm)
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/auth/login`,
      {
        method: "POST",
        body: formData,
        credentials: "include", // Inclui cookies do backend
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: errorData || "Erro ao fazer login" },
        { status: backendResponse.status }
      );
    }

    // ✅ Parse resposta do backend
    const data = await backendResponse.json();

    // ✅ Extrair cookies da resposta do backend e propagá-los
    const response = NextResponse.json(
      {
        message: "Login bem-sucedido",
        user: data.user,
      },
      { status: 200 }
    );

    // ✅ Copiar cookies do backend para o cliente
    const setCookieHeaders = backendResponse.headers.getSetCookie();
    for (const setCookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", setCookie);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao fazer login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

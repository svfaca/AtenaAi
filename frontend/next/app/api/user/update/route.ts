import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();

    const apiUrl = process.env.API_BASE_URL || "http://localhost:8000";

    // 🔑 Extrair cookies do request do cliente
    const cookieHeader = req.headers.get("cookie");
    console.log("[/api/user/update] Cookie header received:", !!cookieHeader);

    // ✅ Repassar cookies para o backend (autenticação via cookie)
    const response = await fetch(
      `${apiUrl}/api/v1/auth/update-profile`,
      {
        method: "PUT",
        headers: {
          // Repassa cookies do cliente para o backend
          ...(cookieHeader && { "cookie": cookieHeader }),
        },
        body: formData,
        credentials: "include", // ⚠️ IMPORTANTE: Incluir cookies
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error("[/api/user/update] Backend error:", data);
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[/api/user/update] Error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}

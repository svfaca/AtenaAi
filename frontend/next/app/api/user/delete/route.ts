import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const apiUrl = process.env.API_BASE_URL || "http://localhost:8000";

    // 🔑 Extrair cookies do request do cliente
    const cookieHeader = req.headers.get("cookie");
    console.log("[/api/user/delete] Cookie header received:", !!cookieHeader);

    // ✅ Repassar cookies para o backend (autenticação via cookie)
    const response = await fetch(
      `${apiUrl}/api/v1/auth/delete-account`,
      {
        method: "DELETE",
        headers: {
          // Repassa cookies do cliente para o backend
          ...(cookieHeader && { "cookie": cookieHeader }),
        },
        credentials: "include", // ⚠️ IMPORTANTE: Incluir cookies
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error("[/api/user/delete] Backend error:", data);
      return NextResponse.json(
        { error: data.detail || "Erro ao deletar conta" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[/api/user/delete] Error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar conta" },
      { status: 500 }
    );
  }
}

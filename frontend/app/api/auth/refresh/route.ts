import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/lib/server/proxy'

export async function POST(request: NextRequest) {
  const response = await proxy(request, '/api/v1/auth/refresh')

  if (!response.ok) {
    return response
  }

  const data = await response.json()
  
  return NextResponse.json(
    {
      message: 'Token renovado com sucesso',
      user: data.user,
    },
    { status: 200 }
  )
}
    );

    // ✅ Copiar NOVOS cookies (access_token + refresh_token)
    const setCookieHeaders = backendResponse.headers.getSetCookie();
    for (const setCookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", setCookie);
    }

    response.cookies.set("atena_session_hint", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao renovar token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

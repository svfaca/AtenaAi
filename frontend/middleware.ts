import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value
  const refreshToken = req.cookies.get("refresh_token")?.value

  // 🔒 Sessão contínua para usuários logados: permite navegação enquanto
  // houver QUALQUER cookie de autenticação. O access_token expira em 8h e o
  // navegador o remove, mas o refresh_token (14 dias deslizante) mantém o
  // usuário logado — sem ele, o usuário era jogado para "/" mesmo com a
  // sessão válida.
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // 🔒 Protege as áreas autenticadas canônicas (/scholar e /teacher).
    // As rotas legadas (/estudante, /professor, /sala, /app-area) foram
    // removidas — não existem mais páginas para elas.
    "/scholar/:path*",
    "/teacher/:path*",
  ],
}

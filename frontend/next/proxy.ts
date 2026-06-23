import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'access_token';

// Rotas públicas que não requerem autenticação
const PUBLIC_PATHS = ['/about', '/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`[middleware] Request to: ${pathname}`);

  // ========================================
  // 🚫 Permitir assets estáticos
  // ========================================
  if (pathname.startsWith('/_next') || pathname.startsWith('/public')) {
    console.log(`[middleware] Allowing static asset: ${pathname}`);
    return NextResponse.next();
  }

  // ========================================
  // ✅ Verificar se é rota pública
  // ========================================
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log(`[middleware] Public path allowed: ${pathname}`);
    return NextResponse.next();
  }

  // ========================================
  // 🔒 Buscar token de autenticação do cookie HttpOnly
  // ========================================
  const authCookie = request.cookies.get(ACCESS_TOKEN_COOKIE);

  if (!authCookie?.value) {
    console.warn(`[middleware] No access_token for ${pathname}, redirecting to /`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log(`[middleware] Token found for ${pathname}, allowing access`);

  try {
    // ⚠️ Token JWT não pode ser decodificado no middleware
    // Confiamos que o token é válido se existir no cookie
    // A validação real acontece no servidor (server-api.ts)

    // ✅ Token existe e é válido - permitir acesso
    // A validação de role acontece nos server components
    return NextResponse.next();
  } catch (error) {
    console.error('[middleware] Error:', error);
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    return response;
  }
}

export const config = {
  matcher: [
    // Rotas protegidas (Next.js)
    "/scholar",
    "/scholar/:path*",
    "/teacher",
    "/teacher/:path*",
    "/admin",
    "/admin/:path*",
    // Rotas legadas (vanilla JS)
    "/estudante",
    "/estudante/:path*",
    "/sala/:path*"
  ]
};

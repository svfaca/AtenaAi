import { cookies } from 'next/headers';
import type { Session, AuthUser, Role } from '@/lib/types/auth';

const ACCESS_TOKEN_COOKIE = 'access_token';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 horas

interface SessionData {
  user: AuthUser;
  expiresAt: number;
}

/**
 * Obtém a sessão atual do usuário via cookies HttpOnly
 * ✅ Lê o token JWT do cookie 'access_token'
 * ✅ Chama /api/auth/me para recuperar dados reais do usuário
 * ✅ Retorna session com name, email, avatar, etc.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(ACCESS_TOKEN_COOKIE);

    // Se não há token, não há sessão
    if (!tokenCookie?.value) {
      console.log('[getSession] No access token found');
      return null;
    }

    // Construir URL absoluta para o servidor Next.js
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const meUrl = `${appUrl}/api/auth/me`;

    console.log('[getSession] Fetching from:', meUrl);

    // Chamar /api/auth/me para recuperar dados reais do usuário
    const response = await fetch(meUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Passar o cookie no header Cookie
        'Cookie': `${ACCESS_TOKEN_COOKIE}=${tokenCookie.value}`,
      },
      // Não usar credentials em server-side, pois já estamos passando o cookie manualmente
    });

    console.log('[getSession] Response status:', response.status);

    if (!response.ok) {
      console.log('[getSession] Response not ok:', response.status);
      return null;
    }

    const data = await response.json();
    
    console.log('[getSession] User data received:', {
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.name,
      role: data.user?.role,
    });

    return {
      userId: data.user?.id || 'unknown',
      email: data.user?.email || 'unknown',
      name: data.user?.name || 'Usuário',
      role: data.user?.role as Role || ('student' as const),
      avatar: data.user?.avatar || undefined,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('[getSession] Error:', error);
    return null;
  }
}

/**
 * Valida se o usuário é autenticado
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/**
 * Valida se o usuário tem um role específico
 */
export async function requireRole(role: Role | Role[]): Promise<Session> {
  const session = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(session.role)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

/**
 * Define a sessão no cookie HttpOnly (Server Action)
 * ⚠️ LEGADO - Preferir usar /api/auth/login route handler
 */
export async function setSessionCookie(user: AuthUser): Promise<void> {
  // Esta função é legado. O novo fluxo usa access_token cookie via route handler
  console.warn('[session.ts] setSessionCookie é legado, use /api/auth/login');
}

/**
 * Remove a sessão
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

/**
 * ✅ REAL REFRESH TOKEN IMPLEMENTATION:
 * 
 * 1. Access Token: 8 horas (SHORT)
 *    - HttpOnly cookie
 *    - Usado para requests
 * 
 * 2. Refresh Token: 14 dias (LONG)
 *    - HttpOnly cookie
 *    - Usado para renovar access token
 *    - Rotacionado a cada refresh
 * 
 * 3. On 401: Automático
 *    - Chama POST /api/auth/refresh
 *    - Envia refresh_token cookie
 *    - Backend gera novo access_token + novo refresh_token
 *    - Retry automático
 *    - Se falhar: logout gracioso
 * 
 * 🔒 SEGURANÇA (V5): tokens nunca são armazenados no cliente (nem memória).
 * Toda autenticação é via cookie HttpOnly (credentials: 'include').
 */

// 🔒 Controla retries para evitar loop infinito em 401
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 1;

  // ✅ IMPORTANTE: Todas as chamadas vão para /app/api/*, não para backend direto
  const isRouteHandlerPath = path.startsWith("/api/");
  const isLegacyAuthPath = path.startsWith("/auth/");
  const isLegacyDataPath = path.startsWith("/classrooms") || path.startsWith("/conversations");

  let baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  
  // 🔥 Forçar HTTPS se a URL for HTTP (Railway fornece HTTPS)
  // Isso evita Mixed Content quando o frontend está em HTTPS (Vercel)
  if (baseUrl && baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }
  
  let apiPath: string;

  if (isRouteHandlerPath || isLegacyAuthPath || isLegacyDataPath) {
    // ✅ Route Handler (/app/api/*)
    apiPath = path;
  } else {
    // ✅ Fallback para chamadas diretas (não recomendado)
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }
    apiPath = `${baseUrl}${path}`;
  }

  const normalizedPath = /^https?:\/\//i.test(apiPath)
    ? apiPath
    : apiPath.startsWith("/")
      ? apiPath
      : `/${apiPath}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(typeof options.headers === "object"
        ? (options.headers as Record<string, string>)
        : {}),
    };


    const response = await fetch(normalizedPath, {
      credentials: "include", // ✅ Inclui HttpOnly cookies automaticamente
      ...options,
      headers,
    });

    const rawText = await response.text();
    let payload: unknown;

    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = rawText;
    }

    if (!response.ok) {
      // ✅ REAL REFRESH TOKEN: Se 401, tenta renovar com refresh_token (no máximo 1 vez)
      // 🔒 NÃO tentar refresh para rotas de autenticação (login, signup, refresh)
      //    401 nessas rotas significa credenciais inválidas, não sessão expirada
      const isAuthRoute = path === "/api/auth/login" || path === "/api/auth/signup" || path === "/api/auth/refresh";
      
      if (response.status === 401 && retryCount < MAX_RETRIES && !isAuthRoute) {
        try {
          // Se já está refreshindo, aguarda a mesma promise
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }
          await refreshPromise;
          // Retry original request com novo access_token (incrementa retryCount)
          return api<T>(path, options, retryCount + 1);
        } catch {
          // Refresh falhou: logout gracioso
          window.location.href = "/";
          throw new Error("Sessão expirada. Faça login novamente.");
        }
      }

      // 🔎 Extrair mensagem de erro humano do corpo da resposta.
      // Concede precedência a campos comuns usados por backend (FastAPI `detail`)
      // e pelos route handlers do frontend (`message`).
      const message =
        typeof payload === "object" && payload !== null && typeof (payload as any).detail === "string"
          ? (payload as any).detail
          : typeof payload === "object" && payload !== null && typeof (payload as any).error === "string"
          ? (payload as any).error
          : typeof payload === "object" && payload !== null && typeof (payload as any).message === "string"
          ? (payload as any).message
          : typeof payload === "object" && payload !== null && typeof (payload as any).msg === "string"
          ? (payload as any).msg
          : typeof payload === "string"
          ? payload
          : response.statusText;

      throw new Error(String(message || "Erro ao acessar a API"));
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido na chamada da API");
  }
}

/**
 * ✅ NOVO: Renovação automática de token
 * Chamado quando um 401 é recebido
 */
export async function refreshAccessToken(): Promise<void> {
  console.log('[refreshAccessToken] Iniciando refresh...')
  
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error('[refreshAccessToken] Falhou com status:', response.status)
    throw new Error("Falha ao renovar token");
  }

  // 🔒 SEGURANÇA (V5): o refresh renova apenas cookies HttpOnly no domínio do
  // frontend (route handler /api/auth/refresh). Não há mais token em memória
  // para armazenar — reduz superfície de roubo via XSS.
}

/**
 * ✅ NOVO: Login via Route Handler
 */
export async function loginUser(email: string, password: string) {
  return api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * ✅ NOVO: Logout via Route Handler
 */
export async function logoutUser() {
  return api("/api/auth/logout", {
    method: "POST",
  });
}

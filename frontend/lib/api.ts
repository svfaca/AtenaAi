/**
 * ✅ REAL REFRESH TOKEN IMPLEMENTATION:
 * 
 * 1. Access Token: 15 minutos (SHORT)
 *    - HttpOnly cookie
 *    - Usado para requests
 * 
 * 2. Refresh Token: 7 dias (LONG)
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
 */

// 🔒 Controla retries para evitar loop infinito em 401
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// 🔑 Token store in memory (fallback quando cookies HttpOnly não funcionam)
let memoryToken: string | null = null;

export function setMemoryToken(token: string | null) {
  memoryToken = token;
}

export function getMemoryToken(): string | null {
  return memoryToken;
}

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

  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
  let baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  
  // 🔥 Forçar HTTPS em produção para evitar Mixed Content
  if (baseUrl && isProduction && baseUrl.startsWith('http://')) {
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
    // 🔥 Se temos token em memória, enviar como Bearer (fallback para cookie)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(typeof options.headers === "object"
        ? (options.headers as Record<string, string>)
        : {}),
    };

    // 🔥 Se temos token em memória, chamar backend DIRETAMENTE em vez de route handler
    // Isso evita problemas com proxy que não propaga headers corretamente
    let finalPath = normalizedPath;
    if (memoryToken && baseUrl && (path.startsWith('/api/conversations') || path.startsWith('/api/classrooms'))) {
      // Converter /api/conversations para /api/v1/conversations (rota do backend)
      const backendPath = path.replace('/api/', '/api/v1/');
      finalPath = `${baseUrl}${backendPath}`;
      headers["Authorization"] = `Bearer ${memoryToken}`;
      // Não precisa de credentials include quando chamamos backend direto com Bearer
    } else if (memoryToken) {
      headers["Authorization"] = `Bearer ${memoryToken}`;
    }

    const response = await fetch(finalPath, {
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
      if (response.status === 401 && retryCount < MAX_RETRIES) {
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

      const message =
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as any).detail === "string"
          ? (payload as any).detail
          : typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as any).error === "string"
          ? (payload as any).error
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
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Falha ao renovar token");
  }

  // 🔥 Atualizar token em memória se o refresh retornou um novo
  try {
    const data = await response.clone().json();
    if (data.access_token) {
      setMemoryToken(data.access_token);
    }
  } catch {
    // Ignorar se não conseguir parsear
  }
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

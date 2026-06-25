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

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // ✅ IMPORTANTE: Todas as chamadas vão para /app/api/*, não para backend direto
  const isAuthPath = path.startsWith("/auth/");
  const isDataPath = path.startsWith("/classrooms") || path.startsWith("/conversations");

  let apiPath: string;

  if (isAuthPath || isDataPath) {
    // ✅ Route Handler (/app/api/*)
    apiPath = path;
  } else {
    // ✅ Fallback para chamadas diretas (não recomendado)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }
    apiPath = `${baseUrl}${path}`;
  }

  const normalizedPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;

  try {
    const response = await fetch(normalizedPath, {
      credentials: "include", // ✅ Inclui HttpOnly cookies automaticamente
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(typeof options.headers === "object"
          ? (options.headers as Record<string, string>)
          : {}),
      },
    });

    const rawText = await response.text();
    let payload: unknown;

    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = rawText;
    }

    if (!response.ok) {
      // ✅ REAL REFRESH TOKEN: Se 401, tenta renovar com refresh_token
      if (response.status === 401) {
        try {
          await refreshAccessToken();
          // Retry original request com novo access_token
          return api<T>(path, options);
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

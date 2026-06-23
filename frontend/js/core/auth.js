// ⚠️ DEPRECATED: localStorage não deve ser usado para auth
// Usar ao invés: HttpOnly cookies (automático via credentials: "include")
// Veja: frontend/next/lib/api.ts para nova implementação

export function persistAuth({ token, user }) {
  // ❌ NUNCA MAIS usar localStorage para tokens
  // 🔒 Tokens agora em HttpOnly cookies
  console.warn("❌ persistAuth() deprecated. Use HttpOnly cookies em /frontend/next");
  // localStorage.setItem("access_token", token);  // REMOVIDO
  // localStorage.setItem("user", JSON.stringify(user));  // REMOVIDO
}

export function loadPersistedAuth() {
  // ❌ NUNCA MAIS ler token de localStorage
  console.warn("❌ loadPersistedAuth() deprecated. Use HttpOnly cookies em /frontend/next");
  // REMOVIDO: const token = localStorage.getItem("access_token");
  // REMOVIDO: const user = localStorage.getItem("user");
  return null;
}

export function clearPersistedAuth() {
  // ❌ Clearing localStorage não protege mais
  console.warn("❌ clearPersistedAuth() deprecated. Cookies cleared by /api/auth/logout");
  // localStorage.removeItem("access_token");  // REMOVIDO
  // localStorage.removeItem("user");  // REMOVIDO
}

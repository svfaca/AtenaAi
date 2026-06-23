/**
 * 🔐 Server-side auth utilities
 * 
 * Usado APENAS em Server Components
 * Lê HttpOnly cookies seguramente no servidor
 */

import { cookies } from "next/headers";

/**
 * Ler access token do cookie
 */
export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value || null;
}

/**
 * Ler role do usuário
 */
export async function getUserRole() {
  const cookieStore = await cookies();
  return cookieStore.get("role")?.value || null;
}

/**
 * Ler user ID
 */
export async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("user_id")?.value || null;
}

/**
 * Verificar se é autenticado
 */
export async function isAuthenticated() {
  const token = await getAccessToken();
  return !!token;
}

/**
 * Verificar se é estudante
 */
export async function isStudent() {
  const role = await getUserRole();
  return role === "student";
}

/**
 * Verificar se é professor
 */
export async function isTeacher() {
  const role = await getUserRole();
  return role === "teacher";
}

/**
 * Verificar se é admin
 */
export async function isAdmin() {
  const role = await getUserRole();
  return role === "admin";
}

/**
 * Buscar dados completos do usuário da sessão
 */
export async function getSessionUser() {
  const token = await getAccessToken();
  const role = await getUserRole();
  const userId = await getUserId();

  if (!token) return null;

  return {
    id: userId,
    role,
    isAuthenticated: true
  };
}

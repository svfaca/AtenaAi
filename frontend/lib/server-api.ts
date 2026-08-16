/**
 * 🔧 Server-side API calls
 * 
 * Usado APENAS em Server Components e Route Handlers
 * Não importar em "use client" components
 */

import { cookies } from 'next/headers';
import type { Classroom, ConversationsResponse } from "./types";

const API_BASE_URL = process.env.BACKEND_URL || "https://web-production-110f3.up.railway.app";

interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * Helper para chamar API do backend no servidor
 * ✅ Automático com cookies HttpOnly
 * ✅ Sem exposição de tokens no cliente
 * ✅ CORRIGIDO: Passa cookies manualmente (credentials: include não funciona em server)
 */
export async function serverApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // 🔑 CRÍTICO: Extrair cookies e repassar para o backend
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  if (cookieString) {
    headers.set('Cookie', cookieString);
  }

  const url = new URL(endpoint, API_BASE_URL);

  console.log(`[serverApi] Calling ${endpoint}:`, {
    url: url.toString(),
    hasCookies: !!cookieString,
  });

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
      // ⚠️ Não usar credentials em server-side, cookies já foram passados manualmente
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.detail || errorData?.message || errorMessage;
      } catch {
        // Se não conseguir fazer parsing do erro, usar mensagem padrão
      }
      console.error(`[serverApi] Error on ${endpoint}:`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[serverApi] Success on ${endpoint}:`, { dataType: typeof data });
    return data as T;
  } catch (error) {
    console.error(`[serverApi] Error calling ${endpoint}:`, error);
    throw error;
  }
}

/**
 * 📚 Buscar salas do estudante
 */
export async function getStudentClassrooms(): Promise<Classroom[]> {
  return serverApi<Classroom[]>("/api/v1/classrooms/my", {
    method: "GET"
  });
}

/**
 * 💬 Buscar conversas do estudante
 */
export async function getStudentConversations(limit = 25, offset = 0): Promise<ConversationsResponse> {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  return serverApi<ConversationsResponse>(`/api/v1/conversations?${params}`, {
    method: "GET"
  });
}

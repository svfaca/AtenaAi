/**
 * Cliente HTTP e funções de API
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function resolveUrl(path: string): string {
  // Keep App Router API routes on the same origin (e.g. /api/conversations -> localhost:3000).
  if (path.startsWith('/api/') && !path.startsWith('/api/v1/')) {
    return path;
  }

  return `${API_BASE}${path}`;
}

/**
 * Função unificada de API com fetch direto
 * Compatível com código existente que espera api<T>(path, options)
 */
export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(resolveUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

// Re-export ApiClient if needed for backward compatibility
export { ApiClient, apiClient } from './client';

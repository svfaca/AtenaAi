/**
 * Cliente HTTP tipado para comunicação com backend
 * Usa fetch e herda cookies automaticamente
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch wrapper que automaticamente adiciona credentials, headers padrão e trata erros
 */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  if (!res.ok) {
    let message = 'API error';

    try {
      const data = await res.json();
      message = data?.message || data?.detail || JSON.stringify(data);
    } catch {
      const text = await res.text();
      if (text) message = text;
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(headers?: Record<string, string>) {
    return {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    // Se path começa com /api/, vai para Next.js API route (não usa baseUrl)
    const url = path.startsWith('/api/') ? path : `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(options?.headers as Record<string, string>),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    // Se path começa com /api/, vai para Next.js API route (não usa baseUrl)
    const url = path.startsWith('/api/') ? path : `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    // Se path começa com /api/, vai para Next.js API route (não usa baseUrl)
    const url = path.startsWith('/api/') ? path : `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    // Se path começa com /api/, vai para Next.js API route (não usa baseUrl)
    const url = path.startsWith('/api/') ? path : `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders(options?.headers as Record<string, string>),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    // Se path começa com /api/, vai para Next.js API route (não usa baseUrl)
    const url = path.startsWith('/api/') ? path : `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      method: 'PATCH',
      credentials: 'include',
      headers: this.getHeaders(options?.headers as Record<string, string>),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

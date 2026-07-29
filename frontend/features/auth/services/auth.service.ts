import { api, setMemoryToken } from "@/lib/api"
import { LoginRequest, SignupRequest, AuthResponse } from "../types/auth.types"

type DeleteAccountPayload = {
  password: string
  confirmText: string
}

function normalizeAuthResponse(payload: any): AuthResponse {
  if (payload?.user) {
    return payload as AuthResponse
  }

  return {
    user: payload,
  }
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api<AuthResponse & { access_token?: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  })
  
  // 🔥 Armazenar token em memória como fallback para cookies HttpOnly
  if ((response as any).access_token) {
    setMemoryToken((response as any).access_token)
  }
  
  return response
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  return api<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data)
  })
}

export async function logout() {
  await api("/api/auth/logout", {
    method: "POST"
  })
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const data = await api<any>("/api/auth/me")
    return normalizeAuthResponse(data)
  } catch {
    return null
  }
}

export async function deleteAccount(payload: DeleteAccountPayload) {
  return api<{ message: string }>("/api/user/delete", {
    method: "DELETE",
    body: JSON.stringify({
      password: payload.password,
      confirm_text: payload.confirmText,
    }),
  })
}

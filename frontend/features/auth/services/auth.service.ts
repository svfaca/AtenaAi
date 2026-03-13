import { apiFetch } from "@/lib/api/client"
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
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  })
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data)
  })
}

export async function logout() {
  await apiFetch("/api/auth/logout", {
    method: "POST"
  })
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const data = await apiFetch<any>("/api/auth/me")
    return normalizeAuthResponse(data)
  } catch {
    return null
  }
}

export async function deleteAccount(payload: DeleteAccountPayload) {
  return apiFetch<{ message: string }>("/api/user/delete", {
    method: "DELETE",
    body: JSON.stringify({
      password: payload.password,
      confirm_text: payload.confirmText,
    }),
  })
}

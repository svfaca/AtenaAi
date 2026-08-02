"use client"

import { createContext, useEffect, useState } from "react"
import { mutate } from "swr"
import * as authService from "./services/auth.service"
import { AuthUser } from "./types/auth.types"
import { useChatStore } from "@/stores"
import { refreshAccessToken, setMemoryToken } from "@/lib/api"

type AuthContextType = {
  user: AuthUser | null
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const SESSION_HINT_COOKIE = "atena_session_hint=1"

function hasSessionHintCookie() {
  if (typeof document === "undefined") return false
  return document.cookie.split("; ").some((cookie) => cookie === SESSION_HINT_COOKIE)
}

function setSessionHintCookie() {
  if (typeof document === "undefined") return
  document.cookie = "atena_session_hint=1; path=/; max-age=2592000; samesite=lax"
}

function clearSessionHintCookie() {
  if (typeof document === "undefined") return
  document.cookie = "atena_session_hint=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax"
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function syncUserFromBackend() {
    const data = await authService.getCurrentUser()

    if (data?.user) {
      setUser(data.user)
      setSessionHintCookie()
      return
    }

    clearSessionHintCookie()
    setUser(null)
  }

  useEffect(() => {
    async function loadUser() {
      if (!hasSessionHintCookie()) {
        setLoading(false)
        return
      }

      try {
        // 🔥 PASSO 1: Tentar refresh para restaurar memoryToken
        // Isso garante que as chamadas API subsequentes tenham Bearer token
        console.log('[AuthProvider] Tentando refresh inicial para restaurar token...')
        try {
          await refreshAccessToken()
          console.log('[AuthProvider] Refresh inicial OK, memoryToken restaurado')
        } catch (refreshError) {
          console.warn('[AuthProvider] Refresh inicial falhou, tentando mesmo assim:', refreshError)
          // Não desistir - pode ser que o token ainda esteja válido via cookie
        }

        // 🔥 PASSO 2: Carregar dados do usuário (agora com memoryToken disponível)
        await syncUserFromBackend()
      } catch {
        clearSessionHintCookie()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  async function login(email: string, password: string): Promise<AuthUser> {
    const data = await authService.login({ email, password })
    setSessionHintCookie()
    setUser(data.user)
    useChatStore.getState().resetChat()
    
    // 🔥 O token já foi armazenado em memória pelo auth.service.login
    // Revalidate all SWR caches after login
    await mutate(() => true)
    
    return data.user
  }

  async function logout() {
    await authService.logout()
    clearSessionHintCookie()
    setMemoryToken(null) // 🔥 Limpar token em memória
    setUser(null)
    useChatStore.getState().resetChat()
  }

  async function refreshUser() {
    setLoading(true)

    try {
      await syncUserFromBackend()
    } catch {
      clearSessionHintCookie()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-slate-500">Carregando...</div>
    </div>
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

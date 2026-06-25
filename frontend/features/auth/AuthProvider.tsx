"use client"

import { createContext, useEffect, useState } from "react"
import { mutate } from "swr"
import * as authService from "./services/auth.service"
import { AuthUser } from "./types/auth.types"
import { useChatStore } from "@/stores"

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
    
    // 🔥 Revalidate all SWR caches after login
    await mutate(() => true)
    
    return data.user
  }

  async function logout() {
    await authService.logout()
    clearSessionHintCookie()
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

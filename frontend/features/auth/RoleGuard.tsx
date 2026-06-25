"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./hooks/useAuth"
import type { AuthUser } from "./types/auth.types"

type RoleGuardProps = {
  role: "student" | "teacher"
  children: React.ReactNode
}

function getRoleHomePath(role: AuthUser["role"]): string {
  if (role === "student") {
    return "/app-area/estudante"
  }

  if (role === "teacher") {
    return "/app-area/professor"
  }

  return "/"
}

export default function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      router.replace("/")
      return
    }

    if (user.role !== role) {
      router.replace(getRoleHomePath(user.role))
    }
  }, [loading, role, router, user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user || user.role !== role) {
    return null
  }

  return <>{children}</>
}

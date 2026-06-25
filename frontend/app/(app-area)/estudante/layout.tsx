import type { ReactNode } from "react"
import RoleGuard from "@/features/auth/RoleGuard"

export default function StudentAreaLayout({ children }: { children: ReactNode }) {
  return <RoleGuard role="student">{children}</RoleGuard>
}

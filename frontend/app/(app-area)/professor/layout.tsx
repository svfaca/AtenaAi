import type { ReactNode } from "react"
import RoleGuard from "@/features/auth/RoleGuard"

export default function TeacherAreaLayout({ children }: { children: ReactNode }) {
  return <RoleGuard role="teacher">{children}</RoleGuard>
}

'use client'

import PublicHeader from '@/shared/layout/PublicHeader'
import { useAuth } from '@/features/auth'
import StudentArea from '@/features/student/components/StudentArea'
import { AboutPublic } from './AboutPublic'
import { AboutStudent } from './AboutStudent'
import { AboutUser } from './AboutUser'

export function AboutPageClient() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden" suppressHydrationWarning>
        <PublicHeader />
        <main className="flex-1 overflow-y-auto">
          <AboutPublic />
        </main>
      </div>
    )
  }

  if (user.role === 'student') {
    return (
      <StudentArea userName={user.full_name || user.nickname || 'Estudante'} userAvatar={user.profile_image}>
        <main className="h-full overflow-y-auto">
          <AboutStudent />
        </main>
      </StudentArea>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" suppressHydrationWarning>
      <PublicHeader />
      <main className="flex-1 overflow-y-auto">
        <AboutUser />
      </main>
    </div>
  )
}

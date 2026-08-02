'use client'

import AppSidebar from '@/shared/layout/AppSidebar'
import SidebarFooter from '@/shared/layout/SidebarFooter'
import SidebarContent from '@/components/sidebar/SidebarContent'
import { useAboutModal } from '@/features/about'

type StudentSidebarProps = {
  userName: string
  userInitial: string
  avatarUrl?: string | null
  onCloseMobile: () => void
  onOpenSettings: () => void
  onLogout: () => void
}

/**
 * StudentSidebar - Feature layer wrapper
 *
 * Wraps AppSidebar with student-specific content (conversations, rooms)
 * and the shared SidebarFooter.
 */
export default function StudentSidebar({
  userName,
  userInitial,
  avatarUrl,
  onCloseMobile,
  onOpenSettings,
  onLogout,
}: StudentSidebarProps) {
  const { isOpen: isAboutOpen, openAbout, closeAbout } = useAboutModal()

  const handleAboutClick = () => {
    onCloseMobile()
    if (isAboutOpen) {
      closeAbout()
    } else {
      openAbout()
    }
  }

  const footerContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <SidebarFooter
      isCollapsed={isCollapsed}
      onOpenSettings={onOpenSettings}
      onLogout={onLogout}
      aboutLabel={isAboutOpen ? 'Fechar' : 'Sobre'}
      onAboutClick={handleAboutClick}
      version="v0.1.0"
    />
  )

  return (
    <AppSidebar
      userName={userName}
      userInitial={userInitial}
      userAvatar={avatarUrl}
      userRole="Estudante"
      content={({ isCollapsed }) => (
        <SidebarContent isCollapsed={isCollapsed} closeMobile={onCloseMobile} />
      )}
      footer={footerContent}
    />
  )
}
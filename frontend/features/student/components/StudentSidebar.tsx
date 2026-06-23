'use client'

import { Sidebar } from '@/components/sidebar'
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
 * Wraps the new professional Sidebar component.
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

  const footerContent = (
    <div className="space-y-2">
      <button
        onClick={onOpenSettings}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Configurações"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <span>Configurações</span>
      </button>

      <button
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        title="Sair"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <span>Sair</span>
      </button>

      <button
        onClick={handleAboutClick}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <span>{isAboutOpen ? 'Fechar' : 'Sobre'}</span>
      </button>

      <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">v0.1.0</p>
    </div>
  )

  return (
    <Sidebar
      userName={userName}
      userInitial={userInitial}
      userAvatar={avatarUrl}
      userRole="Estudante"
      footer={footerContent}
    />
  )
}

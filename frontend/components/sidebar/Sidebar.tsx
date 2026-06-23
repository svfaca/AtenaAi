'use client'

import { ReactNode } from 'react'
import { useSidebar } from './hooks/useSidebar'
import SidebarContent from './SidebarContent'

export interface SidebarProps {
  userName: string
  userInitial: string
  userAvatar?: string | null
  userRole?: string
  footer: ReactNode | ((args: { isCollapsed: boolean }) => ReactNode)
}

/**
 * Sidebar - Componente principal da sidebar
 * 
 * Responsabilidades:
 * - Layout geral da sidebar (fixed/relative)
 * - Comportamento mobile (overlay, animação)
 * - Comportamento desktop (collapse)
 * - Header com avatar/nome
 * 
 * NÃO é responsável por:
 * - Conteúdo de conversas/salas (delegado a SidebarContent)
 * - Lógica de negócio
 * - Data fetching
 * 
 * Arquitetura:
 * Sidebar (container, comportamento)
 *  → SidebarHeader (avatar, nome, collapse)
 *  → SidebarContent (conversas, salas)
 *  → SidebarFooter (perfil, logout)
 */
export default function Sidebar({
  userName,
  userInitial,
  userAvatar,
  userRole = 'Usuário',
  footer,
}: SidebarProps) {
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  const avatarUrl = userAvatar
    ? userAvatar.startsWith('http')
      ? userAvatar
      : `${API_URL}${userAvatar}`
    : null

  // Classes para comportamento responsivo
  const desktopCollapsedClass = isCollapsed ? 'md:w-16' : 'md:w-72'
  const mobileVisibilityClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full'

  return (
    <>
      {/* Overlay mobile - fecha ao clicar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-72 border-r border-gray-200 bg-gray-50
          transition-all duration-300 ease-in-out
          dark:border-gray-700 dark:bg-gray-800
          md:static md:z-30 md:translate-x-0
          ${desktopCollapsedClass}
          ${mobileVisibilityClass}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header com avatar e botão collapse */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
            <button
              onClick={toggleCollapsed}
              className="group flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {userRole}
                  </p>
                </div>
              )}
            </button>

            {/* Collapse toggle - visível apenas quando expandido */}
            {!isCollapsed && (
              <button
                onClick={toggleCollapsed}
                className="rounded p-2 text-gray-600 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Recolher sidebar"
                title="Recolher"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Conteúdo da sidebar (conversas, salas) */}
          <SidebarContent
            isCollapsed={isCollapsed}
            closeMobile={closeMobile}
          />

          {/* Footer (perfil, logout) */}
          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            {typeof footer === 'function' ? footer({ isCollapsed }) : footer}
          </div>
        </div>
      </aside>
    </>
  )
}

'use client'

import SidebarItem from './SidebarItem'

export type SidebarFooterProps = {
  isCollapsed: boolean
  onOpenSettings: () => void
  onLogout: () => void
  aboutLabel: string
  onAboutClick: () => void
  /** Ex: "v0.1.0" — só aparece quando expandido */
  version?: string
}

/**
 * SidebarFooter — shared footer used in both student & teacher sidebars.
 *
 * Renders the same three buttons (Settings, About, Logout) with consistent
 * styling via SidebarItem. The "About" label is controlled externally so
 * each role can show "Fechar" when the about modal is open.
 */
export default function SidebarFooter({
  isCollapsed,
  onOpenSettings,
  onLogout,
  aboutLabel,
  onAboutClick,
  version,
}: SidebarFooterProps) {
  return (
    <div className="space-y-2">
      <SidebarItem
        label="Configurações"
        isCollapsed={isCollapsed}
        onClick={onOpenSettings}
        icon={
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      <SidebarItem
        label={aboutLabel}
        isCollapsed={isCollapsed}
        onClick={onAboutClick}
        icon={
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <SidebarItem
        label="Sair"
        isCollapsed={isCollapsed}
        onClick={onLogout}
        isDanger
        icon={
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        }
      />

      {version && !isCollapsed && (
        <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{version}</p>
      )}
    </div>
  )
}
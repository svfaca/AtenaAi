'use client'

import { ReactNode } from 'react'

export type SidebarItemProps = {
  label: string
  icon: ReactNode
  isCollapsed: boolean
  isActive?: boolean
  isDanger?: boolean
  onClick?: () => void
}

/**
 * SidebarItem — shared sidebar button used in both student & teacher sidebars.
 *
 * Handles collapse behaviour (icon-only vs icon+label) and visual states
 * (active, danger). Extracted so the footer and navigation items look
 * identical across roles.
 */
export default function SidebarItem({
  label,
  icon,
  isCollapsed,
  isActive = false,
  isDanger = false,
  onClick,
}: SidebarItemProps) {
  const activeStyles = isActive
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    : ''
  const dangerStyles = isDanger
    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${
        isCollapsed ? 'justify-center' : 'gap-2'
      } ${isActive ? activeStyles : dangerStyles}`}
      title={label}
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className={isCollapsed ? 'hidden' : ''}>{label}</span>
    </button>
  )
}
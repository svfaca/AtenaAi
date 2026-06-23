'use client'

import { ReactNode } from 'react'

export interface SidebarFooterProps {
  isCollapsed?: boolean
  children?: ReactNode
}

/**
 * SidebarFooter - Footer da sidebar (perfil, logout)
 * 
 * Responsabilidades:
 * - Botão de perfil
 * - Botão de logout/settings
 * - Versão colapsada (apenas ícones)
 * 
 * Nota: Este é um layout wrapper
 * O conteúdo real é passado via props/children
 */
export default function SidebarFooter({
  isCollapsed,
  children,
}: SidebarFooterProps) {
  return (
    <div className="space-y-2 border-t border-gray-200 p-3 dark:border-gray-700">
      {children}
    </div>
  )
}

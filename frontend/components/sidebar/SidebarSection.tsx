'use client'

import { ReactNode, useState } from 'react'

export interface SidebarSectionProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  isCollapsed?: boolean
  defaultOpen?: boolean
}

/**
 * SidebarSection - Seção colapsável dentro da sidebar
 * 
 * Responsabilidades:
 * - Título + ícone
 * - Collapse/expand de seções
 * - Layout da seção
 * 
 * Uso:
 * <SidebarSection title="Conversas" icon="💬">
 *   <ConversationsList />
 * </SidebarSection>
 * 
 * Benefícios:
 * ✓ Padroniza layout de seções
 * ✓ Reutilizável
 * ✓ Fácil organizar sidebar
 */
export default function SidebarSection({
  title,
  icon,
  children,
  isCollapsed = false,
  defaultOpen = true,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Se sidebar colapsada, marca seção como colapsada
  if (isCollapsed) {
    return (
      <div title={title} className="flex justify-center p-3">
        <span className="text-lg">{icon}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header da seção */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <span className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {/* Conteúdo da seção */}
      {isOpen && <div className="space-y-1">{children}</div>}
    </div>
  )
}

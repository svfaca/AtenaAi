'use client'

import ConversationsList from './conversations/ConversationsList'
import RoomsList from './rooms/RoomsList'

export interface SidebarContentProps {
  isCollapsed: boolean
  closeMobile: () => void
}

/**
 * SidebarContent - Conteúdo scrollável da sidebar
 * 
 * Responsabilidades:
 * - Layout do conteúdo (scrollable)
 * - Seções (conversas, salas)
 * - Passa closeMobile para itens (fecha ao clicar)
 * 
 * Estrutura:
 * - Conversas (recentes)
 * - Salas (turmas/grupos)
 * 
 * Benefícios:
 * ✓ Fácil adicionar novas seções
 * ✓ Scroll isolado
 * ✓ Responsável apenas por layout
 */
export default function SidebarContent({
  isCollapsed,
  closeMobile,
}: SidebarContentProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600">
      <div className="space-y-4 p-3">
        {/* Seção de conversas */}
        <ConversationsList isCollapsed={isCollapsed} closeMobile={closeMobile} />

        {/* Seção de salas/turmas */}
        <RoomsList isCollapsed={isCollapsed} closeMobile={closeMobile} />
      </div>
    </div>
  )
}

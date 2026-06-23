'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/stores/useChatStore'
import SidebarSection from '../SidebarSection'
import ConversationItem from './ConversationItem'

export interface ConversationsListProps {
  isCollapsed: boolean
  closeMobile: () => void
}

/**
 * ConversationsList - Lista de conversas na sidebar
 * 
 * Responsabilidades:
 * - Fetch de conversas (hydrateConversations)
 * - Renderizar lista de ConversationItem
 * - Passar closeMobile para itens
 * 
 * State:
 * - Vem integralmente do useChatStore
 * - Sem estado duplicado aqui
 * 
 * Benefícios:
 * ✓ Single source of truth (store)
 * ✓ Carregamento automático
 * ✓ Responsável apenas por renderização
 */
export default function ConversationsList({
  isCollapsed,
  closeMobile,
}: ConversationsListProps) {
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const hydrateConversations = useChatStore((s) => s.hydrateConversations)

  // Carrega conversas na montagem
  useEffect(() => {
    hydrateConversations()
  }, [hydrateConversations])

  return (
    <SidebarSection
      title="Conversas"
      icon="💬"
      isCollapsed={isCollapsed}
      defaultOpen={true}
    >
      {conversations.length === 0 ? (
        <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          Nenhuma conversa ainda
        </p>
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              closeMobile={closeMobile}
            />
          ))}
        </div>
      )}
    </SidebarSection>
  )
}

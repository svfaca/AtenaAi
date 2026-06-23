'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Conversation } from '@/lib/types'
import { useChatStore } from '@/stores/useChatStore'
import ConversationMenu from './ConversationMenu'

export interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  closeMobile: () => void
}

/**
 * ConversationItem - Item de conversa na sidebar
 * 
 * Responsabilidades:
 * - Renderizar um item de conversa
 * - Evento de clique para abrir conversa
 * - Menu (options)
 * - Estado visual (active)
 * 
 * Interações:
 * - Clique no item: abre conversa
 * - Clique no menu (⋯): abre opções
 * 
 * Benefícios:
 * ✓ Componente simples e testável
 * ✓ Separado de lógica de lista
 * ✓ Menu desacoplado
 */
export default function ConversationItem({
  conversation,
  isActive,
  closeMobile,
}: ConversationItemProps) {
  const router = useRouter()
  const { selectConversation, hydrateMessages } = useChatStore()

  const handleClick = useCallback(async () => {
    // Seleciona conversa no store
    selectConversation(conversation)

    // Carrega mensagens
    await hydrateMessages(conversation.id)

    // Navega para chat
    router.push(`/scholar/chat?conversation_id=${conversation.id}`)

    // Fecha sidebar no mobile
    closeMobile()
  }, [conversation, selectConversation, hydrateMessages, router, closeMobile])

  return (
    <div
      className={`
        group flex items-center justify-between gap-2 rounded-lg px-3 py-2
        transition-colors duration-200
        ${
          isActive
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      {/* Botão para abrir conversa */}
      <button
        onClick={handleClick}
        className="min-w-0 flex-1 truncate text-left text-sm font-medium"
        title={conversation.title}
      >
        {conversation.title}
      </button>

      {/* Menu (ações: renomear, duplicar, excluir) */}
      <ConversationMenu conversation={conversation} />
    </div>
  )
}

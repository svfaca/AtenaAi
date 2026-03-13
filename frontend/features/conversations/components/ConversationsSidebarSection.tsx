'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useChat } from '@/features/chat/hooks'
import SidebarConversations from '@/features/student/components/SidebarConversations'

type ConversationsSidebarSectionProps = {
  isCollapsed: boolean
}

/**
 * ConversationsSidebarSection - Feature component
 *
 * Responsibilities:
 * - Consume chat state via hook/store
 * - Handle sidebar conversation interactions
 * - Render presentation component (SidebarConversations)
 */
export default function ConversationsSidebarSection({
  isCollapsed,
}: ConversationsSidebarSectionProps) {
  const [query, setQuery] = useState('')

  const {
    conversations,
    activeConversationId,
    hydrateConversations,
    startNewConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    duplicateConversation,
  } = useChat()

  useEffect(() => {
    void hydrateConversations()
  }, [hydrateConversations])

  const handleNewConversation = async () => {
    try {
      startNewConversation()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar conversa')
    }
  }

  const handleSelectConversation = async (conversationId: number) => {
    try {
      await selectConversation(conversationId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir conversa')
    }
  }

  const handleRenameConversation = async (conversationId: number, newTitle: string) => {
    try {
      await renameConversation(conversationId, newTitle)
      toast.success('Conversa renomeada com sucesso')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao renomear conversa')
    }
  }

  const handleDuplicateConversation = async (conversationId: number) => {
    try {
      await duplicateConversation(conversationId)
      toast.success('Conversa duplicada com sucesso')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao duplicar conversa')
    }
  }

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await deleteConversation(conversationId)
      toast.success('Conversa excluída com sucesso')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir conversa')
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filteredConversations = normalizedQuery
    ? conversations.filter((conversation) =>
        conversation.title.toLowerCase().includes(normalizedQuery),
      )
    : conversations

  return (
    <SidebarConversations
      conversations={filteredConversations}
      searchQuery={query}
      onSearchQueryChange={setQuery}
      activeConversationId={activeConversationId}
      isCollapsed={isCollapsed}
      onNewConversation={handleNewConversation}
      onSelectConversation={handleSelectConversation}
      onRenameConversation={handleRenameConversation}
      onDuplicateConversation={handleDuplicateConversation}
      onDeleteConversation={handleDeleteConversation}
    />
  )
}

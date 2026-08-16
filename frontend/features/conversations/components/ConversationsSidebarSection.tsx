'use client'

import { useEffect, useState, useCallback } from 'react'
import { useChat } from '@/features/chat/hooks'
import { useAboutModal } from '@/features/about'
import { useNavigationState } from '@/features/navigation/hooks/useNavigationState'
import { useNotification } from '@/lib/hooks/useNotification'
import { useUIStore } from '@/stores'
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
  const { closeAbout } = useAboutModal()
  const { success, error: errorToast } = useNotification()
  const navigationState = useNavigationState()
  const closeMobileSidebar = useUIStore((state) => state.closeMobileSidebar)

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

  // ✅ Estabiliza a função para evitar re-renders infinitos
  const stableHydrate = useCallback(() => hydrateConversations(), [hydrateConversations])

  useEffect(() => {
    void stableHydrate()

    // 🔄 Sincronização automática entre dispositivos/abas.
    // Antes, a sidebar só buscava as conversas NA MONTAGEM — se o usuário
    // criasse conversas em outro dispositivo (ex: celular) ou outra aba,
    // elas não apareciam até recarregar a página. Agora a lista é atualizada:
    // - A cada 30s enquanto a página estiver aberta (polling leve)
    // - Quando a janela/aba volta ao foco (voltar de outra aba/dispositivo)
    const REFRESH_INTERVAL_MS = 30_000

    const intervalId = window.setInterval(() => {
      void stableHydrate()
    }, REFRESH_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void stableHydrate()
      }
    }

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [stableHydrate])

  const handleNewConversation = async () => {
    closeAbout()
    // Fechar a sidebar mobile ao navegar (mesmo se já estiver em nova conversa)
    closeMobileSidebar()
    try {
      // Fechar sala automaticamente ao iniciar conversa
      if (navigationState.viewType === 'classroom') {
        navigationState.clearSelection()
      }
      // Iniciar nova conversa usando novo estado unificado
      navigationState.selectNewConversation()
      // Manter compatibilidade com o chat store
      startNewConversation()
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Erro ao iniciar conversa')
    }
  }

  const handleSelectConversation = async (conversationId: number) => {
    closeAbout()
    // Fechar a sidebar mobile ao navegar
    closeMobileSidebar()
    try {
      // Fechar sala automaticamente ao selecionar conversa
      if (navigationState.viewType === 'classroom') {
        navigationState.clearSelection()
      }
      // Abrir conversa usando novo estado unificado
      navigationState.selectConversation(conversationId)
      // Manter compatibilidade com o chat store
      await selectConversation(conversationId)
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Erro ao abrir conversa')
    }
  }

  const handleRenameConversation = async (conversationId: number, newTitle: string) => {
    try {
      await renameConversation(conversationId, newTitle)
      success('Conversa renomeada com sucesso')
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Erro ao renomear conversa')
    }
  }

  const handleDuplicateConversation = async (conversationId: number) => {
    try {
      await duplicateConversation(conversationId)
      success('Conversa duplicada com sucesso')
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Erro ao duplicar conversa')
    }
  }

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await deleteConversation(conversationId)
      success('Conversa excluída com sucesso')
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Erro ao excluir conversa')
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

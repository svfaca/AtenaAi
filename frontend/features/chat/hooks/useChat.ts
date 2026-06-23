'use client'

import { useCallback, useMemo } from 'react'
import { useChatStore } from '@/stores'
import type { Conversation } from '@/lib/types'

export function useChat() {
  const conversations = useChatStore((state) => state.conversations)
  const messagesByConversationId = useChatStore((state) => state.messagesByConversationId)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const loadingConversation = useChatStore((state) => state.loadingConversation)
  const sendingMessage = useChatStore((state) => state.sendingMessage)
  const streamingMessage = useChatStore((state) => state.streamingMessage)

  const hydrateConversations = useChatStore((state) => state.hydrateConversations)
  const createConversation = useChatStore((state) => state.createConversation)
  const startNewConversation = useChatStore((state) => state.startNewConversation)
  const hydrateMessages = useChatStore((state) => state.hydrateMessages)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId)
  
  const renameConversation = useChatStore((state) => state.renameConversation)
  const deleteConversation = useChatStore((state) => state.deleteConversation)
  const duplicateConversation = useChatStore((state) => state.duplicateConversation)

  const messages = useMemo(() => {
    if (!activeConversationId) return []
    return messagesByConversationId[activeConversationId] ?? []
  }, [activeConversationId, messagesByConversationId])

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null
    return conversations.find((conversation) => conversation.id === activeConversationId) ?? null
  }, [activeConversationId, conversations])

  const selectConversation = useCallback(
    async (conversation: Conversation | number | null) => {
      if (!conversation) {
        setActiveConversationId(null)
        return
      }

      const conversationId = typeof conversation === 'number' ? conversation : conversation.id
      setActiveConversationId(conversationId)

      await hydrateMessages(conversationId)
    },
    [hydrateMessages, setActiveConversationId]
  )

  const conversationTitle = activeConversation?.title || 'Nova conversa'

  return {
    conversations,
    messages,
    activeConversation,
    activeConversationId,
    conversationTitle,
    loadingConversation,
    sendingMessage,
    streamingMessage,
    hydrateConversations,
    createConversation,
    startNewConversation,
    hydrateMessages,
    sendMessage,
    selectConversation,
    renameConversation,
    deleteConversation,
    duplicateConversation,
  }
}

'use client'

import { create } from 'zustand'
import type { Conversation } from '@/lib/types'
import type { Message } from '@/lib/types'
import {
  createConversation as createConversationApi,
  getConversation,
  listConversations,
  sendConversationMessage,
  streamConversationMessage,
  renameConversation as renameConversationApi,
  deleteConversation as deleteConversationApi,
  duplicateConversation as duplicateConversationApi,
} from '@/features/chat/services/chat.service'

export type ChatMessageStatus = 'sending' | 'streaming' | 'done' | 'error'

export type ChatStoreMessage = Omit<Message, 'id'> & {
  id: number | string
  status: ChatMessageStatus
}

interface ChatState {
  conversations: Conversation[]
  messagesByConversationId: Record<number, ChatStoreMessage[]>
  activeConversationId: number | null
  // Backward-compatible alias used by existing components.
  selectedConversationId: number | null

  loadingConversation: boolean
  sendingMessage: boolean
  streamingMessage: boolean

  hydrateConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<Conversation>
  hydrateMessages: (conversationId: number) => Promise<void>
  sendMessage: (text: string) => Promise<boolean>
  appendAssistantToken: (conversationId: number, token: string) => void
  finishAssistantMessage: (conversationId: number) => void

  setActiveConversationId: (conversationId: number | null) => void
  selectConversation: (conversation: Conversation | null) => void
  clearConversation: () => void
  startNewConversation: () => void
  resetChat: () => void
  
  renameConversation: (conversationId: number, title: string) => Promise<void>
  deleteConversation: (conversationId: number) => Promise<void>
  duplicateConversation: (conversationId: number) => Promise<void>
}

function normalizeConversationId(value: unknown): number | null {
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConversationId: {},
  activeConversationId: null,
  selectedConversationId: null,

  loadingConversation: false,
  sendingMessage: false,
  streamingMessage: false,

  hydrateConversations: async () => {
    const data = await listConversations()
    const items = Array.isArray(data?.items) ? data.items : []

    // Frontend ordenação segura - garante ordem mesmo que backend falhe
    const sorted = items.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
      return dateB - dateA  // DESC: mais recentes primeiro
    })

    set({ conversations: sorted })
  },

  createConversation: async (title = 'Nova conversa') => {
    const created = await createConversationApi(title)
    const createdId = normalizeConversationId(created?.id)

    if (createdId === null) {
      throw new Error('Resposta invalida ao criar conversa')
    }

    const normalizedConversation: Conversation = {
      ...created,
      id: createdId,
    }

    set((state) => ({
      conversations: [normalizedConversation, ...state.conversations],
      activeConversationId: createdId,
      selectedConversationId: createdId,
    }))

    return normalizedConversation
  },

  hydrateMessages: async (conversationId) => {
    set({ loadingConversation: true })

    try {
      const data = await getConversation(conversationId)
      const messages = Array.isArray(data?.messages)
        ? data.messages.map((message) => ({ ...message, status: 'done' as const }))
        : []

      set((state) => ({
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: messages,
        },
      }))
    } finally {
      set({ loadingConversation: false })
    }
  },

  sendMessage: async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return false

    set({ sendingMessage: true })

    try {
      let conversationId = get().activeConversationId
      if (!conversationId) {
        const title = trimmed.slice(0, 60)
        const created = await get().createConversation(title)
        conversationId = created.id
        // ✅ Não precisa hydrate - createConversation já adiciona no topo
      }

      if (!conversationId) {
        throw new Error('Conversa ativa nao encontrada')
      }

      const tmpUserId = `tmp-user-${Date.now()}`
      const tmpAssistantId = `tmp-assistant-${Date.now() + 1}`
      const nowIso = new Date().toISOString()

      // Adiciona mensagem do usuário e placeholder vazio para o assistant
      set((state) => {
        const current = state.messagesByConversationId[conversationId!] ?? []

        return {
          streamingMessage: true,
          messagesByConversationId: {
            ...state.messagesByConversationId,
            [conversationId!]: [
              ...current,
              {
                id: tmpUserId,
                role: 'user',
                content: trimmed,
                created_at: nowIso,
                status: 'sending',
              },
              {
                id: tmpAssistantId,
                role: 'assistant',
                content: '',
                created_at: nowIso,
                status: 'streaming',
              },
            ],
          },
        }
      })

      // 🔥 Usa streaming para receber resposta token por token
      await streamConversationMessage(conversationId, trimmed, (token) => {
        // Atualiza o conteúdo do assistant message com cada token recebido
        set((state) => {
          const current = state.messagesByConversationId[conversationId!] ?? []
          const updated = current.map((message) => {
            if (message.id === tmpAssistantId) {
              return {
                ...message,
                content: message.content + token,
                status: 'streaming' as const,
              }
            }
            return message
          })

          return {
            messagesByConversationId: {
              ...state.messagesByConversationId,
              [conversationId!]: updated,
            },
          }
        })
      })

      // Marca mensagens como concluídas após streaming terminar
      set((state) => {
        const updated = (state.messagesByConversationId[conversationId!] ?? []).map((message) => {
          if (message.id === tmpUserId || message.id === tmpAssistantId) {
            return {
              ...message,
              status: 'done' as const,
            }
          }
          return message
        })

        // 🎯 Move conversa para o topo da lista imediatamente
        const targetConv = state.conversations.find(c => c.id === conversationId!)
        const conversations = targetConv
          ? [
              { ...targetConv, updated_at: new Date().toISOString() },
              ...state.conversations.filter(c => c.id !== conversationId!)
            ]
          : state.conversations

        return {
          streamingMessage: false,
          conversations,
          messagesByConversationId: {
            ...state.messagesByConversationId,
            [conversationId!]: updated,
          },
        }
      })

      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      set({ streamingMessage: false })
      return false
    } finally {
      set({ sendingMessage: false })
    }
  },

  appendAssistantToken: (conversationId, token) => {
    set((state) => {
      const current = state.messagesByConversationId[conversationId] ?? []
      const lastAssistantIdx = [...current]
        .reverse()
        .findIndex((message) => message.role === 'assistant')

      if (lastAssistantIdx === -1) return state

      const targetIndex = current.length - 1 - lastAssistantIdx
      const updated = [...current]
      const target = updated[targetIndex]

      updated[targetIndex] = {
        ...target,
        content: `${target.content}${token}`,
        status: 'streaming',
      }

      return {
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: updated,
        },
      }
    })
  },

  finishAssistantMessage: (conversationId) => {
    set((state) => {
      const current = state.messagesByConversationId[conversationId] ?? []
      const updated = current.map((message, idx) => {
        if (message.role !== 'assistant' || idx !== current.length - 1) {
          return message
        }

        return {
          ...message,
          status: 'done' as const,
        }
      })

      return {
        streamingMessage: false,
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: updated,
        },
      }
    })
  },

  setActiveConversationId: (conversationId) =>
    set({
      activeConversationId: conversationId,
      selectedConversationId: conversationId,
    }),

  selectConversation: (conversation) =>
    set({
      activeConversationId: conversation?.id ?? null,
      selectedConversationId: conversation?.id ?? null,
    }),

  clearConversation: () =>
    set({ activeConversationId: null, selectedConversationId: null }),

  startNewConversation: () =>
    set({
      activeConversationId: null,
      selectedConversationId: null,
      messagesByConversationId: {},
    }),

  resetChat: () =>
    set({
      conversations: [],
      messagesByConversationId: {},
      activeConversationId: null,
      selectedConversationId: null,
      loadingConversation: false,
      sendingMessage: false,
      streamingMessage: false,
    }),

  renameConversation: async (conversationId, title) => {
    await renameConversationApi(conversationId, title)

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, title } : c
      ),
    }))
  },

  deleteConversation: async (conversationId) => {
    await deleteConversationApi(conversationId)

    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      activeConversationId:
        state.activeConversationId === conversationId ? null : state.activeConversationId,
      selectedConversationId:
        state.selectedConversationId === conversationId ? null : state.selectedConversationId,
    }))
  },

  duplicateConversation: async (conversationId) => {
    const newConv = await duplicateConversationApi(conversationId)

    set((state) => ({
      conversations: [newConv, ...state.conversations],
    }))
  },
}))


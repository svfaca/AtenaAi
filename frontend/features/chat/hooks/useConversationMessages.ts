'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import type { Conversation } from '@/lib/types'

const CONVERSATIONS_ENDPOINT = '/api/v1/conversations'

export interface ConversationDetailResponse {
  conversation: Conversation
  messages: Array<{
    id: number
    role: 'user' | 'assistant'
    content: string
    created_at?: string
  }>
}

export function useConversationMessages(conversationId: number | null) {
  const { data, error, mutate, isLoading } = useSWR(
    conversationId ? `${CONVERSATIONS_ENDPOINT}/${conversationId}` : null,
    (url) => api<ConversationDetailResponse>(url)
  )

  return {
    messages: data?.messages ?? [],
    conversation: data?.conversation ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

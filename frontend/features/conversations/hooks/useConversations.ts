'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import type { Conversation } from '@/lib/types'

const CONVERSATIONS_ENDPOINT = '/api/conversations'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeConversation(raw: unknown): Conversation | null {
  if (!isRecord(raw)) return null

  const nested = isRecord(raw.conversation) ? raw.conversation : null
  const rawId = raw.id ?? raw.conversation_id ?? nested?.id
  const numericId = rawId === null || rawId === undefined ? NaN : Number(rawId)

  if (!Number.isFinite(numericId)) return null

  return {
    ...(raw as unknown as Conversation),
    ...(nested as Partial<Conversation>),
    id: numericId,
  } as Conversation
}

export function useConversations() {
  const { data, error, mutate, isLoading } = useSWR(
    CONVERSATIONS_ENDPOINT,
    (url) => api<{ items: Conversation[] }>(url)
  )

  // Normalize conversations from API response
  const rawList = Array.isArray(data?.items) ? data.items : []
  const conversations = rawList
    .map(normalizeConversation)
    .filter((conv): conv is Conversation => conv !== null)

  return {
    conversations,
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

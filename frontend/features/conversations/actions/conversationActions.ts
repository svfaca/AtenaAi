/**
 * Conversation Actions - Correct synchronization patterns
 *
 * CRITICAL: These patterns ensure SWR cache, Zustand store, and UI stay in sync
 *
 * Architecture:
 * - SWR: Source of truth for SERVER data (list, details)
 * - Zustand: Source of truth for CLIENT selection (which conversation ID is active)
 * - API: Single source of mutations
 *
 * Flow:
 * 1. User action → API call
 * 2. API success → mutate SWR cache
 * 3. SWR updates → UI re-renders
 * 4. Update Zustand if needed (selection state)
 */

import { useChatStore } from '@/stores'
import { api } from '@/lib/api'
import type { Conversation } from '@/lib/types'
import { useSWRConfig } from 'swr'

const CONVERSATIONS_ENDPOINT = '/api/conversations'

type ConversationCreateResponse = Conversation | { conversation: Conversation }

/**
 * ✅ CORRECT: Create new conversation
 *
 * Sync flow:
 * 1. API creates conversation
 * 2. Mutate SWR cache (add to list)
 * 3. Select new conversation in store
 * 4. UI updates automatically
 */
export async function createConversation(
  mutate: ReturnType<typeof useSWRConfig>['mutate']
) {
  try {
    // 1. API call
    const createResponse = await api<ConversationCreateResponse>(CONVERSATIONS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ title: 'Nova conversa' }),
    })

    const newConversation = 'conversation' in createResponse
      ? createResponse.conversation
      : createResponse

    // 2. Optimistic update SWR cache
    await mutate(
      CONVERSATIONS_ENDPOINT,
      (currentData: any) => {
        if (!currentData) return { items: [newConversation], total: 1 }
        const items = Array.isArray(currentData) ? currentData : currentData.items || []
        return {
          items: [newConversation, ...items],
          total: items.length + 1,
        }
      },
      { revalidate: false } // Skip revalidation, we have fresh data
    )

    // 3. Select new conversation
    const { selectConversation } = useChatStore.getState()
    selectConversation(newConversation)

    // 4. UI updates automatically via SWR + Zustand
    return newConversation
  } catch (error) {
    console.error('[createConversation] Error:', error)
    throw error
  }
}

/**
 * ✅ CORRECT: Delete conversation
 *
 * Sync flow:
 * 1. API deletes conversation
 * 2. Mutate SWR cache (remove from list)
 * 3. If deleted conversation was selected, clear selection
 * 4. UI updates automatically
 */
export async function deleteConversation(
  conversationId: number,
  mutate: ReturnType<typeof useSWRConfig>['mutate']
) {
  const { selectedConversationId, clearConversation } = useChatStore.getState()

  try {
    // 1. API call
    await api(`${CONVERSATIONS_ENDPOINT}/${conversationId}`, {
      method: 'DELETE',
    })

    // 2. Optimistic update SWR cache
    await mutate(
      CONVERSATIONS_ENDPOINT,
      (currentData: any) => {
        if (!currentData) return { items: [] }
        const items = Array.isArray(currentData) ? currentData : currentData.items || []
        return {
          items: items.filter((c) => c.id !== conversationId),
        }
      },
      { revalidate: false }
    )

    // 3. Clear selection if this was the selected conversation
    if (selectedConversationId === conversationId) {
      clearConversation()
    }

    // 4. UI updates automatically
    return true
  } catch (error) {
    console.error('[deleteConversation] Error:', error)
    // Revalidate on error to get correct state
    mutate(CONVERSATIONS_ENDPOINT)
    throw error
  }
}

/**
 * ✅ CORRECT: Rename conversation
 *
 * Sync flow:
 * 1. API updates conversation
 * 2. Mutate SWR cache (update in list)
 * 3. If renamed conversation is selected, update selection
 * 4. UI updates automatically
 */
export async function renameConversation(
  conversationId: number,
  newTitle: string,
  mutate: ReturnType<typeof useSWRConfig>['mutate']
) {
  const { selectedConversationId, selectConversation } = useChatStore.getState()

  try {
    // 1. API call
    const updatedConversation = await api<Conversation>(
      `${CONVERSATIONS_ENDPOINT}/${conversationId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle }),
      }
    )

    // 2. Optimistic update SWR cache
    await mutate(
      CONVERSATIONS_ENDPOINT,
      (currentData: any) => {
        if (!currentData) return { items: [updatedConversation] }
        const items = Array.isArray(currentData) ? currentData : currentData.items || []
        return {
          items: items.map((c) => (c.id === conversationId ? updatedConversation : c)),
        }
      },
      { revalidate: false }
    )

    // 3. Update selection if this was the selected conversation
    if (selectedConversationId === conversationId) {
      selectConversation(updatedConversation)
    }

    // 4. UI updates automatically
    return updatedConversation
  } catch (error) {
    console.error('[renameConversation] Error:', error)
    mutate(CONVERSATIONS_ENDPOINT)
    throw error
  }
}

/**
 * ✅ CORRECT: Duplicate conversation
 *
 * Sync flow:
 * 1. API duplicates conversation
 * 2. Mutate SWR cache (add duplicate to list)
 * 3. Select duplicate conversation
 * 4. UI updates automatically
 */
export async function duplicateConversation(
  conversationId: number,
  mutate: ReturnType<typeof useSWRConfig>['mutate']
) {
  const { selectConversation } = useChatStore.getState()

  try {
    // 1. API call
    const duplicated = await api<Conversation>(
      `${CONVERSATIONS_ENDPOINT}/${conversationId}/duplicate`,
      {
        method: 'POST',
      }
    )

    // 2. Optimistic update SWR cache
    await mutate(
      CONVERSATIONS_ENDPOINT,
      (currentData: any) => {
        if (!currentData) return { items: [duplicated], total: 1 }
        const items = Array.isArray(currentData) ? currentData : currentData.items || []
        return {
          items: [duplicated, ...items],
          total: items.length + 1,
        }
      },
      { revalidate: false }
    )

    // 3. Select duplicated conversation
    selectConversation(duplicated)

    // 4. UI updates automatically
    return duplicated
  } catch (error) {
    console.error('[duplicateConversation] Error:', error)
    mutate(CONVERSATIONS_ENDPOINT)
    throw error
  }
}

/**
 * ❌ WRONG: Anti-patterns to avoid
 */

// ❌ DON'T: Update only Zustand without SWR
function badDeleteConversation_OnlyZustand(conversationId: number) {
  // ❌ PROBLEM: Sidebar still shows deleted conversation
  const { clearConversation } = useChatStore.getState();
  clearConversation();
  // Missing: mutate SWR cache
}

// ❌ DON'T: Update only SWR without Zustand
function badDeleteConversation_OnlySWR(
  conversationId: number,
  mutate: ReturnType<typeof useSWRConfig>['mutate']
) {
  mutate(
    CONVERSATIONS_ENDPOINT,
    (data: Conversation[] = []) => data.filter((c) => c.id !== conversationId)
  );
  // ❌ PROBLEM: ChatWindow still shows deleted conversation
  // Missing: clearSelectedConversation()
}

// ❌ DON'T: Call mutate without optimistic update
async function badCreateConversation_NoOptimistic(
  mutate: ReturnType<typeof useSWRConfig>['mutate']
) {
  const newConv = await api<Conversation>(CONVERSATIONS_ENDPOINT, { method: 'POST' });
  
  // ❌ PROBLEM: Causes flicker, shows stale data until refetch
  mutate(CONVERSATIONS_ENDPOINT); // Triggers full refetch
  
  // ✅ BETTER: Optimistic update
  // mutate(CONVERSATIONS_ENDPOINT, (data = []) => [newConv, ...data], { revalidate: false })
}

/**
 * 🎯 Best Practices Summary
 * 
 * 1. Always mutate SWR cache after API calls
 * 2. Use optimistic updates ({ revalidate: false }) when you have fresh data
 * 3. Update Zustand store if the mutation affects selected state
 * 4. On error, revalidate SWR to get correct state
 * 5. Let React handle UI updates (don't force re-renders)
 * 
 * Order of operations:
 * 1. API call
 * 2. Mutate SWR
 * 3. Update Zustand (if needed)
 * 4. UI updates automatically
 */

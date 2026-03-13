/**
 * EXAMPLE: How to implement handlers with correct synchronization
 * 
 * This shows the correct pattern to use conversationActions.ts
 * in your components to ensure SWR ↔ Zustand ↔ UI stay in sync
 */

'use client';

import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useUIStore, useChatStore } from '@/lib/stores';
import { useConversations } from '@/features/conversations/hooks/useConversations';
import {
  createConversation,
  deleteConversation,
  renameConversation,
  duplicateConversation,
} from '@/features/conversations/actions/conversationActions';

export default function StudentSidebarWithActions() {
  // Get SWR mutate function
  const { mutate } = useSWRConfig();
  
  // UI state
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()

  // Domain state
  const selectedConversationId = useChatStore((s) => s.selectedConversationId)
  const selectConversation = useChatStore((s) => s.selectConversation)

  // Server data (with SWR)
  const { conversations, loading } = useConversations()

  /**
   * ✅ CORRECT: Create conversation
   * - API call via action
   * - SWR cache updated
   * - Zustand store updated
   * - UI updates automatically
   */
  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation(mutate);
      toast.success('Nova conversa criada!');
      
      // Optional: Expand sidebar to show new conversation
      if (isSidebarCollapsed) {
        toggleSidebar();
      }
    } catch (error) {
      toast.error('Erro ao criar conversa');
      console.error('[handleNewConversation] Error:', error);
    }
  };

  /**
   * ✅ CORRECT: Delete conversation
   * - Confirm before delete
   * - API call via action
   * - SWR cache updated
   * - Zustand store cleared if deleted conversation was selected
   * - UI updates automatically
   */
  const handleDeleteConversation = async (conversationId: number) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    
    // Confirm deletion
    if (!confirm(`Deletar "${conversation?.title}"?`)) {
      return;
    }

    try {
      await deleteConversation(conversationId, mutate);
      toast.success('Conversa deletada');
    } catch (error) {
      toast.error('Erro ao deletar conversa');
      console.error('[handleDeleteConversation] Error:', error);
    }
  };

  /**
   * ✅ CORRECT: Rename conversation
   * - Show input modal/prompt
   * - API call via action
   * - SWR cache updated
   * - Zustand store updated if renamed conversation is selected
   * - UI updates automatically
   */
  const handleRenameConversation = async (conversationId: number) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    const newTitle = prompt('Novo título:', conversation?.title);
    
    if (!newTitle || newTitle === conversation?.title) {
      return;
    }

    try {
      await renameConversation(conversationId, newTitle, mutate);
      toast.success('Conversa renomeada');
    } catch (error) {
      toast.error('Erro ao renomear conversa');
      console.error('[handleRenameConversation] Error:', error);
    }
  };

  /**
   * ✅ CORRECT: Duplicate conversation
   * - API call via action
   * - SWR cache updated
   * - Zustand selects duplicated conversation
   * - UI updates automatically
   */
  const handleDuplicateConversation = async (conversationId: number) => {
    try {
      await duplicateConversation(conversationId, mutate);
      toast.success('Conversa duplicada');
    } catch (error) {
      toast.error('Erro ao duplicar conversa');
      console.error('[handleDuplicateConversation] Error:', error);
    }
  };

  /**
   * ✅ CORRECT: Select conversation
   * - No API call needed (client-side only)
   * - Update Zustand store
   * - ChatWindow re-renders automatically
   */
  const handleSelectConversation = (conversationId: number) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      selectConversation(conversation);
    }
  };

  return (
    <div>
      <button onClick={handleNewConversation}>
        + Nova Conversa
      </button>

      {conversations.map((conv) => (
        <div key={conv.id}>
          <button onClick={() => handleSelectConversation(conv.id)}>
            {conv.title}
          </button>
          
          <button onClick={() => handleRenameConversation(conv.id)}>
            Renomear
          </button>
          
          <button onClick={() => handleDuplicateConversation(conv.id)}>
            Duplicar
          </button>
          
          <button onClick={() => handleDeleteConversation(conv.id)}>
            Deletar
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * 📊 Data Flow Diagram
 * 
 * Create Conversation:
 * User Click
 *   ↓
 * handleNewConversation()
 *   ↓
 * createConversation(mutate)
 *   ├─ API POST /api/conversations
 *   ├─ mutate SWR cache (add to list)
 *   └─ useChatStore.selectConversation()
 *   ↓
 * UI Updates:
 *   ├─ Sidebar shows new conversation (SWR)
 *   └─ ChatWindow opens new conversation (Zustand)
 * 
 * Delete Conversation:
 * User Click
 *   ↓
 * handleDeleteConversation(id)
 *   ↓
 * deleteConversation(id, mutate)
 *   ├─ API DELETE /api/conversations/[id]
 *   ├─ mutate SWR cache (remove from list)
 *   └─ useChatStore.clearSelectedConversation() (if deleted was selected)
 *   ↓
 * UI Updates:
 *   ├─ Sidebar removes conversation (SWR)
 *   └─ ChatWindow clears if deleted conversation was open (Zustand)
 * 
 * Select Conversation:
 * User Click
 *   ↓
 * handleSelectConversation(id)
 *   ↓
 * useChatStore.selectConversation(conv)
 *   ↓
 * ChatWindow re-renders with new conversation (Zustand subscription)
 */

/**
 * ❌ COMMON MISTAKES TO AVOID
 */

// ❌ WRONG: Only updating Zustand
function badHandleDelete_OnlyStore(id: number) {
  const { clearSelectedConversation } = useChatStore.getState();
  clearSelectedConversation();
  // Problem: Conversation still shows in sidebar
  // Missing: deleteConversation(id, mutate)
}

// ❌ WRONG: Only updating SWR
function badHandleDelete_OnlySWR(id: number) {
  const { mutate } = useSWRConfig();
  mutate('/api/conversations');
  // Problem: If deleted conversation was open, ChatWindow still shows it
  // Missing: useChatStore.clearSelectedConversation()
}

// ❌ WRONG: Not using optimistic updates
async function badHandleCreate_NoOptimistic() {
  const newConv = await api('/api/conversations', { method: 'POST' });
  const { mutate } = useSWRConfig();
  mutate('/api/conversations'); // ← Triggers full refetch (slow)
  
  // Better: Use createConversation(mutate) which does optimistic update
}

// ❌ WRONG: Forgetting to handle errors
async function badHandleDelete_NoErrorHandling(id: number) {
  await deleteConversation(id, mutate);
  // Problem: If API fails, user doesn't know
  // Always wrap in try/catch and show toast
}

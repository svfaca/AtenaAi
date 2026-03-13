'use client';

import { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import RenameConversationModal from '@/components/modals/RenameConversationModal';
import DeleteConversationModal from '@/components/modals/DeleteConversationModal';
import type { Conversation } from '@/lib/types';

type SidebarConversationsProps = {
  conversations: Conversation[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  activeConversationId?: number | null;
  isCollapsed: boolean;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: number) => void;
  onRenameConversation: (conversationId: number, newTitle: string) => void;
  onDuplicateConversation: (conversationId: number) => void;
  onDeleteConversation: (conversationId: number) => void;
};

export default function SidebarConversations({
  conversations,
  searchQuery,
  onSearchQueryChange,
  activeConversationId,
  isCollapsed,
  onNewConversation,
  onSelectConversation,
  onRenameConversation,
  onDuplicateConversation,
  onDeleteConversation,
}: SidebarConversationsProps) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setActiveMenuId(null));

  const toggleMenu = useCallback((conversationId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    if (activeMenuId === conversationId) {
      setActiveMenuId(null);
      setMenuPosition(null);
      return;
    }

    // Calcular posição do menu baseado no botão
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: buttonRect.bottom + 4,
      left: buttonRect.left - 192 + buttonRect.width, // 192px = w-48
    });
    
    setActiveMenuId(conversationId);
  }, [activeMenuId]);

  const handleRename = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setRenameModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDuplicate = (conversationId: number) => {
    onDuplicateConversation(conversationId);
    setActiveMenuId(null);
  };

  const confirmRename = (newTitle: string) => {
    if (selectedConversation) {
      onRenameConversation(selectedConversation.id, newTitle);
    }
  };

  const confirmDelete = () => {
    if (selectedConversation) {
      onDeleteConversation(selectedConversation.id);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 shrink-0 px-2">
        <div className="flex items-center justify-between">
          <h3
            className={`text-xs font-bold uppercase tracking-wider text-gray-500 ${
              isCollapsed ? 'lg:hidden' : 'block'
            }`}
          >
            Conversas
          </h3>

          {!isCollapsed && (
            <button
              onClick={onNewConversation}
              className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
              aria-label="Nova conversa"
            >
              Nova conversa
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="mt-2">
            <input
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-custom">
        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={onNewConversation}
              className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label="Conversas"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M17 8h2a2 2 0 012 2v8l-4-4H7a2 2 0 01-2-2v-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
                <path
                  d="M15 3H5a2 2 0 00-2 2v8l4-4h8a2 2 0 002-2V5a2 2 0 00-2-2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">Nenhuma conversa ainda</p>
            ) : (
              conversations.map((conversation) => (
                <div key={conversation.id} className="group relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectConversation(conversation.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectConversation(conversation.id);
                      }
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-10 text-sm transition-colors ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5l-2 2V5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H9z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                    <span className="flex-1 truncate text-left">{conversation.title}</span>
                  </div>

                  <button
                    onClick={(e) => toggleMenu(conversation.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity hover:bg-gray-300 group-hover:opacity-100 dark:hover:bg-gray-600"
                    aria-label="Menu"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {activeMenuId === conversation.id && menuPosition && (
                    <div
                      ref={menuRef}
                      style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                      }}
                      className="z-[1500] w-48 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-2xl"
                    >
                      <button
                        onClick={() => handleRename(conversation)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-gray-700"
                      >
                        Renomear
                      </button>
                      <button
                        onClick={() => handleDuplicate(conversation.id)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-gray-700"
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={() => handleDelete(conversation)}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-gray-700"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <RenameConversationModal
        isOpen={renameModalOpen}
        currentTitle={selectedConversation?.title || ''}
        onClose={() => setRenameModalOpen(false)}
        onConfirm={confirmRename}
      />

      <DeleteConversationModal
        isOpen={deleteModalOpen}
        conversationTitle={selectedConversation?.title || ''}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

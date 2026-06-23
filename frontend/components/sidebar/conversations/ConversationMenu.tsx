'use client'

import { useState, useRef, useEffect } from 'react'
import type { Conversation } from '@/lib/types'
import { useChatStore } from '@/stores/useChatStore'

export interface ConversationMenuProps {
  conversation: Conversation
}

/**
 * ConversationMenu - Menu flutuante com opções de conversa
 * 
 * Responsabilidades:
 * - Renderizar botão de menu (⋯)
 * - Mostrar/esconder dropdown com opções
 * - Executar ações (renomear, duplicar, excluir)
 * - Fechar ao clicar fora
 * 
 * Opções:
 * - Renomear
 * - Duplicar
 * - Excluir (com confirmação)
 * 
 * Benefícios:
 * ✓ Desacoplado do item
 * ✓ Gerencia próprio z-index
 * ✓ Clique fora fecha automaticamente
 */
export default function ConversationMenu({ conversation }: ConversationMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { deleteConversation, duplicateConversation } = useChatStore()

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    await deleteConversation(conversation.id)
    setIsOpen(false)
    setShowDeleteConfirm(false)
  }

  const handleDuplicate = async () => {
    await duplicateConversation(conversation.id)
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Botão do menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-600"
        aria-label="Opções da conversa"
        title="Opções"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 12a2 2 0 11-4 0 2 2 0 014 0Zm6 0a2 2 0 11-4 0 2 2 0 014 0Zm6 0a2 2 0 11-4 0 2 2 0 014 0Z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[1500] mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-900">
          {/* Opção: Duplicar */}
          <button
            onClick={handleDuplicate}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Duplicar
          </button>

          {/* Opção: Renomear - TODO */}
          <button
            disabled
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Renomear
          </button>

          {/* Separador */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* Opção: Excluir */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              Excluir
            </button>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Confirmar exclusão
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

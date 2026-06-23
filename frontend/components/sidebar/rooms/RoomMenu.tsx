'use client'

import { useState, useRef, useEffect } from 'react'
import type { Room } from './RoomsList'

export interface RoomMenuProps {
  room: Room
}

/**
 * RoomMenu - Menu flutuante com opções de sala
 * 
 * Responsabilidades:
 * - Renderizar botão de menu (⋯)
 * - Mostrar/esconder dropdown com opções
 * - Executar ações (sair, mais info, etc)
 * 
 * Padrão:
 * Similar ao ConversationMenu
 * 
 * TODO:
 * Adicionar ações específicas de salas
 */
export default function RoomMenu({ room }: RoomMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={menuRef} className="relative">
      {/* Botão do menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-600"
        aria-label="Opções da sala"
        title="Opções"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 12a2 2 0 11-4 0 2 2 0 014 0Zm6 0a2 2 0 11-4 0 2 2 0 014 0Zm6 0a2 2 0 11-4 0 2 2 0 014 0Z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[1500] mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-900">
          {/* Opção: Ver detalhes */}
          <button
            disabled
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Detalhes (em breve)
          </button>

          {/* Separador */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* Opção: Sair */}
          <button
            disabled
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Sair da sala (em breve)
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { Room } from './RoomsList'
import RoomMenu from './RoomMenu'

export interface RoomItemProps {
  room: Room
  closeMobile: () => void
}

/**
 * RoomItem - Item de sala/turma na sidebar
 * 
 * Responsabilidades:
 * - Renderizar um item de sala
 * - Evento de clique para abrir sala
 * - Menu (options)
 * 
 * Interações:
 * - Clique no item: abre sala
 * - Clique no menu (⋯): abre opções
 * 
 * Padrão:
 * Mesmo que ConversationItem mas para salas
 */
export default function RoomItem({
  room,
  closeMobile,
}: RoomItemProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    // Navega para sala
    router.push(`/scholar/rooms/${room.id}`)

    // Fecha sidebar no mobile
    closeMobile()
  }, [room.id, router, closeMobile])

  return (
    <div
      className={`
        group flex items-center justify-between gap-2 rounded-lg px-3 py-2
        text-gray-700 transition-colors hover:bg-gray-100
        dark:text-gray-300 dark:hover:bg-gray-700
      `}
    >
      {/* Botão para abrir sala */}
      <button
        onClick={handleClick}
        className="min-w-0 flex-1 truncate text-left text-sm font-medium"
        title={room.name}
      >
        <span className="mr-2">{room.icon || '🏫'}</span>
        {room.name}
      </button>

      {/* Menu (ações) */}
      <RoomMenu room={room} />
    </div>
  )
}

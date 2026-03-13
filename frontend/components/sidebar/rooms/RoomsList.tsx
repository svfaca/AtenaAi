'use client'

import SidebarSection from '../SidebarSection'
import RoomItem from './RoomItem'

// TODO: Importar do store quando classroom/rooms store for implementado
// Por enquanto, usando dados mock para demonstrar a estrutura

export interface Room {
  id: number
  name: string
  description?: string
  icon?: string
}

export interface RoomsListProps {
  isCollapsed: boolean
  closeMobile: () => void
}

/**
 * RoomsList - Lista de salas/turmas na sidebar
 * 
 * Responsabilidades:
 * - Fetch de salas (quando store for implementado)
 * - Renderizar lista de RoomItem
 * - Passar closeMobile para itens
 * 
 * TODO:
 * ✓ Integrar com useClassroomStore ou useRoomsStore
 * ✓ Implementar carregamento automático
 * ✓ Adicionar ícones de sala
 * 
 * Benefícios:
 * ✓ Mesmo padrão que ConversationsList
 * ✓ Facilita adicionar rooms no futuro
 */
export default function RoomsList({
  isCollapsed,
  closeMobile,
}: RoomsListProps) {
  // TODO: Substituir por dados reais do store
  const rooms: Room[] = []

  return (
    <SidebarSection
      title="Salas"
      icon="🏫"
      isCollapsed={isCollapsed}
      defaultOpen={true}
    >
      {rooms.length === 0 ? (
        <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          Nenhuma sala disponível
        </p>
      ) : (
        <div className="space-y-1">
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              closeMobile={closeMobile}
            />
          ))}
        </div>
      )}
    </SidebarSection>
  )
}

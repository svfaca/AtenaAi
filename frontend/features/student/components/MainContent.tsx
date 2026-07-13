'use client'

import { useMemo } from 'react'
import { useNavigationState } from '@/features/navigation/hooks/useNavigationState'
import ChatWindow from '@/features/chat/components/ChatWindow'
import ClassroomPageModal from '@/features/classrooms/components/modals/ClassroomPageModal'
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView'

/**
 * MainContent - Renderização única de conteúdo
 *
 * Responsabilidades:
 * - Renderizar UM ÚNICO componente por vez
 * - Baseado no estado unificado de navegação
 * - Nunca renderizar sala + conversa simultaneamente
 *
 * Estados:
 * - "conversation": ChatWindow
 * - "new-conversation": ChatWindow
 * - "classroom": ClassroomView
 * - null/fallback: ChatWindow
 */
export default function MainContent() {
  const navigationState = useNavigationState()
  const { closeClassroom } = useClassroomView()

  // Renderizar baseado no tipo de visualização ativa
  const content = useMemo(() => {
    switch (navigationState.viewType) {
      case 'conversation':
      case 'new-conversation':
      case null:
      default:
        return <ChatWindow />

      case 'classroom':
        return (
          <ClassroomPageModal
            classroom={navigationState.classroomData}
            onClose={closeClassroom}
          />
        )
    }
  }, [navigationState.viewType, navigationState.classroomData, closeClassroom])

  return content
}

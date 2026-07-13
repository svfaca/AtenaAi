'use client'

import { create } from 'zustand'

export type NavigationViewType = 'conversation' | 'classroom' | 'new-conversation'

export interface NavigationState {
  // Tipo de conteúdo ativo
  viewType: NavigationViewType | null
  
  // ID da conversa ativa (se viewType === 'conversation')
  conversationId: number | null
  
  // ID da sala ativa (se viewType === 'classroom')
  classroomId: string | null
  
  // Dados da sala (cache para renderização)
  classroomData: {
    id: string
    name: string
    code?: string
    description?: string
    role: 'student' | 'teacher'
  } | null

  // Actions
  selectConversation: (conversationId: number) => void
  selectClassroom: (classroomId: string, classroomData: any) => void
  selectNewConversation: () => void
  clearSelection: () => void
  
  // Helpers
  isConversationActive: (conversationId: number) => boolean
  isClassroomActive: (classroomId: string) => boolean
}

export const useNavigationState = create<NavigationState>((set, get) => ({
  viewType: 'new-conversation',
  conversationId: null,
  classroomId: null,
  classroomData: null,

  selectConversation: (conversationId: number) => {
    set({
      viewType: 'conversation',
      conversationId,
      classroomId: null,
      classroomData: null,
    })
  },

  selectClassroom: (classroomId: string, classroomData: any) => {
    set({
      viewType: 'classroom',
      classroomId,
      classroomData: {
        id: classroomData.id || classroomId,
        name: classroomData.name,
        code: classroomData.code,
        description: classroomData.description,
        role: classroomData.role || 'student',
      },
      conversationId: null,
    })
  },

  selectNewConversation: () => {
    set({
      viewType: 'new-conversation',
      conversationId: null,
      classroomId: null,
      classroomData: null,
    })
  },

  clearSelection: () => {
    set({
      viewType: 'new-conversation',
      conversationId: null,
      classroomId: null,
      classroomData: null,
    })
  },

  isConversationActive: (conversationId: number) => {
    const state = get()
    return state.viewType === 'conversation' && state.conversationId === conversationId
  },

  isClassroomActive: (classroomId: string) => {
    const state = get()
    return state.viewType === 'classroom' && state.classroomId === classroomId
  },
}))

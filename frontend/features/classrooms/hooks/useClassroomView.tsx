'use client';

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigationState } from '@/features/navigation/hooks/useNavigationState';

export type ClassroomViewPayload = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  role: 'student' | 'teacher';
};

type ClassroomViewContextValue = {
  isOpen: boolean;
  classroom: ClassroomViewPayload | null;
  openClassroom: (payload: ClassroomViewPayload) => void;
  closeClassroom: () => void;
};

const ClassroomViewContext = createContext<ClassroomViewContextValue | null>(null);

export function ClassroomViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const lastUserKeyRef = useRef<string | null>(null);

  const clearSelection = useNavigationState((state) => state.clearSelection);
  const selectClassroom = useNavigationState((state) => state.selectClassroom);
  const viewType = useNavigationState((state) => state.viewType);
  const classroomData = useNavigationState((state) => state.classroomData);

  const normalizedUserRole = useMemo(() => {
    if (!user?.role) return null;
    if (user.role === 'professor') return 'teacher';
    if (user.role === 'scholar') return 'student';
    return user.role;
  }, [user?.role]);

  useEffect(() => {
    const currentUserKey = user?.id ? String(user.id) : null;

    // Fechar sala quando autenticação mudar
    if (lastUserKeyRef.current !== null && lastUserKeyRef.current !== currentUserKey) {
      clearSelection();
    }

    if (!currentUserKey) {
      clearSelection();
    }

    lastUserKeyRef.current = currentUserKey;
  }, [user?.id, clearSelection]);

  const openClassroom = useCallback((payload: ClassroomViewPayload) => {
    if (!user || !normalizedUserRole) {
      clearSelection();
      return;
    }

    if (payload.role !== normalizedUserRole) {
      clearSelection();
      return;
    }

    // Usar novo estado unificado em vez de estado local
    selectClassroom(payload.id, payload);
  }, [clearSelection, normalizedUserRole, selectClassroom, user]);

  const closeClassroom = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Extrair dados da sala do novo estado
  const isOpen = viewType === 'classroom';
  const classroom = classroomData;

  const value = useMemo(
    () => ({
      isOpen,
      classroom,
      openClassroom,
      closeClassroom,
    }),
    [isOpen, classroom, openClassroom, closeClassroom]
  );

  return createElement(ClassroomViewContext.Provider, { value }, children);
}

export function useClassroomView() {
  const context = useContext(ClassroomViewContext);

  if (!context) {
    throw new Error('useClassroomView must be used within ClassroomViewProvider');
  }

  return context;
}

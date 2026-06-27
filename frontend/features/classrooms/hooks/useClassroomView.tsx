'use client';

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth';

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
  const [classroom, setClassroom] = useState<ClassroomViewPayload | null>(null);
  const lastUserKeyRef = useRef<string | null>(null);

  const normalizedUserRole = useMemo(() => {
    if (!user?.role) return null;
    if (user.role === 'professor') return 'teacher';
    if (user.role === 'scholar') return 'student';
    return user.role;
  }, [user?.role]);

  useEffect(() => {
    const currentUserKey = user?.id ? String(user.id) : null;

    // Close any open classroom when authentication identity changes.
    if (lastUserKeyRef.current !== null && lastUserKeyRef.current !== currentUserKey) {
      setClassroom(null);
    }

    if (!currentUserKey) {
      setClassroom(null);
    }

    lastUserKeyRef.current = currentUserKey;
  }, [user?.id]);

  const openClassroom = useCallback((payload: ClassroomViewPayload) => {
    if (!user || !normalizedUserRole) {
      setClassroom(null);
      return;
    }

    if (payload.role !== normalizedUserRole) {
      setClassroom(null);
      return;
    }

    setClassroom(payload);
  }, [normalizedUserRole, user]);

  const closeClassroom = useCallback(() => {
    setClassroom(null);
  }, []);

  const value = useMemo(
    () => ({
      isOpen: Boolean(classroom),
      classroom,
      openClassroom,
      closeClassroom,
    }),
    [classroom, closeClassroom, openClassroom]
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

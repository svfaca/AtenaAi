'use client';

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

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
  const [classroom, setClassroom] = useState<ClassroomViewPayload | null>(null);

  const openClassroom = useCallback((payload: ClassroomViewPayload) => {
    setClassroom(payload);
  }, []);

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

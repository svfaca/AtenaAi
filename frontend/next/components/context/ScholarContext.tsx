'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Classroom, Conversation } from '@/lib/types';

interface ScholarContextType {
  classrooms: Classroom[];
  conversations: Conversation[];
  selectedConversationId?: number;
  onConversationSelect: (conversation: Conversation) => void;
  error?: string | null;
}

const ScholarContext = createContext<ScholarContextType | undefined>(undefined);

export function ScholarProvider({ children, ...value }: ScholarContextType & { children: ReactNode }) {
  const { children: _, ...contextValue } = { ...value };
  
  return (
    <ScholarContext.Provider value={contextValue as ScholarContextType}>
      {children}
    </ScholarContext.Provider>
  );
}

export function useScholar() {
  const context = useContext(ScholarContext);
  if (!context) {
    throw new Error('useScholar must be used within ScholarProvider');
  }
  return context;
}

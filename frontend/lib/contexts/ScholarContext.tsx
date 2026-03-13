'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Conversation } from '@/lib/types';

interface ScholarContextType {
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
}

const ScholarContext = createContext<ScholarContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
  initialConversation?: Conversation | null;
}

export function ScholarProvider({ children, initialConversation }: Props) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    initialConversation || null
  );

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <ScholarContext.Provider value={{ selectedConversation, onConversationSelect: handleConversationSelect }}>
      {children}
    </ScholarContext.Provider>
  );
}

export function useScholar() {
  const context = useContext(ScholarContext);
  if (!context) {
    throw new Error('useScholar deve ser usado dentro de ScholarProvider');
  }
  return context;
}

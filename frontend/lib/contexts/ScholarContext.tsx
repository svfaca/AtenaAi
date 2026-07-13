'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Conversation } from '@/lib/types';

interface ScholarContextType {
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
}

const ScholarContext = createContext<ScholarContextType | undefined>(undefined);

interface ScholarProviderProps {
  children: ReactNode;
  initialConversation?: Conversation | null;
}

export function ScholarProvider({ children, initialConversation }: ScholarProviderProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    initialConversation ?? null
  );

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
  }, []);

  const value = useMemo<ScholarContextType>(
    () => ({
      selectedConversation,
      onConversationSelect: handleConversationSelect,
    }),
    [handleConversationSelect, selectedConversation]
  );

  return <ScholarContext.Provider value={value}>{children}</ScholarContext.Provider>;
}

export function useScholar() {
  const context = useContext(ScholarContext);
  if (!context) {
    throw new Error('useScholar deve ser usado dentro de ScholarProvider');
  }
  return context;
}

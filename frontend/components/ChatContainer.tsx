'use client';

import { useEffect, useRef } from 'react';
import TextMessage from '@/features/chat/components/TextMessage';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatContainerProps {
  messages: Message[];
}

export function ChatContainer({ messages }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="chat-container flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      {messages.length === 0 ? (
        <div className="flex items-start">
          <TextMessage
            content="Ola! Eu sou a AtenaAI. Como posso ajudar nos seus estudos hoje?"
            role="assistant"
            strongIntro
          />
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'items-start'}`}
          >
            <TextMessage content={msg.content} role={msg.isUser ? 'user' : 'assistant'} />
          </div>
        ))
      )}
    </div>
  );
}


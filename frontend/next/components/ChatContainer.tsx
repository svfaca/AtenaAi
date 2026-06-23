'use client';

import { useEffect, useRef } from 'react';

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
      className="chat-container flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6"
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      {messages.length === 0 ? (
        <div className="flex items-start">
          <div className="message bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm max-w-85">
            <p className="m-0">
              <strong>Olá! Eu sou a AtenaAI.</strong> Como posso ajudar nos seus estudos hoje?
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.isUser ? 'justify-end' : 'items-start'}`}
          >
            <div 
              className={`message max-w-85 animate-fadeIn word-break break-word overflow-wrap break-word ${
                msg.isUser
                  ? 'bg-blue-600 text-white rounded-lg p-4 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-4 shadow-sm'
              }`}
            >
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: msg.content }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

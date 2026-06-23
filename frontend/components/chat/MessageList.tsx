'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TextMessage from '@/features/chat/components/TextMessage';
import TypingIndicator from '@/features/chat/components/TypingIndicator';

interface Message {
  id: string | number;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
}

type MessageListProps = {
  messages: Message[];
  isLoading?: boolean;
};

const BOTTOM_THRESHOLD_PX = 48;

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const welcomeMessage = `Ola! Eu sou a AtenaAI.
  Como posso ajudar nos seus estudos hoje?`;

  const updateAutoScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScroll(distanceFromBottom <= BOTTOM_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !autoScroll) return;

    const timer = setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isLoading, autoScroll]);

  return (
    <div
      ref={containerRef}
      id="messages-container"
      onScroll={updateAutoScroll}
      className="chat-container flex-1 overflow-y-auto flex flex-col gap-6 p-4 w-full"
    >
      {messages.length === 0 ? (
        <div className="flex items-start">
          <TextMessage content={welcomeMessage} role="assistant" strongIntro />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Initial Message */}
          <div className="flex items-start">
            <TextMessage content={welcomeMessage} role="assistant" strongIntro />
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start'}`}
            >
              <TextMessage content={message.content} role={message.role} />
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}


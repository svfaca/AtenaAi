'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TextMessage from './TextMessage';
import AtenaLimitMessage from './AtenaLimitMessage';

interface Message {
  id: string | number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
}

type MessageListProps = {
  messages: Message[];
  isLoading?: boolean;
  rateLimit?: number | null;
  onLogin?: () => void;
  onRegister?: () => void;
  onRateLimitExpire?: () => void;
};

const BOTTOM_THRESHOLD_PX = 120;

export default function MessageList({
  messages,
  isLoading = false,
  rateLimit,
  onLogin,
  onRegister,
  onRateLimitExpire,
}: MessageListProps) {
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

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, autoScroll]);

  return (
    <div
      ref={containerRef}
      id="messages-container"
      onScroll={updateAutoScroll}
      className="chat-container min-h-0 flex-1 overflow-y-auto scrollbar-custom flex flex-col gap-6 p-4 w-full"
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
              {message.content === 'limit_reached' ? (
                <AtenaLimitMessage
                  resetInSeconds={typeof rateLimit === 'number' ? rateLimit : 0}
                  onLogin={onLogin ?? (() => {})}
                  onRegister={onRegister ?? (() => {})}
                  onExpire={onRateLimitExpire}
                />
              ) : (
                <TextMessage
                  content={message.content}
                  role={message.role === 'user' ? 'user' : 'assistant'}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


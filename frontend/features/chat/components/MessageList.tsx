'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import TextMessage from './TextMessage';
import AtenaLimitMessage from './AtenaLimitMessage';

export interface Message {
  id: string | number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
  status?: 'sending' | 'streaming' | 'done' | 'error';
}

type MessageListProps = {
  messages: Message[];
  isLoading?: boolean;
  rateLimit?: number | null;
  onLogin?: () => void;
  onRegister?: () => void;
  onRateLimitExpire?: () => void;
  /** Muda quando o usuário troca de conversa — ao mudar, o chat pula para o fim */
  conversationKey?: string | number | null;
};

const BOTTOM_THRESHOLD_PX = 120;
const SCROLL_BUTTON_THRESHOLD_PX = 200;

export default function MessageList({
  messages,
  isLoading = false,
  rateLimit,
  onLogin,
  onRegister,
  onRateLimitExpire,
  conversationKey,
}: MessageListProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevConversationKeyRef = useRef<string | number | null>(null);
  const switchedConversationRef = useRef(false);

  // Identifica a conversa atual: usa conversationKey quando fornecido;
  // caso contrário (chat público), usa o id da primeira mensagem.
  const conversationIdentifier = conversationKey ?? messages[0]?.id ?? null;

  const updateAutoScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScroll(distanceFromBottom <= BOTTOM_THRESHOLD_PX);
    setShowScrollButton(distanceFromBottom > SCROLL_BUTTON_THRESHOLD_PX);
  }, []);

  // Detecta troca de conversa para voltar ao fim instantaneamente
  useEffect(() => {
    const switched = conversationIdentifier !== prevConversationKeyRef.current;
    prevConversationKeyRef.current = conversationIdentifier;
    switchedConversationRef.current = switched;

    if (switched) {
      setAutoScroll(true);
      setShowScrollButton(false);
    }
  }, [conversationIdentifier]);

  // Acompanha o fim quando o usuário está no fim (nova mensagem / streaming)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !autoScroll) return;

    // Troca de conversa → salto direto; durante streaming → instantâneo para não travar;
    // nos demais casos (nova mensagem enviada) → anima suavemente.
    const isStreaming = messages.some(
      (m) => m.status === 'streaming' || m.status === 'sending'
    );
    const behavior: ScrollBehavior =
      switchedConversationRef.current || isStreaming ? 'auto' : 'smooth';
    switchedConversationRef.current = false;

    // rAF garante o scroll depois do layout da nova mensagem
    const raf = requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });

    return () => cancelAnimationFrame(raf);
  }, [messages, autoScroll, conversationIdentifier]);

  const handleJumpToBottom = useCallback(() => {
    setAutoScroll(true);
    setShowScrollButton(false);

    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  const welcomeMessage = `Ola! Eu sou a AtenaAI.
  Como posso ajudar nos seus estudos hoje?`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        id="messages-container"
        onScroll={updateAutoScroll}
        className="chat-container min-h-0 flex-1 overflow-y-auto scrollbar-custom flex flex-col gap-4 p-4 w-full"
      >
        {messages.length === 0 ? (
          <div className="flex items-start">
            <TextMessage content={welcomeMessage} role="assistant" strongIntro />
          </div>
        ) : (
          <div className="space-y-4 pb-2">
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
                    status={message.status}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão voltar ao fim (aparece quando o usuário rola para cima) */}
      {showScrollButton && (
        <button
          type="button"
          onClick={handleJumpToBottom}
          aria-label="Ir para o final da conversa"
          className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}



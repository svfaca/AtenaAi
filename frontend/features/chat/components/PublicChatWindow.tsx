'use client';

import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PublicFooter from '@/shared/layout/PublicFooter';
import { LoginModal, SignupModal, useAuth } from '@/features/auth';
import { streamPublicMessage, type ChatRateLimitError } from '../services/chat.service';
import type { ChatMessage } from '../types/chat.types';

// ⚡ Limite de histórico para evitar latência/custo crescente
const MAX_HISTORY = 10;

export default function PublicChatWindow() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<number | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  // 🔥 Reset rate limit when user logs in
  useEffect(() => {
    if (user) {
      setRateLimit(null);
    }
  }, [user]);

  const openLoginModal = () => {
    setSignupOpen(false);
    setLoginOpen(true);
  };

  const openRegisterModal = () => {
    setLoginOpen(false);
    setSignupOpen(true);
  };

  const handleSendMessage = async (messageText: string): Promise<boolean> => {
    const trimmed = messageText.trim();
    if (!trimmed) return false;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: trimmed,
      role: 'user',
    };

    const updatedMessages = [...messages, userMessage];
    
    // Criar mensagem assistant vazia para streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
    };

    setMessages([...updatedMessages, assistantMessage]);
    setIsLoading(true);

    try {
      const limitedMessages = updatedMessages.slice(-MAX_HISTORY);

      // Usar streaming
      await streamPublicMessage(trimmed, limitedMessages, (token: string) => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.id === assistantMessageId) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + token }
            ];
          }
          return prev;
        });
      });

      return true;
    } catch (err: unknown) {
      const error = err as Partial<ChatRateLimitError>;

      if (error?.type === 'RATE_LIMIT') {
        setRateLimit(typeof error.resetInSeconds === 'number' ? error.resetInSeconds : 0);

        // Atualizar mensagem assistant para mostrar rate limit
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.id === assistantMessageId) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: 'limit_reached' }
            ];
          }
          return prev;
        });
        
        return false;
      }

      console.error('Erro ao enviar mensagem:', err);
      
      // Atualizar mensagem assistant com erro
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.id === assistantMessageId) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: 'Erro ao processar mensagem.' }
          ];
        }
        return prev;
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        rateLimit={rateLimit}
        onLogin={openLoginModal}
        onRegister={openRegisterModal}
        onRateLimitExpire={() => setRateLimit(null)}
      />

      {/* Input */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 px-4">
        <MessageInput onSubmit={handleSendMessage} isLoading={isLoading || rateLimit !== null} />
        <PublicFooter />
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={openRegisterModal}
      />
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={openLoginModal}
      />
    </div>
  );
}

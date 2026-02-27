'use client';

import { useState, useEffect } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';
import { LoginModal } from '@/components/auth/LoginModal';
import { SignupModal } from '@/components/auth/SignupModal';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  content: '<strong>Olá! Eu sou a AtenaAI.</strong><br/>Como posso ajudar nos seus estudos hoje?',
  isUser: false,
  timestamp: new Date(),
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginModalOpen, signupModalOpen, closeLogin, closeSignup } = useAuth();

  useEffect(() => {
    // Inicializa conexão com o servidor
    setIsConnected(true);
  }, []);

  const handleSendMessage = async (message: string) => {
    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Adicionar mensagem de carregamento
    const loadingMessageId = `loading-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: loadingMessageId,
      content: '<span class="text-gray-500 dark:text-gray-400"><span class="animate-bounce inline">.</span><span class="animate-bounce inline" style={{animationDelay: "0.1s"}}>.</span><span class="animate-bounce inline" style={{animationDelay: "0.2s"}}>.</span></span>',
      isUser: false,
      timestamp: new Date(),
    }]);

    try {
      // Fazer requisição ao backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          language: 'pt-BR',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();

      // Remover mensagem de carregamento e adicionar resposta
      setMessages((prev) => 
        prev.filter((m) => m.id !== loadingMessageId).concat({
          id: `msg-${Date.now()}`,
          content: data.reply || data.content,
          isUser: false,
          timestamp: new Date(),
        })
      );
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      console.error(error);

      // Remover mensagem de carregamento e mensagem do usuário em caso de erro
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMessage.id && m.id !== loadingMessageId)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col overflow-hidden" style={{ height: 'calc(100dvh)' }}>
        <PublicHeader />

        <div className="flex-1 flex flex-col relative w-full overflow-hidden">
          <ChatContainer messages={messages} />
          <ChatInput onSubmit={handleSendMessage} disabled={!isConnected || isLoading} />
        </div>
      </div>

      {/* Auth Modals */}
      <LoginModal isOpen={loginModalOpen} onClose={closeLogin} />
      <SignupModal isOpen={signupModalOpen} onClose={closeSignup} />
    </>
  );
}

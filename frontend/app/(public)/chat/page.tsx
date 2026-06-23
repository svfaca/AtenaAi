'use client';

import { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  content: '<strong>Olá! Eu sou a AtenaAI.</strong> Como posso ajudar nos seus estudos hoje?',
  isUser: false,
  timestamp: new Date(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isConnected, setIsConnected] = useState(false);

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

    try {
      // Fazer requisição ao backend
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: 'public',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        content: data.response || data.content,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      console.error(error);

      // Adicionar mensagem de erro
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMessage.id)
      );
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col overflow-hidden" style={{ height: 'calc(100dvh)' }}>
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        <ChatContainer messages={messages} />
        <ChatInput onSubmit={handleSendMessage} disabled={!isConnected} />
      </div>
    </div>
  );
}

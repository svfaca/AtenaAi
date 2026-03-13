import { useState, useCallback } from 'react';

import type { StreamChatMessage } from '../types/chat.types';

export function useChatStreamLogado(conversationId: number | null) {
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!conversationId || !content.trim()) return false;

      setError(null);

      const userMessage: StreamChatMessage = {
        id: Date.now(),
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // ID para a mensagem do assistente
      const assistantMessageId = Date.now() + 1;

      // Criar placeholder
      setMessages((prev) => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      }]);

      try {
        const res = await fetch(`/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            conversation_id: conversationId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.error || 'Erro ao enviar mensagem');
        }

        if (!res.body) {
          throw new Error('Nenhum stream recebido');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let contentBuffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          contentBuffer += chunk;

          // Atualizar mensagem do assistente
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: contentBuffer }
                : msg
            )
          );
        }

        return true;
      } catch (requestError) {
        console.error('Erro ao enviar mensagem:', requestError);
        setError('Ocorreu um erro ao processar sua mensagem. Tente novamente.');

        // Remover placeholder em caso de erro
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}

import { useState } from 'react';
import { sendPublicMessage } from '../services/chat.service';
import type { ChatMessage } from '../types/chat.types';

export function usePublicChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(content: string): Promise<boolean> {
    if (!content.trim()) return false;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await sendPublicMessage(content);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || data.reply || 'Mensagem recebida',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, sendMessage, limitReached: false };
}

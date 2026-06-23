/**
 * 💬 ChatWindow
 * 
 * Client Component
 * - Gerencia o chat da conversa selecionada
 * - Input, mensagens, envio
 * - Scroll automático
 * - Otimistic updates
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation } from "@/lib/types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface Props {
  selectedConversation: Conversation | null;
}

export function ChatWindow({ selectedConversation }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Buscar mensagens quando mudar de conversa
  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    // TODO: Chamar API para buscar mensagens
    // Por enquanto apenas limpar
    setMessages([]);
    setIsLoading(false);
  }, [selectedConversation?.id]);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversation?.id || !content.trim()) return;

      // ✅ Otimistic update
      const tempId = Date.now();
      const tempMessage = {
        id: tempId,
        content,
        role: "user",
        created_at: new Date().toISOString(),
        is_optimistic: true
      };

      setMessages((prev) => [...prev, tempMessage]);
      setIsSending(true);

      try {
        // TODO: Chamar API para enviar mensagem
        // Por enquanto apenas remover a mensagem otimista
        await new Promise((resolve) => setTimeout(resolve, 500));

        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        // Remover mensagem otimista em caso de erro
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setIsSending(false);
      }
    },
    [selectedConversation?.id]
  );

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
        <p className="text-slate-400">Selecione uma conversa</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      {/* Header - Compacto */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 flex-shrink-0">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {selectedConversation.title || "Chat"}
        </h2>
      </div>

      {/* Messages - Maximizar espaço */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
      >
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="text-slate-400 text-sm">Carregando mensagens...</div>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Nenhuma mensagem ainda. Comece a conversa!</p>
          </div>
        )}

        <MessageList messages={messages} />
      </div>

      {/* Input - Fixo ao final */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 flex-shrink-0">
        <MessageInput onSendMessage={handleSendMessage} disabled={isSending || isLoading} />
      </div>
    </div>
  );
}

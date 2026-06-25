/**
 * 🏫 SalaChatWindow
 * 
 * Client Component
 * - Chat da sala
 * - Mensagens iniciais vêm do servidor
 * - Input para enviar
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Classroom, Message } from "@/lib/types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface Props {
  classroom: Classroom;
  initialMessages: Message[];
}

export function SalaChatWindow({ classroom, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // ✅ Otimistic update
      const tempId = Date.now();
      const tempMessage: Message = {
        id: tempId,
        content,
        role: "user",
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, tempMessage]);
      setIsSending(true);

      try {
        // TODO: Chamar API para enviar mensagem na sala
        await new Promise((resolve) => setTimeout(resolve, 500));

        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setIsSending(false);
      }
    },
    []
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Compacto */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 flex-shrink-0 bg-white dark:bg-slate-950">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {classroom.name}
          </h2>
          {classroom.teacher?.full_name && (
            <p className="text-xs text-slate-500">
              Com {classroom.teacher.full_name}
            </p>
          )}
        </div>
      </div>

      {/* Messages - Maximizar espaço */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Nenhuma mensagem na sala ainda</p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* Input - Fixo ao final */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 flex-shrink-0">
        <MessageInput onSendMessage={handleSendMessage} disabled={isSending} />
      </div>
    </div>
  );
}

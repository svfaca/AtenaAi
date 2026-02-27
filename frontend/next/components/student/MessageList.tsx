/**
 * 📝 MessageList
 * 
 * Client Component
 * - Renderiza lista de mensagens
 * - Simples, sem lógica complexa
 */

"use client";

import type { Message } from "@/lib/types";

interface Props {
  messages: Message[];
}

export function MessageList({ messages }: Props) {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
              message.role === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none"
            } ${message.is_optimistic ? "opacity-50" : ""}`}
          >
            <p className="text-sm break-words">{message.content}</p>
            <p className="text-xs mt-1 opacity-70">
              {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

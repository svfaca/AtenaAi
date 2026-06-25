"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Conversation, ConversationDetailResponse, Message } from "@/lib/types";

type Props = {
  selectedConversation: Conversation | null;
};

export function ChatWindow({ selectedConversation }: Props) {
  const conversationId = selectedConversation?.id;
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversationData,
    error,
    mutate
  } = useSWR<ConversationDetailResponse>(
    conversationId ? `/api/conversations/${conversationId}` : null,
    (path) => api<ConversationDetailResponse>(path),
    {
      refreshInterval: 5000,
      revalidateOnFocus: false
    }
  );

  const messages = useMemo<Message[]>(() => conversationData?.messages ?? [], [conversationData]);

  useEffect(() => {
    if (messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const conversationTitle = useMemo(
    () =>
      conversationData?.conversation?.title ||
      selectedConversation?.title ||
      "Nova conversa",
    [conversationData, selectedConversation]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conversationId) {
      toast.error("Selecione uma conversa antes de enviar mensagens.");
      return;
    }

    const payload = draft.trim();
    if (!payload) return;

    setIsSending(true);
    try {
      await api<void>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payload })
      });
      setDraft("");
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const formattedMessages = useMemo(
    () =>
      messages.map((message) => (
        <li
          key={message.id}
          className={`rounded-2xl p-4 shadow-sm ${
            message.role === "assistant"
              ? "bg-slate-50 dark:bg-slate-900"
              : "bg-blue-50 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100"
          }`}
        >
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {message.role === "assistant" ? "AtenaAI" : "Você"}
          </p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
        </li>
      )),
    [messages]
  );

  const resizeTextarea = (event: FormEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  };

  return (
    <section className="flex flex-1 flex-col bg-white dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Chat</p>
          <p className="text-xl font-semibold">{conversationTitle}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Não foi possível carregar o histórico de mensagens.
          </div>
        )}
        {!conversationId && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
            Selecione ou crie uma conversa para começar a conversar com a AtenaAI.
          </div>
        )}
        <ul className="space-y-4">
          {formattedMessages}
          <div ref={messagesEndRef} />
        </ul>
      </div>

      <form
        className="border-t border-slate-200 px-6 py-4 dark:border-slate-800"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-3">
          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            rows={2}
            placeholder="Envie uma mensagem"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onInput={resizeTextarea}
            disabled={isSending}
          />
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-slate-400">Pressione Enter para enviar</span>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              disabled={isSending}
            >
              {isSending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

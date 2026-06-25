"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Classroom, Conversation, ConversationsResponse } from "@/lib/types";

type Props = {
  selectedConversationId?: number;
  onConversationSelect: (conversation: Conversation) => void;
};

export function ChatSidebar({ selectedConversationId, onConversationSelect }: Props) {
  const [classroomFilter, setClassroomFilter] = useState("");
  const [conversationFilter, setConversationFilter] = useState("");

  const {
    data: classrooms,
    error: classroomsError
  } = useSWR<Classroom[]>("/api/classrooms", (path) => api<Classroom[]>(path), {
    refreshInterval: 3000,
    revalidateOnFocus: false
  });

  const {
    data: conversationsResponse,
    error: conversationsError
  } = useSWR<ConversationsResponse>("/api/conversations?limit=25", (path) => api<ConversationsResponse>(path), {
    refreshInterval: 5000,
    revalidateOnFocus: false
  });

  const conversations = conversationsResponse?.items ?? [];

  useEffect(() => {
    if (!selectedConversationId && conversations.length) {
      onConversationSelect(conversations[0]);
    }
  }, [conversations, onConversationSelect, selectedConversationId]);

  const visibleClassrooms = useMemo(() => {
    if (!classrooms) return [];
    const query = classroomFilter.trim().toLowerCase();
    if (!query) return classrooms;
    return classrooms.filter((classroom) => classroom.name.toLowerCase().includes(query));
  }, [classrooms, classroomFilter]);

  const visibleConversations = useMemo(() => {
    const query = conversationFilter.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      conversation.title?.toLowerCase().includes(query) ?? false
    );
  }, [conversations, conversationFilter]);

  return (
    <aside className="w-80 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 flex flex-col">
      <div className="flex flex-col p-4 gap-3 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Salas</p>
        <input
          type="search"
          placeholder="Buscar salas"
          value={classroomFilter}
          onChange={(event) => setClassroomFilter(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        />
        {classroomsError && (
          <p className="text-xs text-red-500">Não foi possível carregar as salas.</p>
        )}
        <div className="h-24 overflow-hidden">
          <ul className="space-y-2 text-sm">
            {visibleClassrooms.length === 0 && !classroomsError ? (
              <li className="text-xs text-slate-400">Nenhuma sala encontrada</li>
            ) : (
              visibleClassrooms.slice(0, 5).map((classroom) => (
                <li key={classroom.id} className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {classroom.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {classroom.status === "pending" ? "Aguardando aprovação" : "Matriculado"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Conversas</p>
          <button
            type="button"
            className="text-xs font-semibold text-brand-500 hover:text-brand-600"
          >
            Nova
          </button>
        </div>
        <input
          type="search"
          placeholder="Buscar conversas"
          value={conversationFilter}
          onChange={(event) => setConversationFilter(event.target.value)}
          className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        />
        {conversationsError && (
          <div className="mt-2 text-xs text-red-500">Erro ao carregar conversas.</div>
        )}
        <div className="mt-3 flex-1 overflow-y-auto pr-1">
          <ul className="space-y-2">
            {visibleConversations.length === 0 && !conversationsError ? (
              <li className="text-xs text-slate-400">Nenhuma conversa disponível</li>
            ) : (
              visibleConversations.map((conversation) => {
                const isActive = conversation.id === selectedConversationId;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => onConversationSelect(conversation)}
                      className={`group w-full rounded-2xl px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isActive
                          ? "bg-brand-50 text-brand-600"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <p className="font-semibold truncate">
                        {conversation.title || "Nova conversa"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Última atualização em {conversation.updated_at ? new Date(conversation.updated_at).toLocaleString("pt-BR") : "—"}
                      </p>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}

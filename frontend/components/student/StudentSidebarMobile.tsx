'use client';

import { useMobileMenu } from '@/components/context/MobileMenuContext';
import { useScholar } from '@/lib/contexts/ScholarContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { SettingsModal } from '@/components/settings/SettingsModal';
import type { Classroom, Conversation } from '@/lib/types';
import { useMemo, useState } from 'react';

interface Props {
  classrooms: Classroom[];
  conversations: Conversation[];
  error?: string | null;
}

export function StudentSidebarMobile({
  classrooms,
  conversations,
  error,
}: Props) {
  const { isOpen, closeMenu } = useMobileMenu();
  const { selectedConversation, onConversationSelect } = useScholar();
  const { user } = useAuth();
  const [classroomFilter, setClassroomFilter] = useState('');
  const [conversationFilter, setConversationFilter] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const visibleClassrooms = useMemo(() => {
    if (!classrooms?.length) return [];
    const query = classroomFilter.trim().toLowerCase();
    if (!query) return classrooms;
    return classrooms.filter(c => c.name.toLowerCase().includes(query));
  }, [classrooms, classroomFilter]);

  const visibleConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return [];
    const query = conversationFilter.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) => (c.title || c.name || '').toLowerCase().includes(query));
  }, [conversations, conversationFilter]);

  // Gerar iniciais do usuário
  const getUserInitial = () => {
    if (user?.full_name) {
      return user.full_name.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Apenas em mobile
  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar mobile - overlay */}
      <aside
        className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-transform duration-300 z-20 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header com Avatar */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden flex-shrink-0">
              {user?.profile_image && user.profile_image.trim() ? (
                <img 
                  src={user.profile_image} 
                  alt={user?.full_name ?? "Avatar do estudante"} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{getUserInitial()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {user?.full_name ?? "Estudante"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Estudante</p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Fechar menu"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Classrooms */}
        <div className="flex flex-col p-3 gap-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Salas
            </p>
            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Adicionar sala">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <input
            type="search"
            placeholder="Buscar sala..."
            value={classroomFilter}
            onChange={(e) => setClassroomFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />

          {visibleClassrooms.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">
              {classrooms.length === 0 ? "Sem salas" : "Nenhuma encontrada"}
            </p>
          ) : (
            <ul className="space-y-1">
              {visibleClassrooms.map((classroom) => (
                <li key={classroom.id}>
                  <button className="w-full text-left p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="truncate">{classroom.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conversations */}
        <div className="flex flex-col flex-1 overflow-hidden p-3 gap-2">
          <div className="flex items-center justify-between flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Conversas
            </p>
          </div>

          <input
            type="search"
            placeholder="Buscar..."
            value={conversationFilter}
            onChange={(e) => setConversationFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 flex-shrink-0"
          />

          <ul className="flex-1 space-y-1 overflow-y-auto min-h-0">
            {visibleConversations.length === 0 ? (
              <li className="text-xs text-slate-400 text-center py-4">
                {conversations.length === 0 ? 'Sem conversas' : 'Nenhuma encontrada'}
              </li>
            ) : (
              visibleConversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => {
                      onConversationSelect(conversation);
                      closeMenu();
                    }}
                    className={`w-full text-left p-2 rounded transition flex items-center gap-2 text-sm ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="truncate">{conversation.title || 'Chat'}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Footer - Compacto */}
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 py-2">
          <div className="flex flex-col gap-1 px-2">
            <a 
              href="/quem-somos" 
              className="h-10 flex items-center gap-3 px-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Quem Somos</span>
            </a>

            <button 
              onClick={() => setSettingsOpen(true)}
              className="h-10 flex items-center gap-3 px-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Configurações</span>
            </button>

            <button 
              onClick={() => {
                // TODO: Implement logout
                closeMenu();
              }}
              className="h-10 flex items-center gap-3 px-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}

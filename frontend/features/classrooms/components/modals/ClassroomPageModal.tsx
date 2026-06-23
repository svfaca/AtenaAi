'use client';

import { useState } from 'react';

type ClassroomPageModalProps = {
  classroom: {
    id: string;
    name: string;
    code?: string;
    description?: string;
    role: 'student' | 'teacher';
  } | null;
  onClose: () => void;
};

export default function ClassroomPageModal({
  classroom,
  onClose,
}: ClassroomPageModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'activities' | 'files' | 'members'>('chat');

  if (!classroom) {
    return null;
  }

  const title = classroom?.name || 'Sala';

  const tabs = [
    { id: 'chat', label: 'Chat da sala', icon: '💬' },
    { id: 'activities', label: 'Atividades', icon: '✓' },
    { id: 'files', label: 'Arquivos', icon: '📁' },
    { id: 'members', label: 'Participantes', icon: '👥' },
  ] as const;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      role="dialog"
      aria-modal="true"
      aria-label="Página da sala"
    >
      {/* Header */}
      <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 md:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {classroom.role === 'teacher' ? 'Minha Turma' : 'Turma'}
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 md:text-xl">{title}</h2>
          {classroom.code && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Código: {classroom.code}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-4 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          aria-label="Fechar sala"
        >
          ✕ Fechar
        </button>
      </header>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800/50 md:px-6">
        <nav className="flex gap-1 py-2" aria-label="Abas da sala">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 md:p-6">
          {activeTab === 'chat' && (
            <section className="space-y-4">
              <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Chat da sala</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Espaço para conversas com a turma, dúvidas, discussões e trocas de conhecimento sobre os tópicos estudados.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">💡 DICA</p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      Use <code className="rounded bg-gray-200 px-1 text-xs dark:bg-gray-700">@atenaai</code> para conversar diretamente com a IA.
                    </p>
                  </div>
                </div>
              </article>
            </section>
          )}

          {activeTab === 'activities' && (
            <section className="space-y-4">
              <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Atividades</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Tarefas, exercícios e desafios propostos para a turma.
                </p>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  Nenhuma atividade no momento.
                </div>
              </article>
            </section>
          )}

          {activeTab === 'files' && (
            <section className="space-y-4">
              <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Arquivos</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Documentos, materiais e recursos compartilhados para esta turma.
                </p>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  Nenhum arquivo compartilhado.
                </div>
              </article>
            </section>
          )}

          {activeTab === 'members' && (
            <section className="space-y-4">
              <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Participantes</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Professores e alunos membros desta turma.
                </p>
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  Carregando participantes...
                </div>
              </article>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

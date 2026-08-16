'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckSquare,
  Clock3,
  Copy,
  File,
  Files,
  Filter,
  FolderOpen,
  Hash,
  Image,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pin,
  QrCode,
  Search,
  Send,
  Smile,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import MarkdownContent from '@/features/chat/components/MarkdownContent';

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

type RoomSectionId = 'chat' | 'activities' | 'files' | 'members' | 'agenda' | 'ai' | 'settings';
type RoomViewState = 'loading' | 'ready' | 'error';
type PresenceStatus = 'online' | 'away' | 'offline';
type MessageAuthorRole = 'teacher' | 'student' | 'ai' | 'monitor';

type Participant = {
  id: string;
  name: string;
  roleLabel: string;
  group: 'professor' | 'monitor' | 'alunos';
  avatar: string;
  status: PresenceStatus;
};

type ChatMessageItem = {
  id: string;
  author: string;
  role: MessageAuthorRole;
  avatar: string;
  timestamp: string;
  minutes: number;
  dayLabel: 'Hoje' | 'Ontem' | 'Semana passada';
  content: string;
};

type ChatMessageViewModel = ChatMessageItem & {
  showMeta: boolean;
  showDayDivider: boolean;
};

type ClassroomFileItem = {
  id: string;
  name: string;
  meta: string;
};

type ClassroomActivityItem = {
  id: string;
  title: string;
  deadline: string;
  status: 'aberta' | 'encerrada';
};

const ROOM_NAV_ITEMS: ReadonlyArray<{ id: RoomSectionId; label: string; icon: typeof MessageCircle }> = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'activities', label: 'Atividades', icon: CheckSquare },
  { id: 'files', label: 'Arquivos', icon: FolderOpen },
  { id: 'members', label: 'Participantes', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: Clock3 },
  { id: 'ai', label: 'AtenaAI', icon: Sparkles },
  { id: 'settings', label: 'Configuracoes', icon: MoreHorizontal },
];

const REACTION_SET = ['👍', '❤️', '🎉', '👏'] as const;
const BASE_REACTION_COUNTS: Readonly<Record<(typeof REACTION_SET)[number], number>> = {
  '👍': 12,
  '❤️': 4,
  '🎉': 2,
  '👏': 1,
};

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Prof. Helena Costa', roleLabel: 'Professor', group: 'professor', avatar: 'HC', status: 'online' },
  { id: 'p2', name: 'AtenaAI', roleLabel: 'Tutor IA', group: 'monitor', avatar: 'AI', status: 'online' },
  { id: 'p3', name: 'Marcos Silva', roleLabel: 'Monitor', group: 'monitor', avatar: 'MS', status: 'online' },
  { id: 'p4', name: 'Ana Clara', roleLabel: 'Aluna', group: 'alunos', avatar: 'AC', status: 'away' },
  { id: 'p5', name: 'Bruno Lima', roleLabel: 'Aluno', group: 'alunos', avatar: 'BL', status: 'online' },
  { id: 'p6', name: 'Carla Souza', roleLabel: 'Aluna', group: 'alunos', avatar: 'CS', status: 'offline' },
  { id: 'p7', name: 'Diego Nunes', roleLabel: 'Aluno', group: 'alunos', avatar: 'DN', status: 'away' },
  { id: 'p8', name: 'Fernanda Melo', roleLabel: 'Aluna', group: 'alunos', avatar: 'FM', status: 'online' },
  { id: 'p9', name: 'Guilherme Paz', roleLabel: 'Aluno', group: 'alunos', avatar: 'GP', status: 'offline' },
  { id: 'p10', name: 'Julia Reis', roleLabel: 'Aluna', group: 'alunos', avatar: 'JR', status: 'online' },
  { id: 'p11', name: 'Leo Prado', roleLabel: 'Aluno', group: 'alunos', avatar: 'LP', status: 'online' },
  { id: 'p12', name: 'Maria Luz', roleLabel: 'Aluna', group: 'alunos', avatar: 'ML', status: 'away' },
  { id: 'p13', name: 'Nina Costa', roleLabel: 'Aluna', group: 'alunos', avatar: 'NC', status: 'online' },
  { id: 'p14', name: 'Otavio Dias', roleLabel: 'Aluno', group: 'alunos', avatar: 'OD', status: 'online' },
  { id: 'p15', name: 'Paula Neri', roleLabel: 'Aluna', group: 'alunos', avatar: 'PN', status: 'offline' },
  { id: 'p16', name: 'Rafa Almeida', roleLabel: 'Aluno', group: 'alunos', avatar: 'RA', status: 'online' },
  { id: 'p17', name: 'Tiago Sena', roleLabel: 'Aluno', group: 'alunos', avatar: 'TS', status: 'away' },
  { id: 'p18', name: 'Vitoria Melo', roleLabel: 'Aluna', group: 'alunos', avatar: 'VM', status: 'online' },
  { id: 'p19', name: 'Yara Lopes', roleLabel: 'Aluna', group: 'alunos', avatar: 'YL', status: 'online' },
  { id: 'p20', name: 'Zeca Freitas', roleLabel: 'Aluno', group: 'alunos', avatar: 'ZF', status: 'offline' },
  { id: 'p21', name: 'Joao Brito', roleLabel: 'Aluno', group: 'alunos', avatar: 'JB', status: 'online' },
  { id: 'p22', name: 'Laura Mendes', roleLabel: 'Aluna', group: 'alunos', avatar: 'LM', status: 'online' },
  { id: 'p23', name: 'Igor Pires', roleLabel: 'Aluno', group: 'alunos', avatar: 'IP', status: 'away' },
  { id: 'p24', name: 'Sofia Ramos', roleLabel: 'Aluna', group: 'alunos', avatar: 'SR', status: 'online' },
  { id: 'p25', name: 'Caio Teixeira', roleLabel: 'Aluno', group: 'alunos', avatar: 'CT', status: 'online' },
  { id: 'p26', name: 'Bia Faria', roleLabel: 'Aluna', group: 'alunos', avatar: 'BF', status: 'away' },
  { id: 'p27', name: 'Enzo Rocha', roleLabel: 'Aluno', group: 'alunos', avatar: 'ER', status: 'online' },
  { id: 'p28', name: 'Lia Monteiro', roleLabel: 'Aluna', group: 'alunos', avatar: 'LI', status: 'online' },
];

const MOCK_MESSAGES: ChatMessageItem[] = [
  {
    id: 'm1',
    author: 'Prof. Helena Costa',
    role: 'teacher',
    avatar: 'HC',
    timestamp: '08:15',
    minutes: 8 * 60 + 15,
    dayLabel: 'Semana passada',
    content: 'Bom dia, turma. Revisem os exercicios de funcoes para a atividade de sexta.',
  },
  {
    id: 'm2',
    author: 'Prof. Helena Costa',
    role: 'teacher',
    avatar: 'HC',
    timestamp: '08:17',
    minutes: 8 * 60 + 17,
    dayLabel: 'Semana passada',
    content: 'Vale ponto extra para quem entregar com comentario de estrategia.',
  },
  {
    id: 'm3',
    author: 'Ana Clara',
    role: 'student',
    avatar: 'AC',
    timestamp: '08:22',
    minutes: 8 * 60 + 22,
    dayLabel: 'Semana passada',
    content: 'Prof, podemos enviar em dupla?',
  },
  {
    id: 'm4',
    author: 'AtenaAI',
    role: 'ai',
    avatar: 'AI',
    timestamp: '08:23',
    minutes: 8 * 60 + 23,
    dayLabel: 'Semana passada',
    content: 'Posso ajudar com um resumo de funcoes lineares e quadraticas. Use @atenaai no chat.',
  },
  {
    id: 'm5',
    author: 'Prof. Helena Costa',
    role: 'teacher',
    avatar: 'HC',
    timestamp: '10:02',
    minutes: 10 * 60 + 2,
    dayLabel: 'Ontem',
    content: 'Duplas estao liberadas, mas a entrega deve ter identificacao de ambos.',
  },
  {
    id: 'm6',
    author: 'Bruno Lima',
    role: 'student',
    avatar: 'BL',
    timestamp: '10:09',
    minutes: 10 * 60 + 9,
    dayLabel: 'Ontem',
    content: 'Perfeito, obrigado!',
  },
  {
    id: 'm7',
    author: 'AtenaAI',
    role: 'ai',
    avatar: 'AI',
    timestamp: '09:01',
    minutes: 9 * 60 + 1,
    dayLabel: 'Hoje',
    content: 'Dica rapida: compare o grafico de y = 2x + 1 com y = x^2 para entender crescimento linear e nao linear.',
  },
  {
    id: 'm8',
    author: 'Carla Souza',
    role: 'student',
    avatar: 'CS',
    timestamp: '09:05',
    minutes: 9 * 60 + 5,
    dayLabel: 'Hoje',
    content: 'Usei isso no exercicio 4 e ajudou muito.',
  },
  {
    id: 'm9',
    author: 'Carla Souza',
    role: 'student',
    avatar: 'CS',
    timestamp: '09:06',
    minutes: 9 * 60 + 6,
    dayLabel: 'Hoje',
    content: 'Posso postar a resolucao em passos se ajudar.',
  },
];

const MOCK_FILES: ClassroomFileItem[] = [
  { id: 'f1', name: 'Lista-03-Funcoes.pdf', meta: '2.4 MB • Atualizado hoje' },
  { id: 'f2', name: 'Gabarito-Lista-02.pdf', meta: '1.1 MB • Atualizado ontem' },
  { id: 'f3', name: 'Slide-Revisao.pptx', meta: '5.8 MB • Atualizado semana passada' },
];

const MOCK_ACTIVITIES: ClassroomActivityItem[] = [
  { id: 'a1', title: 'Atividade 03 - Funcoes', deadline: 'Entrega ate sexta, 23:59', status: 'aberta' },
  { id: 'a2', title: 'Quiz diagnostico', deadline: 'Encerrada em 20/06', status: 'encerrada' },
];

const presenceLabelByStatus: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Ausente',
  offline: 'Offline',
};

const presenceDotClassByStatus: Record<PresenceStatus, string> = {
  online: 'bg-emerald-400',
  away: 'bg-amber-400',
  offline: 'bg-slate-500',
};


const RoomNavigation = memo(function RoomNavigation({
  activeSection,
  onSectionChange,
}: {
  activeSection: RoomSectionId;
  onSectionChange: (sectionId: RoomSectionId) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-2.5 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.85)]">
      <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Navegacao da sala</p>
      <nav className="space-y-1" aria-label="Navegacao da sala">
        {ROOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'border border-blue-500/40 bg-blue-500/15 text-blue-100'
                  : 'border border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <ArrowRight className={`h-3.5 w-3.5 ${isActive ? 'text-blue-200' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </button>
          );
        })}
      </nav>
    </section>
  );
});

const RoomContextArea = memo(function RoomContextArea({
  activeSection,
  participants,
  participantSearch,
  onParticipantSearch,
  code,
  description,
  onCopyCode,
  pinnedItems,
  files,
}: {
  activeSection: RoomSectionId;
  participants: Participant[];
  participantSearch: string;
  onParticipantSearch: (value: string) => void;
  code?: string;
  description?: string;
  onCopyCode: () => void;
  pinnedItems: ChatMessageItem[];
  files: ClassroomFileItem[];
}) {
  if (activeSection === 'files') {
    return (
      <div className="space-y-3">
        <SharedFiles files={files} />
        <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3">
          <h3 className="text-sm font-semibold text-slate-100">Links e recentes</h3>
          <div className="mt-2 space-y-2 text-xs text-slate-300">
            <p className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2">/materiais/lista-03</p>
            <p className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2">/revisao/funcoes</p>
          </div>
        </section>
      </div>
    );
  }

  if (activeSection === 'activities') {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3">
        <h3 className="text-sm font-semibold text-slate-100">Atividades</h3>
        <div className="mt-2 space-y-2 text-xs text-slate-300">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
            <p className="font-medium text-amber-100">Pendentes</p>
            <p className="mt-1 text-amber-200/80">2 entregas ate sexta</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2">
            <p className="font-medium text-emerald-100">Entregues</p>
            <p className="mt-1 text-emerald-200/80">14 alunos concluiram quiz</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2">
            <p className="font-medium text-slate-100">Proximo prazo</p>
            <p className="mt-1 text-slate-400">Lista de funcoes, sexta 23:59</p>
          </div>
        </div>
      </section>
    );
  }

  if (activeSection === 'agenda' || activeSection === 'ai' || activeSection === 'settings') {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3">
        <h3 className="text-sm font-semibold text-slate-100">Contexto</h3>
        <p className="mt-2 text-sm text-slate-300">Painel preparado para conteudo dinamico desta secao. A versao inicial usa dados mockados para preservar a arquitetura atual.</p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <RoomInfoCard description={description} code={code} onCopyCode={onCopyCode} />
      <ParticipantsCard participants={participants} search={participantSearch} onSearch={onParticipantSearch} />
      <PinnedMessages items={pinnedItems} />
    </div>
  );
});

const SearchMessages = memo(function SearchMessages({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-8 min-w-[150px] max-w-[220px] items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/70 px-2 text-slate-300 transition duration-150 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
      <Search className="h-3.5 w-3.5 text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar"
        aria-label="Pesquisar mensagens"
        className="w-full bg-transparent text-xs outline-none placeholder:text-slate-500"
      />
    </label>
  );
});

const PinnedMessages = memo(function PinnedMessages({
  items,
}: {
  items: ChatMessageItem[];
}) {
  return (
    <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.85)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Fixados</h3>
        <Pin className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma mensagem fixada.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2 text-xs text-slate-300">
              <p className="font-medium text-slate-200">{item.author}</p>
              <p className="mt-1 line-clamp-2">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

const SharedFiles = memo(function SharedFiles({
  files,
}: {
  files: ClassroomFileItem[];
}) {
  return (
    <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.85)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Arquivos compartilhados</h3>
        <FolderOpen className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-2 space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-200">{file.name}</p>
              <p className="truncate text-[11px] text-slate-500">{file.meta}</p>
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 transition duration-150 hover:border-slate-500 hover:bg-slate-800"
            >
              Abrir
            </button>
          </div>
        ))}
      </div>
    </section>
  );
});

const RoomToolbar = memo(function RoomToolbar({
  searchValue,
  onSearchChange,
  onOpenMobilePanel,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenMobilePanel: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-slate-800/70 bg-slate-950/60 px-2.5 py-1.5 backdrop-blur sm:px-3">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <SearchMessages value={searchValue} onChange={onSearchChange} />
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-800 bg-slate-900/70 px-2 text-[11px] font-medium text-slate-200 transition duration-150 hover:border-slate-600 hover:bg-slate-800"
          >
            <Filter className="h-3 w-3" /> Filtros
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-800 bg-slate-900/70 px-2 text-[11px] font-medium text-slate-200 transition duration-150 hover:border-slate-600 hover:bg-slate-800"
          >
            <Pin className="h-3 w-3" /> Fixados
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-800 bg-slate-900/70 px-2 text-[11px] font-medium text-slate-200 transition duration-150 hover:border-slate-600 hover:bg-slate-800"
          >
            <Files className="h-3 w-3" /> Arquivos
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenMobilePanel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900/70 text-slate-200 transition duration-150 hover:border-slate-600 hover:bg-slate-800 lg:hidden"
            aria-label="Abrir painel lateral"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

const MessageActions = memo(function MessageActions({
  message,
  isOwn,
  onCopy,
  onReply,
  onEdit,
}: {
  message: ChatMessageItem;
  isOwn: boolean;
  onCopy: (message: ChatMessageItem) => void;
  onReply: (message: ChatMessageItem) => void;
  onEdit: (message: ChatMessageItem) => void;
}) {
  return (
    <div className="absolute -top-3 right-2 z-10 hidden items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/95 p-1 shadow-lg group-hover:flex">
      <button
        type="button"
        onClick={() => onReply(message)}
        className="rounded-md px-2 py-1 text-[11px] text-slate-300 transition duration-150 hover:bg-slate-800"
      >
        Responder
      </button>
      {isOwn && (
        <button
          type="button"
          onClick={() => onEdit(message)}
          className="rounded-md px-2 py-1 text-[11px] text-slate-300 transition duration-150 hover:bg-slate-800"
        >
          Editar
        </button>
      )}
      <button
        type="button"
        onClick={() => onCopy(message)}
        className="rounded-md px-2 py-1 text-[11px] text-slate-300 transition duration-150 hover:bg-slate-800"
      >
        Copiar
      </button>
    </div>
  );
});

const ChatMessage = memo(function ChatMessage({
  message,
  onCopy,
  onReply,
  onEdit,
  reactions,
  onReactionToggle,
  isOwn,
  isEditing,
  editingDraft,
  onEditingDraftChange,
  onSaveEdit,
  onCancelEdit,
}: {
  message: ChatMessageViewModel;
  onCopy: (message: ChatMessageItem) => void;
  onReply: (message: ChatMessageItem) => void;
  onEdit: (message: ChatMessageItem) => void;
  reactions: string[];
  onReactionToggle: (messageId: string, reaction: string) => void;
  isOwn: boolean;
  isEditing: boolean;
  editingDraft: string;
  onEditingDraftChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const isAi = message.role === 'ai';
  const isTeacher = message.role === 'teacher';
  const reactionCount = (reaction: (typeof REACTION_SET)[number]) => {
    const base = BASE_REACTION_COUNTS[reaction] || 0;
    return base + (reactions.includes(reaction) ? 1 : 0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`group relative rounded-lg px-2 py-1 transition duration-150 ${isAi ? 'border-l-2 border-blue-400/70 bg-blue-500/10' : 'hover:bg-slate-900/45'}`}
    >
      <MessageActions message={message} isOwn={isOwn} onCopy={onCopy} onReply={onReply} onEdit={onEdit} />

      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2.5">
        <div>
          {message.showMeta ? (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-bold ${isAi ? 'bg-blue-500/20 text-blue-100' : 'bg-slate-800 text-slate-100'}`}>
              {message.avatar}
            </div>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {message.showMeta && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-sm font-semibold text-slate-100">{message.author}</span>
              {isTeacher && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                  Professor
                </span>
              )}
              {isAi && (
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-300">
                  IA
                </span>
              )}
              <span>{message.timestamp}</span>
            </div>
          )}

          {isEditing ? (
            <div className="mt-1.5 rounded-lg border border-slate-700 bg-slate-950/80 p-2">
              <textarea
                value={editingDraft}
                onChange={(event) => onEditingDraftChange(event.target.value)}
                className="h-20 w-full resize-none bg-transparent text-sm text-slate-100 outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition duration-150 hover:bg-blue-500"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition duration-150 hover:border-slate-500 hover:bg-slate-800"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : isAi ? (
            <MarkdownContent
              content={message.content.trim()}
              className={`${message.showMeta ? 'mt-1' : 'mt-0.5'} text-blue-50`}
            />
          ) : (
            <p className={`${message.showMeta ? 'mt-1' : 'mt-0.5'} whitespace-pre-wrap text-sm leading-relaxed text-slate-200`}>
              {message.content}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {REACTION_SET.map((reaction) => {
              const isActive = reactions.includes(reaction);

              return (
                <button
                  key={`${message.id}-${reaction}`}
                  type="button"
                  onClick={() => onReactionToggle(message.id, reaction)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition duration-150 ${
                    isActive
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-100'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                  }`}
                  aria-label={`Reagir com ${reaction}`}
                >
                  <span>{reaction}</span>
                  <span>{reactionCount(reaction)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.article>
  );
});

const MessageGroup = memo(function MessageGroup({
  message,
  onCopy,
  onReply,
  onEdit,
  reactions,
  onReactionToggle,
  isOwn,
  isEditing,
  editingDraft,
  onEditingDraftChange,
  onSaveEdit,
  onCancelEdit,
}: {
  message: ChatMessageViewModel;
  onCopy: (message: ChatMessageItem) => void;
  onReply: (message: ChatMessageItem) => void;
  onEdit: (message: ChatMessageItem) => void;
  reactions: string[];
  onReactionToggle: (messageId: string, reaction: string) => void;
  isOwn: boolean;
  isEditing: boolean;
  editingDraft: string;
  onEditingDraftChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <div>
      {message.showDayDivider && (
        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {message.dayLabel}
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
      )}

      <ChatMessage
        message={message}
        onCopy={onCopy}
        onReply={onReply}
        onEdit={onEdit}
        reactions={reactions}
        onReactionToggle={onReactionToggle}
        isOwn={isOwn}
        isEditing={isEditing}
        editingDraft={editingDraft}
        onEditingDraftChange={onEditingDraftChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
});

const UnreadDivider = memo(function UnreadDivider() {
  return (
    <div className="my-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-blue-500/60" />
      <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-200">
        Nao lidas
      </span>
      <div className="h-px flex-1 bg-blue-500/60" />
    </div>
  );
});

const TypingIndicator = memo(function TypingIndicator({ labels }: { labels: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 px-2 sm:px-3">
      {labels.map((label) => (
        <div key={label} className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
          </div>
          {label}
        </div>
      ))}
    </div>
  );
});

const ChatViewport = memo(function ChatViewport({
  messages,
  searchQuery,
  onCopy,
  onReply,
  onEdit,
  reactionsMap,
  onReactionToggle,
  editingMessageId,
  editingDraft,
  onEditingDraftChange,
  onSaveEdit,
  onCancelEdit,
  onLoadOlder,
  showJumpToLatest,
  onJumpToLatest,
  unreadIndex,
  onScroll,
  viewportRef,
}: {
  messages: ChatMessageViewModel[];
  searchQuery: string;
  onCopy: (message: ChatMessageItem) => void;
  onReply: (message: ChatMessageItem) => void;
  onEdit: (message: ChatMessageItem) => void;
  reactionsMap: Record<string, string[]>;
  onReactionToggle: (messageId: string, reaction: string) => void;
  editingMessageId: string | null;
  editingDraft: string;
  onEditingDraftChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onLoadOlder: () => void;
  showJumpToLatest: boolean;
  onJumpToLatest: () => void;
  unreadIndex: number;
  onScroll: () => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const filteredMessages = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return messages;
    return messages.filter((message) => message.content.toLowerCase().includes(normalized) || message.author.toLowerCase().includes(normalized));
  }, [messages, searchQuery]);

  if (filteredMessages.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-7 text-center">
          <p className="text-base font-semibold text-slate-100">Nenhuma mensagem encontrada</p>
          <p className="mt-2 text-sm text-slate-400">Tente outro termo de busca ou limpe o filtro.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={viewportRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto scrollbar-custom">
      <div className="px-2 py-3 sm:px-3">
        <button
          type="button"
          onClick={onLoadOlder}
          className="mx-auto mb-3 block rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition duration-150 hover:border-slate-500 hover:bg-slate-900"
        >
          Carregar mensagens anteriores
        </button>

        {filteredMessages.map((message, index) => {
          const isOwn = message.author === 'Voce' || message.author === 'Prof. Voce';
          const messageReactions = reactionsMap[message.id] || [];

          return (
            <div key={message.id}>
              {index === unreadIndex && <UnreadDivider />}

              <MessageGroup
                message={message}
                onCopy={onCopy}
                onReply={onReply}
                onEdit={onEdit}
                reactions={messageReactions}
                onReactionToggle={onReactionToggle}
                isOwn={isOwn}
                isEditing={editingMessageId === message.id}
                editingDraft={editingDraft}
                onEditingDraftChange={onEditingDraftChange}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            </div>
          );
        })}
      </div>

      {showJumpToLatest && (
        <button
          type="button"
          onClick={onJumpToLatest}
          className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/20 text-blue-100 transition duration-150 hover:bg-blue-500/30"
          aria-label="Ir para a ultima mensagem"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

const ComposerMentionAutocomplete = memo(function ComposerMentionAutocomplete({
  query,
  options,
  onSelect,
}: {
  query: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const normalized = query.toLowerCase();
  const filtered = options.filter((option) => option.toLowerCase().includes(normalized)).slice(0, 5);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="absolute bottom-full left-3 mb-2 w-72 rounded-xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl"
      role="listbox"
      aria-label="Autocomplete de mencoes"
    >
      {filtered.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-slate-200 transition duration-150 hover:bg-slate-900"
        >
          {option}
          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
        </button>
      ))}
    </motion.div>
  );
});

const Composer = memo(function Composer({
  draft,
  isSending,
  replyTo,
  onDraftChange,
  onSend,
  onCancelReply,
  onMentionSelect,
  onSuggestionSelect,
}: {
  draft: string;
  isSending: boolean;
  replyTo: ChatMessageItem | null;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onCancelReply: () => void;
  onMentionSelect: (value: string) => void;
  onSuggestionSelect: (value: string) => void;
}) {
  const mentionQuery = useMemo(() => {
    const mentionMatch = draft.match(/@([\w]*)$/i);
    return mentionMatch ? mentionMatch[1] : null;
  }, [draft]);

  const suggestionItems = useMemo(() => {
    if (!draft.toLowerCase().includes('@atenaai')) return [];
    return ['Resolver exercicio', 'Explicar materia', 'Criar resumo', 'Gerar quiz'];
  }, [draft]);

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-800/90 bg-slate-950/95 px-2.5 py-2.5 backdrop-blur sm:px-3">
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950/90 p-2 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.9)]">
        <AnimatePresence>
          {mentionQuery !== null && (
            <ComposerMentionAutocomplete
              query={mentionQuery}
              options={['Professor', 'AtenaAI', 'Joao', 'Maria']}
              onSelect={onMentionSelect}
            />
          )}
        </AnimatePresence>

        {suggestionItems.length > 0 && (
          <div className="mb-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-200">Sugestoes da IA</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestionItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSuggestionSelect(item)}
                  className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-100 transition duration-150 hover:bg-blue-500/20"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2 text-xs text-slate-300">
            <p className="truncate">Respondendo {replyTo.author}: {replyTo.content}</p>
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-2 rounded-md px-1.5 py-1 text-slate-300 transition duration-150 hover:bg-slate-800"
              aria-label="Cancelar resposta"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1.5">
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 p-1">
            <button type="button" className="rounded-md p-2 text-slate-400 transition duration-150 hover:bg-slate-800 hover:text-slate-100" aria-label="Emoji">
              <Smile className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-md p-2 text-slate-400 transition duration-150 hover:bg-slate-800 hover:text-slate-100" aria-label="Arquivo">
              <Paperclip className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-md p-2 text-slate-400 transition duration-150 hover:bg-slate-800 hover:text-slate-100" aria-label="Imagem">
              <Image className="h-4 w-4" />
            </button>
          </div>

          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Digite uma mensagem... use @ para mencionar ou @atenaai para pedir ajuda"
            aria-label="Composer de mensagem"
            className="h-11 flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none transition duration-150 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={isSending || draft.trim().length === 0}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-sm font-semibold text-white transition duration-150 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
});

const RoomSidebarSummary = memo(function RoomSidebarSummary({
  classroom,
  participants,
}: {
  classroom: NonNullable<ClassroomPageModalProps['classroom']>;
  participants: Participant[];
}) {
  const professorName = participants.find((participant) => participant.group === 'professor')?.name || 'Professor';

  return (
    <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.85)]">
      <div className="flex items-center gap-2">
        <h3 className="truncate text-sm font-semibold text-slate-100">{classroom.name || 'Sala'}</h3>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-200">
          Turma
        </span>
      </div>
      <div className="mt-2 space-y-1.5 text-xs text-slate-300">
        <p className="flex items-center justify-between"><span className="text-slate-500">Codigo</span><span className="font-mono text-slate-100">{classroom.code || 'N/A'}</span></p>
        <p className="flex items-center justify-between"><span className="text-slate-500">Professor</span><span className="truncate pl-2 text-slate-100">{professorName}</span></p>
        <p className="flex items-center justify-between"><span className="text-slate-500">Alunos</span><span className="text-slate-100">{participants.length}</span></p>
        <p className="flex items-center justify-between"><span className="text-slate-500">Status</span><span className="inline-flex items-center gap-1 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Ativa</span></p>
      </div>
    </section>
  );
});

const RoomInfoCard = memo(function RoomInfoCard({
  description,
  code,
  onCopyCode,
}: {
  description?: string;
  code?: string;
  onCopyCode: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.85)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Sobre</h3>
        <button
          type="button"
          className="text-xs font-semibold text-blue-300 transition duration-150 hover:text-blue-200"
        >
          Editar
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        {description || 'Sem descricao cadastrada. Adicione orientacoes para a turma.'}
      </p>

      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Codigo da sala</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="font-mono text-sm font-semibold text-slate-100">{code || 'N/A'}</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCopyCode}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-700 px-2.5 text-xs text-slate-200 transition duration-150 hover:border-slate-500 hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-200 transition duration-150 hover:border-slate-500 hover:bg-slate-800"
              aria-label="Ver QR Code"
            >
              <QrCode className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

const ParticipantsCard = memo(function ParticipantsCard({
  participants,
  search,
  onSearch,
}: {
  participants: Participant[];
  search: string;
  onSearch: (value: string) => void;
}) {
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return participants;
    return participants.filter((participant) => participant.name.toLowerCase().includes(normalized));
  }, [participants, search]);

  const visibleParticipants = filtered.slice(0, 5);
  const remainingCount = Math.max(filtered.length - visibleParticipants.length, 0);

  const grouped = useMemo(
    () => ({
      professor: visibleParticipants.filter((participant) => participant.group === 'professor'),
      monitor: visibleParticipants.filter((participant) => participant.group === 'monitor'),
      alunos: visibleParticipants.filter((participant) => participant.group === 'alunos'),
    }),
    [visibleParticipants]
  );

  const renderGroup = (title: string, items: Participant[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
        {items.map((participant) => (
          <div key={participant.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2 transition duration-150 hover:border-slate-600 hover:bg-slate-800/80">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-slate-100">
                {participant.avatar}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-100">{participant.name}</p>
                <p className="text-[11px] text-slate-500">{participant.roleLabel}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400">
              <span className={`h-2 w-2 rounded-full ${presenceDotClassByStatus[participant.status]}`} />
              {presenceLabelByStatus[participant.status]}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="rounded-xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.85)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Participantes</h3>
        <button
          type="button"
          className="rounded-md border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 transition duration-150 hover:border-slate-500 hover:bg-slate-800"
        >
          Ver todos
        </button>
      </div>

      <label className="mt-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar"
          aria-label="Buscar participante"
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      </label>

      <div className="mt-3 space-y-3">
        {renderGroup('Professor', grouped.professor)}
        {renderGroup('Monitor', grouped.monitor)}
        {renderGroup('Alunos', grouped.alunos)}
      </div>

      {remainingCount > 0 && <p className="mt-2 text-xs text-slate-500">+{remainingCount}</p>}
    </section>
  );
});

function toViewModel(messages: ChatMessageItem[]): ChatMessageViewModel[] {
  return messages.map((message, index) => {
    const previous = index > 0 ? messages[index - 1] : null;
    const showMeta =
      !previous ||
      previous.author !== message.author ||
      previous.role !== message.role ||
      previous.dayLabel !== message.dayLabel ||
      message.minutes - previous.minutes > 5;
    const showDayDivider = !previous || previous.dayLabel !== message.dayLabel;

    return {
      ...message,
      showMeta,
      showDayDivider,
    };
  });
}

export default function ClassroomPageModal({
  classroom,
  onClose,
}: ClassroomPageModalProps) {
  const [activeSection, setActiveSection] = useState<RoomSectionId>('chat');
  const [viewState, setViewState] = useState<RoomViewState>('loading');
  const [isSending, setIsSending] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>(MOCK_MESSAGES);
  const [participantSearch, setParticipantSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [renderWindow, setRenderWindow] = useState(80);
  const [reactionsMap, setReactionsMap] = useState<Record<string, string[]>>({});
  const [replyToMessage, setReplyToMessage] = useState<ChatMessageItem | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  if (!classroom) {
    return null;
  }

  const shouldForceError = /erro/i.test(classroom.name || '');
  const title = classroom.name || 'Sala';

  useEffect(() => {
    setViewState('loading');

    const timeout = window.setTimeout(() => {
      setViewState(shouldForceError ? 'error' : 'ready');
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [shouldForceError, classroom.id]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages, isSending]);

  const handleScroll = useCallback(() => {
    const viewport = chatScrollRef.current;
    if (!viewport) return;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 220);
  }, []);

  const handleJumpToLatest = useCallback(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  const handleCopyCode = useCallback(async () => {
    if (!classroom.code) return;
    try {
      await navigator.clipboard.writeText(classroom.code);
    } catch {
      // silent
    }
  }, [classroom.code]);

  const handleCopyMessage = useCallback(async (message: ChatMessageItem) => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // silent
    }
  }, []);

  const handleReplyMessage = useCallback((message: ChatMessageItem) => {
    setReplyToMessage(message);
  }, []);

  const handleStartEdit = useCallback((message: ChatMessageItem) => {
    setEditingMessageId(message.id);
    setEditingDraft(message.content);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingMessageId) return;
    const trimmed = editingDraft.trim();
    if (!trimmed) return;

    setChatMessages((previous) =>
      previous.map((message) =>
        message.id === editingMessageId ? { ...message, content: trimmed } : message
      )
    );
    setEditingMessageId(null);
    setEditingDraft('');
  }, [editingDraft, editingMessageId]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingDraft('');
  }, []);

  const handleReactionToggle = useCallback((messageId: string, reaction: string) => {
    setReactionsMap((previous) => {
      const current = previous[messageId] || [];
      const hasReaction = current.includes(reaction);
      const next = hasReaction
        ? current.filter((item) => item !== reaction)
        : [...current, reaction];

      return {
        ...previous,
        [messageId]: next,
      };
    });
  }, []);

  const handleMentionSelect = useCallback((value: string) => {
    setMessageDraft((previous) => previous.replace(/@[\w]*$/i, `@${value.toLowerCase()} `));
  }, []);

  const handleSuggestionSelect = useCallback((value: string) => {
    setMessageDraft((previous) => `${previous.trim()} ${value}: `.trimStart());
  }, []);

  const handleSendMessage = useCallback(() => {
    const trimmed = messageDraft.trim();
    if (!trimmed) return;

    const createdAt = new Date();
    const userName = classroom.role === 'teacher' ? 'Prof. Voce' : 'Voce';
    const userRole: MessageAuthorRole = classroom.role === 'teacher' ? 'teacher' : 'student';

    const content = replyToMessage
      ? `Respondendo ${replyToMessage.author}: ${trimmed}`
      : trimmed;

    const userMessage: ChatMessageItem = {
      id: `user-${createdAt.getTime()}`,
      author: userName,
      role: userRole,
      avatar: classroom.role === 'teacher' ? 'PV' : 'VC',
      timestamp: createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      minutes: createdAt.getHours() * 60 + createdAt.getMinutes(),
      dayLabel: 'Hoje',
      content,
    };

    setChatMessages((previous) => [...previous, userMessage]);
    setMessageDraft('');
    setReplyToMessage(null);
    setIsSending(true);

    const shouldReplyAsAI = trimmed.toLowerCase().includes('@atenaai');

    window.setTimeout(() => {
      if (shouldReplyAsAI) {
        const aiDate = new Date();
        const aiReply: ChatMessageItem = {
          id: `ai-${Date.now()}`,
          author: 'AtenaAI',
          role: 'ai',
          avatar: 'AI',
          timestamp: aiDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          minutes: aiDate.getHours() * 60 + aiDate.getMinutes(),
          dayLabel: 'Hoje',
          content: 'Sugestao rapida: tente organizar a resolucao em 3 passos, valide cada etapa e finalize com uma conclusao curta.',
        };
        setChatMessages((previous) => [...previous, aiReply]);
      }
      setIsSending(false);
    }, shouldReplyAsAI ? 850 : 360);
  }, [classroom.role, messageDraft, replyToMessage]);

  const handleRetry = useCallback(() => {
    setViewState('loading');
    window.setTimeout(() => setViewState('ready'), 350);
  }, []);

  const messageViewModels = useMemo(() => toViewModel(chatMessages.slice(-renderWindow)), [chatMessages, renderWindow]);
  const unreadIndex = Math.max(messageViewModels.length - 3, 0);

  const typingLabels = useMemo(
    () => ['Professor digitando...', 'Aluno digitando...', 'AtenaAI esta pensando...'],
    []
  );

  const pinnedItems = useMemo(() => chatMessages.slice(-2), [chatMessages]);

  const mainContent = useMemo(() => {
    if (viewState === 'loading') {
      return (
        <div className="space-y-3 px-3 py-4" aria-busy="true">
          <div className="h-14 animate-pulse rounded-xl bg-slate-800/70" />
          <div className="h-20 animate-pulse rounded-xl bg-slate-800/70" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-800/70" />
        </div>
      );
    }

    if (viewState === 'error') {
      return (
        <div className="flex min-h-[320px] items-center justify-center px-4 py-8">
          <div className="max-w-sm rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-center">
            <AlertTriangle className="mx-auto h-7 w-7 text-red-300" />
            <p className="mt-3 text-base font-semibold text-red-100">Nao foi possivel carregar a sala</p>
            <p className="mt-2 text-sm text-red-200/80">Verifique sua conexao e tente novamente.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-red-400"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === 'chat') {
      if (messageViewModels.length === 0) {
        return (
          <div className="flex h-full min-h-[320px] items-center justify-center px-4">
            <div className="max-w-md rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-100">A conversa esta vazia</p>
              <p className="mt-2 text-sm text-slate-400">Comece enviando uma mensagem para sua turma.</p>
              <button
                type="button"
                onClick={() => setMessageDraft('Vamos comecar a conversa!')}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-blue-500"
              >
                Comecar conversa
              </button>
            </div>
          </div>
        );
      }

      return (
        <>
          <ChatViewport
            messages={messageViewModels}
            searchQuery={messageSearch}
            onCopy={handleCopyMessage}
            onReply={handleReplyMessage}
            onEdit={handleStartEdit}
            reactionsMap={reactionsMap}
            onReactionToggle={handleReactionToggle}
            editingMessageId={editingMessageId}
            editingDraft={editingDraft}
            onEditingDraftChange={setEditingDraft}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onLoadOlder={() => setRenderWindow((current) => Math.min(current + 20, chatMessages.length))}
            showJumpToLatest={showJumpToLatest}
            onJumpToLatest={handleJumpToLatest}
            unreadIndex={unreadIndex}
            onScroll={handleScroll}
            viewportRef={chatScrollRef}
          />
          <TypingIndicator labels={typingLabels} />
        </>
      );
    }

    if (activeSection === 'activities') {
      return (
        <div className="space-y-2.5 px-3 py-3">
          {MOCK_ACTIVITIES.map((activity) => (
            <article key={activity.id} className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{activity.title}</p>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${activity.status === 'aberta' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-600/30 text-slate-300'}`}>
                  {activity.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{activity.deadline}</p>
            </article>
          ))}
        </div>
      );
    }

    if (activeSection === 'files') {
      return (
        <div className="space-y-2.5 px-3 py-3">
          {MOCK_FILES.map((file) => (
            <article key={file.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/75 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="rounded-lg bg-slate-800 p-2 text-slate-200">
                  <File className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                  <p className="text-xs text-slate-400">{file.meta}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition duration-150 hover:border-slate-500 hover:bg-slate-800"
              >
                Abrir
              </button>
            </article>
          ))}
        </div>
      );
    }

    if (activeSection === 'members') {
      return (
        <div className="px-3 py-3">
          <ParticipantsCard participants={MOCK_PARTICIPANTS} search={participantSearch} onSearch={setParticipantSearch} />
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-[320px] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-7 text-center">
          <p className="text-base font-semibold text-slate-100">Painel em evolucao</p>
          <p className="mt-2 text-sm text-slate-400">Esta secao ja esta preparada para receber dados dinamicos da sala sem alterar a arquitetura atual.</p>
        </div>
      </div>
    );
  }, [
    activeSection,
    chatMessages.length,
    editingDraft,
    editingMessageId,
    handleCancelEdit,
    handleCopyMessage,
    handleJumpToLatest,
    handleReactionToggle,
    handleReplyMessage,
    handleRetry,
    handleSaveEdit,
    handleScroll,
    handleStartEdit,
    messageSearch,
    messageViewModels,
    participantSearch,
    reactionsMap,
    showJumpToLatest,
    typingLabels,
    unreadIndex,
    viewState,
  ]);

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Pagina da sala"
    >
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-2.5 py-2.5 lg:grid-cols-[minmax(0,4.7fr)_minmax(300px,1fr)] lg:gap-2.5 lg:px-3 lg:py-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40">
          <RoomToolbar searchValue={messageSearch} onSearchChange={setMessageSearch} onOpenMobilePanel={() => setIsMobilePanelOpen(true)} />

          <div className="min-h-0 flex-1">
            {mainContent}
          </div>

          {activeSection === 'chat' && viewState === 'ready' && (
            <Composer
              draft={messageDraft}
              isSending={isSending}
              replyTo={replyToMessage}
              onDraftChange={setMessageDraft}
              onSend={handleSendMessage}
              onCancelReply={() => setReplyToMessage(null)}
              onMentionSelect={handleMentionSelect}
              onSuggestionSelect={handleSuggestionSelect}
            />
          )}
        </section>

        <aside className="hidden min-h-0 flex-col gap-3 lg:flex">
          <RoomSidebarSummary classroom={classroom} participants={MOCK_PARTICIPANTS} />
          <RoomNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
          <RoomContextArea
            activeSection={activeSection}
            participants={MOCK_PARTICIPANTS}
            participantSearch={participantSearch}
            onParticipantSearch={setParticipantSearch}
            description={classroom.description}
            code={classroom.code}
            onCopyCode={handleCopyCode}
            pinnedItems={pinnedItems}
            files={MOCK_FILES}
          />
        </aside>
      </main>

      <AnimatePresence>
        {isMobilePanelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobilePanelOpen(false)}
            />

            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82vh] flex-col gap-3 rounded-t-3xl border-t border-slate-800 bg-slate-950 px-4 py-4 shadow-2xl lg:hidden"
            >
              <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-800" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-100">Painel lateral</p>
                <button
                  type="button"
                  onClick={() => setIsMobilePanelOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-200 transition duration-150 hover:border-slate-600 hover:bg-slate-800"
                  aria-label="Fechar painel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                <RoomSidebarSummary classroom={classroom} participants={MOCK_PARTICIPANTS} />
                <RoomNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
                <RoomContextArea
                  activeSection={activeSection}
                  participants={MOCK_PARTICIPANTS}
                  participantSearch={participantSearch}
                  onParticipantSearch={setParticipantSearch}
                  description={classroom.description}
                  code={classroom.code}
                  onCopyCode={handleCopyCode}
                  pinnedItems={pinnedItems}
                  files={MOCK_FILES}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <h1 className="sr-only">{title}</h1>
    </div>
  );
}

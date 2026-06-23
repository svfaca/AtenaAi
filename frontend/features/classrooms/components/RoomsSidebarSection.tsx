'use client';

import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRooms } from '@/features/classrooms/hooks/useRooms';
import { useAboutModal } from '@/features/about';
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView';
import { useNotification } from '@/lib/hooks/useNotification';
import SidebarRooms from '@/features/student/components/SidebarRooms';
import JoinClassroomModal from '@/features/classrooms/components/modals/JoinClassroomModal';

type RoomsSidebarSectionProps = {
  isCollapsed: boolean;
};

/**
 * RoomsSidebarSection - Feature component
 * 
 * Responsibilities:
 * - Fetch rooms data (useRooms)
 * - Handle room business logic
 * - Render presentation component (SidebarRooms)
 * 
 * This component owns its data and logic.
 * It can be used in any sidebar context.
 */
export default function RoomsSidebarSection({
  isCollapsed,
}: RoomsSidebarSectionProps) {
  const [query, setQuery] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [roomIdToLeave, setRoomIdToLeave] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Data fetching - owned by this feature
  const { rooms, loading, refetch } = useRooms();
  const { closeAbout } = useAboutModal();
  const { openClassroom } = useClassroomView();
  const { success, error: errorToast } = useNotification();

  // Business logic handlers
  const handleJoinRoom = () => {
    closeAbout();
    setJoinCode('');
    setJoinError(null);
    setIsJoinModalOpen(true);
  };

  const handleCloseJoinModal = () => {
    if (isJoining) {
      return;
    }

    setIsJoinModalOpen(false);
    setJoinCode('');
    setJoinError(null);
  };

  const handleJoinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = joinCode.trim().toUpperCase();
    if (!trimmedCode) {
      setJoinError('Digite o codigo da turma para continuar.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: trimmedCode }),
      });

      if (!response.ok) {
        let message = 'Nao foi possivel entrar na sala.';
        try {
          const errorData = await response.json();
          message = errorData?.detail || errorData?.message || message;
        } catch {
          // Ignore parse errors and keep fallback message.
        }
        throw new Error(message);
      }

      await refetch();
      setIsJoinModalOpen(false);
      setJoinCode('');
      setJoinError(null);
      success('Solicitação enviada! Aguarde aprovação da sala.');
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Nao foi possivel entrar na sala.');
      errorToast(error instanceof Error ? error.message : 'Nao foi possivel entrar na sala.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = (roomId: string) => {
    setRoomIdToLeave(roomId);
    setLeaveError(null);
    setIsLeaveModalOpen(true);
  };

  const handleOpenRoom = (roomId: string) => {
    const targetRoom = rooms.find((room) => room.id === roomId);
    if (targetRoom?.status === 'pending') {
      errorToast('Essa sala ainda esta aguardando aprovacao.');
      return;
    }

    closeAbout();
    openClassroom({
      id: targetRoom.id,
      name: targetRoom.name,
      code: targetRoom.code,
      description: targetRoom.description,
      role: 'student',
    });
  };

  const handleCloseLeaveModal = () => {
    if (isLeaving) {
      return;
    }

    setIsLeaveModalOpen(false);
    setRoomIdToLeave(null);
    setLeaveError(null);
  };

  const handleConfirmLeaveRoom = async () => {
    if (!roomIdToLeave) {
      return;
    }

    const targetRoom = rooms.find((room) => room.id === roomIdToLeave);
    const isPendingRoom = targetRoom?.status === 'pending';
    const endpoint = isPendingRoom
      ? `/api/classrooms/${roomIdToLeave}/cancel-request`
      : `/api/classrooms/${roomIdToLeave}/leave`;

    setIsLeaving(true);
    setLeaveError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        let message = 'Nao foi possivel sair da turma.';
        try {
          const errorData = await response.json();
          message = errorData?.detail || errorData?.message || message;
        } catch {
          // Ignore parse errors and keep fallback message.
        }
        throw new Error(message);
      }

      await refetch();
      setIsLeaveModalOpen(false);
      setRoomIdToLeave(null);
      setLeaveError(null);
      const message = isPendingRoom 
        ? 'Solicitação cancelada com sucesso!'
        : 'Você saiu da sala';
      success(message);
    } catch (error) {
      setLeaveError(error instanceof Error ? error.message : 'Nao foi possivel sair da turma.');
      errorToast(error instanceof Error ? error.message : 'Nao foi possivel sair da turma.');
    } finally {
      setIsLeaving(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRooms = normalizedQuery
    ? rooms.filter((room) => room.name.toLowerCase().includes(normalizedQuery))
    : rooms;
  const selectedRoom = roomIdToLeave
    ? rooms.find((room) => room.id === roomIdToLeave)
    : null;
  const isPendingSelection = selectedRoom?.status === 'pending';

  // Render presentation component
  return (
    <>
      <SidebarRooms
        rooms={filteredRooms}
        searchQuery={query}
        onSearchQueryChange={setQuery}
        isCollapsed={isCollapsed}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        onOpenRoom={handleOpenRoom}
      />

      <JoinClassroomModal
        open={isJoinModalOpen}
        code={joinCode}
        errorMessage={joinError}
        isSubmitting={isJoining}
        onCodeChange={(value) => setJoinCode(value.toUpperCase())}
        onClose={handleCloseJoinModal}
        onSubmit={handleJoinSubmit}
      />

      {isLeaveModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/55 px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {isPendingSelection ? 'Cancelar solicitacao' : 'Sair da turma'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {isPendingSelection
                      ? 'Tem certeza que deseja cancelar sua solicitacao de entrada nesta turma?'
                      : 'Tem certeza que deseja sair desta turma? Voce podera entrar novamente apenas com o codigo da turma.'}
                  </p>
                </div>
              </div>

              {leaveError && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {leaveError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseLeaveModal}
                  disabled={isLeaving}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLeaveRoom}
                  disabled={isLeaving}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLeaving
                    ? (isPendingSelection ? 'Cancelando...' : 'Saindo...')
                    : (isPendingSelection ? 'Cancelar solicitacao' : 'Sair da turma')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

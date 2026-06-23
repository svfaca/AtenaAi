'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import CreateClassroomModal from '@/features/classrooms/components/modals/CreateClassroomModal';
import ClassroomRequestDecisionModal from '@/features/classrooms/components/modals/ClassroomRequestDecisionModal';
import { useClassroomView } from '@/features/classrooms/hooks/useClassroomView';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';

type TeacherHomePanelProps = {
  teacherName: string;
};

export default function TeacherHomePanel({ teacherName }: TeacherHomePanelProps) {
  const {
    stats,
    classrooms,
    students,
    loading,
    error,
    createClassroom,
    renameClassroom,
    deleteClassroom,
    approveStudent,
    rejectPendingStudent,
    removeApprovedStudent,
  } = useTeacherDashboard();
  const { openClassroom } = useClassroomView();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingClassroom, setIsCreatingClassroom] = useState(false);
  const [copiedClassroomId, setCopiedClassroomId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [isClassroomSettingsOpen, setIsClassroomSettingsOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [editableClassroomName, setEditableClassroomName] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingClassroomName, setIsSavingClassroomName] = useState(false);
  const [isDeletingClassroom, setIsDeletingClassroom] = useState(false);
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);
  const [pendingStudentToReviewId, setPendingStudentToReviewId] = useState<string | null>(null);

  const openCreateModal = () => {
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreatingClassroom) return;
    setIsCreateModalOpen(false);
    setCreateError(null);
    setNewClassroomName('');
  };

  const handleCreateClassroom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newClassroomName.trim();
    if (!trimmedName) {
      setCreateError('Informe um nome para a turma.');
      return;
    }

    try {
      setIsCreatingClassroom(true);
      setCreateError(null);
      await createClassroom(trimmedName);
      closeCreateModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar turma.';
      setCreateError(message);
    } finally {
      setIsCreatingClassroom(false);
    }
  };

  const handleCopyClassroomCode = async (classroomId: string, code: string) => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(code);
      setCopiedClassroomId(classroomId);
      setTimeout(() => setCopiedClassroomId((current) => (current === classroomId ? null : current)), 1800);
    } catch {
      setCopyError('Nao foi possivel copiar o codigo da turma.');
    }
  };

  const handleOpenClassroomPage = (classroomId: string) => {
    const targetRoom = classrooms.find((room) => room.id === classroomId);
    if (!targetRoom) {
      return;
    }

    openClassroom({
      id: targetRoom.id,
      name: targetRoom.name,
      code: targetRoom.code,
      role: 'teacher',
    });
  };

  const selectedClassroom = useMemo(
    () => classrooms.find((room) => room.id === selectedClassroomId) || null,
    [classrooms, selectedClassroomId]
  );
  const pendingCount = selectedClassroom?.pendingStudents.length ?? 0;
  const approvedCount = selectedClassroom?.approvedStudents.length ?? 0;

  useEffect(() => {
    if (!selectedClassroom) {
      setEditableClassroomName('');
      return;
    }

    setEditableClassroomName(selectedClassroom.name);
  }, [selectedClassroom]);

  const pendingStudentToReview = useMemo(() => {
    if (!selectedClassroom || !pendingStudentToReviewId) return null;

    return selectedClassroom.pendingStudents.find((student) => student.id === pendingStudentToReviewId) || null;
  }, [pendingStudentToReviewId, selectedClassroom]);

  const isDecisionModalOpen = Boolean(selectedClassroom && pendingStudentToReview);

  const openClassroomSettings = (classroomId: string) => {
    setSettingsError(null);
    setSelectedClassroomId(classroomId);
    setIsClassroomSettingsOpen(true);
  };

  const closeClassroomSettings = () => {
    if (isSavingClassroomName || isDeletingClassroom || processingMemberId) return;
    setIsClassroomSettingsOpen(false);
    setSelectedClassroomId(null);
    setSettingsError(null);
    setPendingStudentToReviewId(null);
  };

  const handleSaveClassroomName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedClassroomId) return;

    const trimmedName = editableClassroomName.trim();
    if (!trimmedName) {
      setSettingsError('Informe um nome valido para a turma.');
      return;
    }

    try {
      setSettingsError(null);
      setIsSavingClassroomName(true);
      await renameClassroom(selectedClassroomId, trimmedName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar nome da turma.';
      setSettingsError(message);
    } finally {
      setIsSavingClassroomName(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!selectedClassroom) return;

    const shouldDelete = window.confirm(`Tem certeza que deseja excluir a turma "${selectedClassroom.name}"?`);
    if (!shouldDelete) return;

    try {
      setSettingsError(null);
      setIsDeletingClassroom(true);
      await deleteClassroom(selectedClassroom.id);
      closeClassroomSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir turma.';
      setSettingsError(message);
    } finally {
      setIsDeletingClassroom(false);
    }
  };

  const handleApproveStudent = async (studentId: string) => {
    if (!selectedClassroomId) return;

    try {
      setSettingsError(null);
      setProcessingMemberId(studentId);
      await approveStudent(selectedClassroomId, studentId);
      if (pendingStudentToReviewId === studentId) {
        setPendingStudentToReviewId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar aluno.';
      setSettingsError(message);
    } finally {
      setProcessingMemberId(null);
    }
  };

  const handleRejectPendingStudent = async (studentId: string) => {
    if (!selectedClassroomId) return;

    try {
      setSettingsError(null);
      setProcessingMemberId(studentId);
      await rejectPendingStudent(selectedClassroomId, studentId);
      if (pendingStudentToReviewId === studentId) {
        setPendingStudentToReviewId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover solicitacao pendente.';
      setSettingsError(message);
    } finally {
      setProcessingMemberId(null);
    }
  };

  const handleOpenDecisionModal = (studentId: string) => {
    setSettingsError(null);
    setPendingStudentToReviewId(studentId);
  };

  const handleCloseDecisionModal = () => {
    if (processingMemberId) return;
    setPendingStudentToReviewId(null);
  };

  const handleDecisionApprove = async () => {
    if (!pendingStudentToReview) return;
    await handleApproveStudent(pendingStudentToReview.id);
  };

  const handleDecisionReject = async () => {
    if (!pendingStudentToReview) return;
    await handleRejectPendingStudent(pendingStudentToReview.id);
  };

  const handleRemoveApprovedStudent = async (studentId: string) => {
    if (!selectedClassroomId) return;

    const shouldRemove = window.confirm('Deseja remover este aluno da turma?');
    if (!shouldRemove) return;

    try {
      setSettingsError(null);
      setProcessingMemberId(studentId);
      await removeApprovedStudent(selectedClassroomId, studentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover aluno da turma.';
      setSettingsError(message);
    } finally {
      setProcessingMemberId(null);
    }
  };

  const statStyles = {
    blue: {
      card: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
      value: 'text-blue-600 dark:text-blue-400',
      label: 'text-blue-700/70 dark:text-blue-300/70',
    },
    green: {
      card: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
      value: 'text-green-600 dark:text-green-400',
      label: 'text-green-700/70 dark:text-green-300/70',
    },
    orange: {
      card: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
      value: 'text-orange-600 dark:text-orange-400',
      label: 'text-orange-700/70 dark:text-orange-300/70',
    },
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-gray-900">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
        <section className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Minhas Turmas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crie e gerencie suas salas de aula, Prof. {teacherName}</p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const palette = statStyles[stat.tone];

            return (
              <article key={stat.id} className={`rounded-lg border p-4 ${palette.card}`}>
                <p className={`text-2xl font-bold ${palette.value}`}>{stat.value}</p>
                <p className={`text-sm ${palette.label}`}>{stat.label}</p>
              </article>
            );
          })}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Suas turmas</h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova turma
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((room) => (
              <article
                key={room.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{room.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenClassroomPage(room.id)}
                      className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Abrir turma"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => openClassroomSettings(room.id)}
                      className="rounded-md p-1.5 text-purple-600 transition hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
                      title="Configuracoes"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Codigo da turma:</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 font-mono text-lg text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      {room.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyClassroomCode(room.id, room.code)}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copiedClassroomId === room.id ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <p>{room.students} alunos</p>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {room.pendingRequests} pendente(s)
                  </span>
                </div>
              </article>
            ))}

            {!loading && classrooms.length === 0 ? (
              <article className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                Nenhuma turma encontrada ainda.
              </article>
            ) : null}
          </div>

          {loading ? <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Carregando turmas...</p> : null}
          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">Nao foi possivel carregar os dados das turmas.</p>
          ) : null}
          {copyError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{copyError}</p> : null}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Todos os Alunos</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {students.map((student) => (
              <article
                key={student.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                  {student.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{student.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{student.classroom}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30"
                  title="Remover aluno"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </article>
            ))}

            {!loading && students.length === 0 ? (
              <article className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                Nenhum aluno encontrado.
              </article>
            ) : null}
          </div>

          {loading ? <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Carregando alunos...</p> : null}
        </section>

        <CreateClassroomModal
          open={isCreateModalOpen}
          name={newClassroomName}
          errorMessage={createError}
          isSubmitting={isCreatingClassroom}
          onNameChange={setNewClassroomName}
          onClose={closeCreateModal}
          onSubmit={handleCreateClassroom}
        />

        {isClassroomSettingsOpen && selectedClassroom ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-6 py-5 dark:border-blue-900/40 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-violet-900/20">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Configuracoes da turma</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Gerencie nome, membros e acessos da turma selecionada.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      Codigo: {selectedClassroom.code}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {pendingCount} pendentes
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {approvedCount} aprovados
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeClassroomSettings}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Fechar configuracoes da turma"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto bg-gray-50/70 p-6 dark:bg-gray-900/30">
                <form
                  onSubmit={handleSaveClassroomName}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <label htmlFor="classroom-edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome da turma
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="classroom-edit-name"
                      type="text"
                      value={editableClassroomName}
                      onChange={(event) => setEditableClassroomName(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-blue-500 transition focus:ring-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      maxLength={120}
                      disabled={isSavingClassroomName}
                    />
                    <button
                      type="submit"
                      disabled={isSavingClassroomName}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingClassroomName ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Atualize apenas se necessario. O codigo permanece inalterado.</p>
                </form>

                <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">Solicitacoes pendentes</h4>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {pendingCount}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedClassroom.pendingStudents.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-amber-300/80 bg-white/70 px-3 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
                        Nenhuma solicitacao pendente.
                      </p>
                    ) : (
                      selectedClassroom.pendingStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 dark:border-amber-900/50 dark:bg-gray-900"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{student.email || 'Sem email'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDecisionModal(student.id)}
                              disabled={processingMemberId === student.id}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Decidir
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Membros da turma</h4>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {approvedCount}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedClassroom.approvedStudents.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-emerald-300/80 bg-white/70 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-300">
                        Nenhum membro aprovado nesta turma.
                      </p>
                    ) : (
                      selectedClassroom.approvedStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2 dark:border-emerald-900/50 dark:bg-gray-900"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{student.email || 'Sem email'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveApprovedStudent(student.id)}
                            disabled={processingMemberId === student.id}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                          >
                            Remover
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {settingsError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    {settingsError}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={handleDeleteClassroom}
                  disabled={isDeletingClassroom}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingClassroom ? 'Excluindo turma...' : 'Excluir turma'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <ClassroomRequestDecisionModal
          open={isDecisionModalOpen}
          classroomName={selectedClassroom?.name || ''}
          student={pendingStudentToReview}
          isProcessing={Boolean(processingMemberId)}
          errorMessage={settingsError}
          onClose={handleCloseDecisionModal}
          onApprove={handleDecisionApprove}
          onReject={handleDecisionReject}
        />
      </div>
    </div>
  );
}

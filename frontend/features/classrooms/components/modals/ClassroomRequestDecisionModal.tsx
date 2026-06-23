'use client';

import { Modal } from '@/shared/ui/Modal';

type PendingStudent = {
  id: string;
  name: string;
  email: string;
};

type ClassroomRequestDecisionModalProps = {
  open: boolean;
  classroomName: string;
  student: PendingStudent | null;
  isProcessing: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
};

export default function ClassroomRequestDecisionModal({
  open,
  classroomName,
  student,
  isProcessing,
  errorMessage,
  onClose,
  onApprove,
  onReject,
}: ClassroomRequestDecisionModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Solicitacao de entrada</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Escolha se deseja aprovar ou rejeitar esta solicitacao.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/60 dark:bg-blue-950/30">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Turma</p>
        <p className="mt-1 text-sm font-medium text-blue-900 dark:text-blue-100">{classroomName || 'Turma'}</p>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Aluno</p>
        <p className="mt-1 text-sm font-medium text-blue-900 dark:text-blue-100">{student?.name || 'Aluno'}</p>
        <p className="text-xs text-blue-700/80 dark:text-blue-300/80">{student?.email || 'Sem email'}</p>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isProcessing}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          {isProcessing ? 'Processando...' : 'Rejeitar'}
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={isProcessing}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? 'Processando...' : 'Aprovar'}
        </button>
      </div>
    </Modal>
  );
}

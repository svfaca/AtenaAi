'use client';

import { FormEvent } from 'react';
import { Modal } from '@/shared/ui/Modal';

type JoinClassroomModalProps = {
  open: boolean;
  code: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function JoinClassroomModal({
  open,
  code,
  errorMessage,
  isSubmitting,
  onCodeChange,
  onClose,
  onSubmit,
}: JoinClassroomModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Entrar em uma sala</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Digite o codigo da turma para enviar sua solicitacao.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="join-classroom-code"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Codigo da turma
          </label>
          <input
            id="join-classroom-code"
            type="text"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="Ex.: ABC123"
            autoFocus
            disabled={isSubmitting}
            maxLength={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-base tracking-wider text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

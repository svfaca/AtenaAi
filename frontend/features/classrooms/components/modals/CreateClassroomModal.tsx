'use client';

import { FormEvent } from 'react';
import { Modal } from '@/shared/ui/Modal';

type CreateClassroomModalProps = {
  open: boolean;
  name: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function CreateClassroomModal({
  open,
  name,
  errorMessage,
  isSubmitting,
  onNameChange,
  onClose,
  onSubmit,
}: CreateClassroomModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Criar nova turma</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Defina um nome para sua turma. O codigo sera gerado automaticamente.
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="classroom-name-input"
          >
            Nome da turma
          </label>
          <input
            id="classroom-name-input"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ex: Matematica 9 Ano"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-blue-500 transition focus:ring-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            maxLength={120}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Criando...' : 'Criar turma'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

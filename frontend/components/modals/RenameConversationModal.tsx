'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type RenameConversationModalProps = {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
};

export default function RenameConversationModal({
  isOpen,
  currentTitle,
  onClose,
  onConfirm,
}: RenameConversationModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTitle(currentTitle);
  }, [currentTitle, isOpen]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onConfirm(title.trim());
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-96 rounded-xl bg-gray-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">Renomear conversa</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o novo título..."
          />

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-gray-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

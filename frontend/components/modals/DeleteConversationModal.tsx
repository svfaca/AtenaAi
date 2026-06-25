'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type DeleteConversationModalProps = {
  isOpen: boolean;
  conversationTitle: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConversationModal({
  isOpen,
  conversationTitle,
  onClose,
  onConfirm,
}: DeleteConversationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-96 rounded-xl bg-gray-900 p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-semibold text-red-400">Excluir conversa</h2>

        <p className="mb-1 text-gray-300">
          Tem certeza que deseja excluir <strong>&quot;{conversationTitle}&quot;</strong>?
        </p>

        <p className="mb-4 text-sm text-gray-500">Essa ação não pode ser desfeita.</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-gray-200"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-500"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

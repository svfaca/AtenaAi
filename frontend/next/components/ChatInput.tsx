'use client';

import { toast } from 'sonner';
import { useMessageComposer } from '@/lib/hooks/useMessageComposer';

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const { message, setMessage, isSending, textareaRef, handleSend } = useMessageComposer({
    onSendMessage: onSubmit,
    disabled,
    maxHeight: 128,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Digite uma mensagem!');
      return;
    }

    try {
      await handleSend();
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    }
  };

  return (
    <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-20 py-2 px-4">
      <form onSubmit={handleSubmit} className="flex gap-2 relative items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
          disabled={isSending || disabled}
          placeholder="Envie uma mensagem..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl p-2.5 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm max-h-32 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />

        <button
          type="submit"
          disabled={isSending || disabled || !message.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Enviar mensagem (Enter)"
        >
          {isSending ? (
            <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2z" />
            </svg>
          )}
        </button>
      </form>
      <div className="text-center text-[10px] text-gray-400 mt-1">
        © 2026 AtenaAI — Projeto educacional e experimental.
      </div>
    </div>
  );
}

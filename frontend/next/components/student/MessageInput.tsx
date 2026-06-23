/**
 * ⌨️ MessageInput
 *
 * Client Component
 * - Input para digitar mensagens
 * - Auto-resize do textarea
 * - Envio com Enter ou botão
 */

'use client';

import { useCallback } from 'react';
import { useMessageComposer } from '@/lib/hooks/useMessageComposer';

interface Props {
  onSendMessage: (message: string) => Promise<void> | void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: Props) {
  const { message, setMessage, textareaRef, handleSend, isSending } = useMessageComposer({
    onSendMessage,
    disabled,
    maxHeight: 128,
    clearBeforeSend: true,
    restoreOnError: true,
  });

  const onSend = useCallback(async () => {
    try {
      await handleSend();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [handleSend]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSend();
      }}
      className="flex gap-2 items-end"
    >
      <button
        type="button"
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition flex-shrink-0"
        title="Anexar arquivo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !disabled) {
              void onSend();
            }
          }}
          placeholder="Mensagem..."
          disabled={disabled || isSending}
          rows={1}
          className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed max-h-24 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 w-full"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
          title="Emoji"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <button
        type="submit"
        disabled={disabled || isSending || !message.trim()}
        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 font-medium"
        title="Enviar (Ctrl+Enter)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}

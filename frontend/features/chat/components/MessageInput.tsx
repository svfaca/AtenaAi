'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';

type MessageInputProps = {
  onSubmit?: (message: string) => Promise<boolean>;
  onSend?: (message: string) => Promise<boolean>;
  isLoading?: boolean;
  disabled?: boolean;
};

export default function MessageInput({
  onSubmit,
  onSend,
  isLoading = false,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submit = onSend ?? onSubmit;
  const isDisabled = isLoading || disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    resizeTextarea();
  };

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isDisabled || !submit) return;

    try {
      const sent = await submit(trimmedMessage);

      if (sent) {
        setMessage('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 relative items-end">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Envie uma mensagem..."
        disabled={isDisabled}
        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl p-2.5 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm max-h-32 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <button
        type="submit"
        disabled={!message.trim() || isDisabled || !submit}
        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDisabled ? (
          <svg
            className="w-5 h-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2z"
            />
          </svg>
        )}
      </button>
    </form>
  );
}

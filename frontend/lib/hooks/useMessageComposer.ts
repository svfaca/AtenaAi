'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMessageComposerOptions {
  disabled?: boolean;
  maxHeight?: number;
  clearBeforeSend?: boolean;
  restoreOnError?: boolean;
  onSendMessage: (message: string) => Promise<void> | void;
}

export function useMessageComposer({
  disabled = false,
  maxHeight = 128,
  clearBeforeSend = true,
  restoreOnError = false,
  onSendMessage,
}: UseMessageComposerOptions) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
  }, [message, maxHeight]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  const handleSend = useCallback(async () => {
    const content = message.trim();
    if (!content || disabled || isSending) return;

    const previousValue = message;

    if (clearBeforeSend) {
      setMessage('');
      resetHeight();
    }

    setIsSending(true);
    try {
      await onSendMessage(content);
      if (!clearBeforeSend) {
        setMessage('');
        resetHeight();
      }
    } catch (error) {
      if (restoreOnError) {
        setMessage(previousValue);
      }
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [message, disabled, isSending, clearBeforeSend, onSendMessage, resetHeight, restoreOnError]);

  return {
    message,
    setMessage,
    isSending,
    textareaRef,
    handleSend,
  };
}

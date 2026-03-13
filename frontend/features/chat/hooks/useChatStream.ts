import { useState, useCallback, useRef } from 'react';
import { consumeStreamChatWithRetry } from '@/lib/api/stream-chat';

export interface UseChatStreamOptions {
  /** URL do endpoint de streaming */
  endpoint: string;
  /** Número máximo de tentativas */
  maxRetries?: number;
}

export function useChatStream(options: UseChatStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (payload: any, onToken: (token: string) => void) => {
      setIsStreaming(true);
      setError(null);

      try {
        await consumeStreamChatWithRetry(
          options.endpoint,
          payload,
          onToken,
          options.maxRetries || 2
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao processar stream';
        setError(errorMessage);
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    [options.endpoint, options.maxRetries]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    stream,
    isStreaming,
    error,
    cancel,
  };
}

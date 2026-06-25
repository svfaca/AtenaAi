/**
 * Consumidor de stream de chat - token por token
 */

/**
 * Consome um stream de chat de resposta token por token
 * @param endpoint - URL do endpoint de streaming (/api/chat/stream)
 * @param payload - Dados a enviar
 * @param onToken - Callback chamado para cada token recebido
 * @param onError - Callback chamado se houver erro
 */
export async function consumeStreamChat(
  endpoint: string,
  payload: any,
  onToken: (token: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Para enviar cookies (autenticação)
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    // Verificar se o response é um stream
    if (!response.body) {
      throw new Error('Nenhum stream recebido');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Ler stream token por token
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Stream completado
        if (buffer.trim()) {
          onToken(buffer); // Enviar qualquer conteúdo remanescente
        }
        onComplete();
        break;
      }

      // Decodificar chunk e adicionar ao buffer
      buffer += decoder.decode(value, { stream: true });

      // Processar buffer por tokens (simples - apenas yield conforme chega)
      // Se quiser fazer parsing mais sofisticado (ex: JSON lines), fazer aqui
      if (buffer) {
        onToken(buffer);
        buffer = '';
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Consome um stream de chat com retry automático
 * @param endpoint - URL do endpoint de streaming
 * @param payload - Dados a enviar
 * @param onToken - Callback chamado para cada token recebido
 * @param maxRetries - Número máximo de tentativas (default: 2)
 */
export async function consumeStreamChatWithRetry(
  endpoint: string,
  payload: any,
  onToken: (token: string) => void,
  maxRetries: number = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let completed = false;

      await consumeStreamChat(
        endpoint,
        payload,
        onToken,
        (error) => {
          lastError = error;
        },
        () => {
          completed = true;
        }
      );

      if (completed) {
        return; // Sucesso!
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        // Aguardar um pouco antes de tentar novamente (backoff)
        const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // Todas as tentativas falharam
  throw lastError || new Error('Stream failed after retries');
}

import type { ChatMessage, PublicChatResponse } from '../types/chat.types';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/lib/types';

const CONVERSATIONS_ENDPOINT = '/api/conversations';

export type ChatRateLimitError = {
  type: 'RATE_LIMIT';
  message?: string;
  remaining?: number;
  resetInSeconds: number;
};

export type ConversationListResponse = {
  items: Conversation[];
  total?: number;
};

export type ConversationDetailResponse = {
  conversation: Conversation;
  messages: Message[];
};

export type ConversationMessageResponse = {
  conversation_id: number;
  reply?: string;
  response?: string;
};

async function handleResponse(res: Response) {
  const text = await res.text();

  if (!res.ok) {
    try {
      if (res.status !== 429) {
        console.error("Chat API error:", res.status, text);
      }

      const data = JSON.parse(text);

      if (res.status === 429) {
        throw {
          type: 'RATE_LIMIT',
          message: data.error,
          remaining: data.remaining,
          resetInSeconds: Number(data.resetInSeconds) || 0,
        } as ChatRateLimitError;
      }
    } catch (parseOrRateLimitError) {
      if ((parseOrRateLimitError as Partial<ChatRateLimitError>)?.type === 'RATE_LIMIT') {
        throw parseOrRateLimitError;
      }

      // Ignore parse errors and fall back to generic error below.
    }

    throw new Error(`Erro ao enviar mensagem (${res.status})`);
  }

  return JSON.parse(text);
}

export async function sendPublicMessage(message: string): Promise<PublicChatResponse> {
  if (!message.trim()) {
    throw new Error("Mensagem vazia");
  }

  const res = await fetch('/api/chat/public', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: message
    }),
  });

  return handleResponse(res);
}

export async function sendPublicMessageWithHistory(
  message: string,
  history: ChatMessage[]
): Promise<PublicChatResponse> {
  if (!message.trim()) {
    throw new Error("Mensagem vazia");
  }

  console.log("PAYLOAD ENVIADO:", {
    text: message,
    history,
  });

  const res = await fetch('/api/chat/public', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: message,
      history
    }),
  });

  return handleResponse(res);
}

export async function listConversations(): Promise<ConversationListResponse> {
  return api<ConversationListResponse>(CONVERSATIONS_ENDPOINT, {
    method: 'GET',
  });
}

export async function createConversation(title = 'Nova conversa'): Promise<Conversation> {
  return api<Conversation>(CONVERSATIONS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getConversation(conversationId: number): Promise<ConversationDetailResponse> {
  return api<ConversationDetailResponse>(`${CONVERSATIONS_ENDPOINT}/${conversationId}`, {
    method: 'GET',
  });
}

export async function sendConversationMessage(
  conversationId: number,
  text: string
): Promise<ConversationMessageResponse> {
  return api<ConversationMessageResponse>(`${CONVERSATIONS_ENDPOINT}/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * Stream conversation message token by token
 * @param conversationId - ID da conversa
 * @param text - Texto da mensagem
 * @param onToken - Callback chamado para cada token recebido
 * @returns Promise que resolve quando o streaming terminar
 */
export async function streamConversationMessage(
  conversationId: number,
  text: string,
  onToken: (token: string) => void
): Promise<void> {
  const response = await fetch(`${CONVERSATIONS_ENDPOINT}/${conversationId}/messages/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao enviar mensagem: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body não disponível');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Chama callback para cada token
      onToken(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream public chat message token by token
 * @param text - Texto da mensagem
 * @param history - Histórico de mensagens anteriores
 * @param onToken - Callback chamado para cada token recebido
 * @returns Promise que resolve quando o streaming terminar
 */
export async function streamPublicMessage(
  text: string,
  history: ChatMessage[],
  onToken: (token: string) => void
): Promise<void> {
  const response = await fetch('/api/chat/public/stream', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message: text, 
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }),
  });

  if (!response.ok) {
    const status = response.status;
    
    // Tentar extrair informações de rate limit
    if (status === 429) {
      try {
        const errorData = await response.json();
        throw {
          type: 'RATE_LIMIT',
          message: errorData.error,
          remaining: errorData.remaining,
          resetInSeconds: Number(errorData.resetInSeconds) || 0,
        } as ChatRateLimitError;
      } catch (parseError) {
        if ((parseError as Partial<ChatRateLimitError>)?.type === 'RATE_LIMIT') {
          throw parseError;
        }
      }
    }
    
    throw new Error(`Erro ao enviar mensagem: ${status}`);
  }

  if (!response.body) {
    throw new Error('Response body não disponível');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Chama callback para cada token
      onToken(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Rename a conversation
 */
export async function renameConversation(
  conversationId: number,
  title: string
): Promise<Conversation> {
  return api<Conversation>(`${CONVERSATIONS_ENDPOINT}/${conversationId}`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  return api<void>(`${CONVERSATIONS_ENDPOINT}/${conversationId}`, {
    method: 'DELETE',
  });
}

/**
 * Duplicate a conversation
 */
export async function duplicateConversation(
  conversationId: number
): Promise<Conversation> {
  return api<Conversation>(`${CONVERSATIONS_ENDPOINT}/${conversationId}/duplicate`, {
    method: 'POST',
  });
}

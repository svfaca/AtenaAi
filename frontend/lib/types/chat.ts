/**
 * Tipos relacionados a conversas e mensagens
 */

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  messages: Message[];
}

export interface MessageCreate {
  text: string;
  content?: string;
  language?: string;
  conversation_id?: number;
  user_id?: number;
  history_limit?: number;
}

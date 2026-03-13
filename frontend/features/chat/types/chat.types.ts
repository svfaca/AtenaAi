export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatMessageWithTimestamp extends ChatMessage {
  timestamp?: Date;
}

export interface StreamChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  created_at?: string;
}

export interface PublicChatResponse {
  response?: string;
  reply?: string;
}

export type Message = {
  id: number | string;
  role: "user" | "assistant" | string;
  content: string;
  created_at?: string | null;
  is_optimistic?: boolean;
};

export type Conversation = {
  id: number;
  title?: string | null;
  name?: string | null;
  last_message?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type ConversationsResponse = {
  items: Conversation[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
};

export type ConversationDetailResponse = {
  conversation?: {
    id: number;
    title?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  messages: Message[];
  message_total: number;
  message_skip: number;
  message_limit: number;
  messages_has_more: boolean;
};

export type Classroom = {
  id: number;
  name: string;
  code: string;
  status?: "approved" | "pending" | string;
  teacher?: {
    full_name: string;
  } | null;
  student_count?: number;
};

/**
 * 📱 StudentDashboard
 * 
 * Client Component
 * - Renderiza apenas o ChatWindow
 * - Lê selectedConversation do ScholarContext
 */

"use client";

import { useChat } from "@/features/chat/hooks";
import { useNavigationState } from "@/features/navigation/hooks/useNavigationState";
import { ChatWindow } from "./ChatWindow";

export function StudentDashboard() {
  const { conversations } = useChat();
  const { conversationId } = useNavigationState();

  const selectedConversation = conversations.find(
    (c) => c.id === conversationId
  ) ?? null;

  return <ChatWindow selectedConversation={selectedConversation} />;
}

/**
 * 📱 StudentDashboard
 * 
 * Client Component
 * - Renderiza apenas o ChatWindow
 * - Lê selectedConversation do ScholarContext
 */

"use client";

import { useScholar } from "@/lib/contexts/ScholarContext";
import { ChatWindow } from "./ChatWindow";

export function StudentDashboard() {
  const { selectedConversation } = useScholar();
  
  return <ChatWindow selectedConversation={selectedConversation} />;
}

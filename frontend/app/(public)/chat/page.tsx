'use client';

import PublicChatWindow from '@/features/chat/components/PublicChatWindow';

/**
 * Chat público (rota /chat).
 *
 * Reutiliza o PublicChatWindow (mesmo fluxo da home): streaming token a token,
 * limite diário de visitantes com CTA de criação de conta e modais de
 * login/signup — evita duplicar a lógica de rate limit/CTA.
 */
export default function ChatPage() {
  return <PublicChatWindow />;
}

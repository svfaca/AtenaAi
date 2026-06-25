'use client';

import { usePublicChat } from '@/features/chat/hooks/usePublicChat';
import { useLimitTimer } from '@/lib/hooks/useLimitTimer';
import MessageList from '@/features/chat/components/MessageList';
import MessageInput from '@/features/chat/components/MessageInput';
import Footer from '@/shared/layout/Footer';

function formatRemainingTime(totalSecondsInput: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalSecondsInput));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export default function HomeChatWindow() {
  const { messages, loading, sendMessage, limitReached } = usePublicChat();
  const remaining = useLimitTimer();

  const handleSubmit = async (content: string): Promise<boolean> => {
    return sendMessage(content);
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-white dark:bg-gray-900">
      <MessageList messages={messages} />

      {limitReached && (
        <div className="p-4 text-red-500 text-sm text-center border-t border-red-300">
          Voce atingiu o limite de mensagens sem login.
          <br />
          Crie uma conta para continuar ou aguarde o tempo reiniciar.
          <p className="text-red-500 mt-2">Aguarde {formatRemainingTime(remaining)} para continuar</p>
        </div>
      )}

      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-20 py-2 px-4">
        <MessageInput onSubmit={handleSubmit} isLoading={loading} />
        <Footer />
      </div>
    </div>
  );
}

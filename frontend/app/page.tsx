'use client';

import PublicHeader from '@/shared/layout/PublicHeader';
import ChatWindow from '@/features/chat/components/ChatWindow';
import PublicChatWindow from '@/features/chat/components/PublicChatWindow';
import { useAuth } from '@/features/auth';
import StudentArea from '@/features/student/components/StudentArea';

export default function HomePage() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return (
      <StudentArea 
        userName={user.full_name || user.nickname || 'Estudante'}
        userAvatar={user.profile_image}
      >
        <ChatWindow />
      </StudentArea>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" suppressHydrationWarning>
      <PublicHeader />
      <PublicChatWindow />
    </div>
  );
}

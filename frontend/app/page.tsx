'use client';

import PublicLayout from '@/features/public/components/PublicLayout';
import PublicChatWindow from '@/features/chat/components/PublicChatWindow';
import { useAuth } from '@/features/auth';
import StudentArea from '@/features/student/components/StudentArea';
import { TeacherPageClient } from '@/features/teacher';

export default function HomePage() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return (
      <StudentArea 
        userName={user.full_name || user.nickname || 'Estudante'}
        userAvatar={user.profile_image}
      />
    );
  }

  if (user?.role === 'teacher') {
    return <TeacherPageClient />;
  }

  return (
    <PublicLayout>
      <PublicChatWindow />
    </PublicLayout>
  );
}

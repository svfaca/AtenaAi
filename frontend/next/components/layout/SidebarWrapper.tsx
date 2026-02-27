'use client';

import type { Classroom, Conversation } from '@/lib/types';
import { StudentSidebarMobile } from '@/components/student/StudentSidebarMobile';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import type { Session } from '@/lib/types/auth';

interface Props {
  session: Session;
  classrooms: Classroom[];
  conversations: Conversation[];
  selectedConversationId?: number;
  onConversationSelect: (conversation: Conversation) => void;
  error?: string | null;
}

export function SidebarWrapper({
  session,
  classrooms,
  conversations,
  selectedConversationId,
  onConversationSelect,
  error,
}: Props) {
  // Renderizar sidebar apenas para estudantes
  const isStudent = session.role === 'scholar' || session.role === 'student';

  if (!isStudent) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay sidebar */}
      <StudentSidebarMobile
        classrooms={classrooms}
        conversations={conversations}
        error={error}
      />

      {/* Desktop sidebar - empurra tudo */}
      <StudentSidebar
        classrooms={classrooms}
        conversations={conversations}
        error={error}
      />
    </>
  );
}

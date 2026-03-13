import { redirect } from 'next/navigation';
import StudentLayout from '@/features/student/components/StudentLayout';
import ChatWindow from '@/features/chat/components/ChatWindow';
import { getCurrentUser } from '@/features/auth/services/auth.service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Chat - AtenaAI Estudante',
  description: 'Chat com IA para estudantes',
};

export default async function ScholarPage() {
  // Verificar autenticação
  const userData = await getCurrentUser();
  
  if (!userData || userData.user?.role !== 'student') {
    redirect('/');
  }

  return (
    <StudentLayout>
      <ChatWindow />
    </StudentLayout>
  );
}

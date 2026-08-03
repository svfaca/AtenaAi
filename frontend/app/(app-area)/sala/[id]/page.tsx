/**
 * 🏫 Sala com ID
 * 
 * 🔒 Server Component
 * ✅ Valida acesso
 * ⚠️ Fallback temporário até concluir SalaChatWindow + server API
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-api';
import StudentArea from '@/features/student/components/StudentArea';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  return {
    title: `Sala ${id} - AtenaAI`
  };
}

export default async function SalaPage({ params }: Props) {
  const { id } = await params;
  const userData = await getCurrentUser();

  if (!userData) {
    redirect('/');
  }

  return (
    <StudentArea userName={(userData as any)?.full_name || (userData as any)?.nickname || 'Estudante'} userAvatar={(userData as any)?.profile_image}>
      <section className="p-6">
        <h1 className="text-2xl font-semibold">Sala {id}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Esta tela esta em migracao. Enquanto isso, use o chat principal em /scholar.
        </p>
      </section>
    </StudentArea>
  );
}

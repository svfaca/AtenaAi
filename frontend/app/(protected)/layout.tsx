import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import RoleBasedHeader from '@/components/layout/RoleBasedHeader';

/**
 * Layout Protegido - Verifica autenticação antes de renderizar
 * Delega a composição da sidebar para as feature pages (StudentArea, TeacherPageClient)
 *
 * Estrutura simples:
 * - Header
 * - Main (children)
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex-col">
      <div className="shrink-0 z-10">
        <RoleBasedHeader session={session} />
      </div>
      <main className="flex-1 overflow-auto flex">{children}</main>
    </div>
  );
}

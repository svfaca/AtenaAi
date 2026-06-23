import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import RoleBasedHeader from '@/components/layout/RoleBasedHeader';
import { MobileMenuProvider } from '@/components/context/MobileMenuContext';
import { StudentSidebarMobile } from '@/components/student/StudentSidebarMobile';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { ScholarProvider } from '@/lib/contexts/ScholarContext';
import { getStudentClassrooms, getStudentConversations } from '@/lib/server-api';

/**
 * Layout Protegido - Verifica autenticação antes de renderizar
 * Sem useEffect, sem chamadas de cliente para verificar sessão
 * Renderiza o header correto baseado na role do usuário
 * Fornece contexto de mobile menu para sidebar
 * 
 * Estrutura:
 * - Horizontal flex (h-screen):
 *   - StudentSidebar (hidden md:flex) - empurra tudo para a direita
 *   - Vertical flex-col container (flex-1):
 *     - Header
 *     - Main (children)
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

  // Carregar dados da sidebar
  let classrooms = [];
  let conversations = [];
  let error = null;

  try {
    const [classroomsData, conversationsData] = await Promise.all([
      getStudentClassrooms(),
      getStudentConversations(25, 0)
    ]);

    classrooms = classroomsData || [];
    conversations = conversationsData?.items || [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro ao carregar dados";
  }

  return (
    <MobileMenuProvider>
      <ScholarProvider initialConversation={conversations[0] || null}>
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {/* Mobile sidebar overlay */}
          <StudentSidebarMobile
            classrooms={classrooms}
            conversations={conversations}
            error={error}
          />

          {/* Desktop sidebar - começa do topo */}
          <StudentSidebar
            classrooms={classrooms}
            conversations={conversations}
            error={error}
          />

          {/* Header + Main container (flex-1 para sidebar em desktop) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 z-10">
              <RoleBasedHeader session={session} />
            </div>
            <main className="flex-1 overflow-auto flex">{children}</main>
          </div>
        </div>
      </ScholarProvider>
    </MobileMenuProvider>
  );
}

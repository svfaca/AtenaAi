/**
 * 📱 Estudante - Dashboard
 * 
 * 🔒 Server Component
 * ✅ Busca dados necessários no servidor
 * ✅ Passa para componentes cliente via props
 * ✅ ZERO useEffect, ZERO estado global
 */

import type { Metadata } from 'next';
import { getStudentConversations, getStudentClassrooms } from "@/lib/server-api";
import { ScholarLayoutContent } from "@/components/scholar/ScholarLayoutContent";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Chat - Estudante',
  description: 'Chat com IA para estudantes',
};

export default async function ScholarDashboardPage() {
  // ✅ Validar permissão - Backend usa 'student', frontend pode usar 'scholar'
  console.log('[ScholarPage] Starting to load...');
  
  try {
    await requireRole(['scholar', 'student']);
  } catch (error) {
    console.error('[ScholarPage] Authorization failed:', error);
    throw error;
  }

  // ✅ Buscar tudo no servidor (seguro e performático)
  let classrooms = [];
  let conversations = [];
  let error = null;

  try {
    console.log('[ScholarPage] Fetching data from backend...');
    const [classroomsData, conversationsData] = await Promise.all([
      getStudentClassrooms(),
      getStudentConversations(25, 0)
    ]);

    classrooms = classroomsData || [];
    conversations = conversationsData?.items || [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro ao carregar dados";
    console.error('[ScholarPage] Data fetch failed:', error);
  }

  console.log('[ScholarPage] Rendering dashboard');

  return (
    <ScholarLayoutContent
      initialClassrooms={classrooms}
      initialConversations={conversations}
      error={error}
    >
      <StudentDashboard />
    </ScholarLayoutContent>
  );
}

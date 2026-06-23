/**
 * 📱 Estudante - Dashboard (Legacy)
 * 
 * 🔒 Server Component
 * ✅ Busca dados necessários no servidor
 * ✅ Passa para componentes cliente via props
 * ✅ ZERO useEffect, ZERO estado global
 * 
 * ⚠️ Nota: Use /scholar para nova estrutura
 */

import { getStudentConversations, getStudentClassrooms } from "@/lib/server-api";
import { ScholarLayoutContent } from "@/components/scholar/ScholarLayoutContent";
import { StudentDashboard } from "@/components/student/StudentDashboard";

export default async function EstudantePage() {
  // ✅ Buscar tudo no servidor (seguro e performático)
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
    console.error("[EstudantePage]", error);
  }

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

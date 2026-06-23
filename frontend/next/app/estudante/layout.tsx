/**
 * 📱 Estudante Layout
 * 
 * Server Component
 * - Validação de permissão
 * - Estrutura do layout (sidebar + main area)
 */

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isStudent } from "@/lib/auth";
import { ScholarProvider } from "@/lib/contexts/ScholarContext";

interface Props {
  children: ReactNode;
}

export const metadata = {
  title: "Chat - AtenaAI Estudante",
  description: "Chat com IA para estudantes"
};

export default async function EstudanteLayout({ children }: Props) {
  // ✅ Validar permissão
  const isStudentUser = await isStudent();
  if (!isStudentUser) {
    redirect("/");
  }

  return (
    <ScholarProvider initialConversation={null}>
      <div className="flex flex-1 w-full overflow-hidden">
        {children}
      </div>
    </ScholarProvider>
  );
}

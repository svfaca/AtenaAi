/**
 * 🏫 Sala com ID
 * 
 * 🔒 Server Component
 * ✅ Busca mensagens da sala no servidor
 * ✅ Valida acesso à sala
 * ✅ Pass to Client Component
 */

import { getClassroomDetails, getClassroomMessages } from "@/lib/server-api";
import { SalaChatWindow } from "@/components/student/SalaChatWindow";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  try {
    const classroom = await getClassroomDetails(params.id);
    return {
      title: `${classroom.name} - AtenaAI`
    };
  } catch {
    return {
      title: "Sala - AtenaAI"
    };
  }
}

export default async function SalaPage({ params }: Props) {
  try {
    // ✅ Buscar dados da sala no servidor
    const [classroom, messages] = await Promise.all([
      getClassroomDetails(params.id),
      getClassroomMessages(params.id)
    ]);

    return (
      <SalaChatWindow
        classroom={classroom}
        initialMessages={messages}
      />
    );
  } catch (error) {
    console.error("[SalaPage] Error:", error);
    notFound();
  }
}

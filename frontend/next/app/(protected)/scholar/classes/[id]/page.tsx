import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';

type Params = Promise<{ id: string }>;

export const generateMetadata = async (props: {
  params: Params;
}): Promise<Metadata> => {
  const params = await props.params;
  return {
    title: `Turma ${params.id}`,
  };
};

export default async function ClassDetailPage(props: {
  params: Params;
}) {
  const params = await props.params;
  const session = await requireRole('scholar');

  // Aqui você buscaria dados do servidor/API
  const classData = {
    id: params.id,
    name: `Turma ${params.id}`,
    professor: 'Prof. João Silva',
    studentsCount: 30,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{classData.name}</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Professor: {classData.professor}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold mb-4">Informações da Turma</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Total de alunos: {classData.studentsCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold mb-4">Conteúdo</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Conteúdo da turma aparecerá aqui...
          </p>
        </div>
      </div>
    </div>
  );
}

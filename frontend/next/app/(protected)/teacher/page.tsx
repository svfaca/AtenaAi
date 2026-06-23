import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard - Professor',
};

export default async function TeacherDashboardPage() {
  const session = await requireRole('teacher');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Olá, Prof. {session.name}!</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gerencie suas turmas e monitore o progresso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Turmas" value="5" />
        <StatCard label="Alunos" value="120" />
        <StatCard label="Atividades" value="34" />
        <StatCard label="Taxa de Conclusão" value="76%" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold mb-4">Relatórios</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Seus relatórios analíticos virão aqui...
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

'use client';

type TeacherIntroModalProps = {
  teacherName: string;
};

export default function TeacherIntroModal({ teacherName }: TeacherIntroModalProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-900 dark:border-slate-700 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Sobre o painel do professor"
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Professor</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Bem-vindo, {teacherName}</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Este painel foi redesenhado para centralizar gestão de turmas, acompanhamento de alunos e ações rápidas.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Gestão de Turmas</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Crie turmas, acompanhe solicitações pendentes e compartilhe códigos de acesso.
              </p>
            </article>
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Visão de Alunos</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Consulte todos os alunos em um único lugar, com contexto de turma e ações rápidas.
              </p>
            </article>
            <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Fluxo Otimizado</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Layout mais limpo, foco em produtividade e menos dependência de componentes legados.
              </p>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}

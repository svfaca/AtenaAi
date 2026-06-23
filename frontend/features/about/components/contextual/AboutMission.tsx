type AboutMissionProps = {
  mission: string
  vision?: string
}

export function AboutMission({ mission, vision }: AboutMissionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Missao</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{mission}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Visao</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {vision || 'Tornar o aprendizado assistido por IA mais acessivel e efetivo para todos.'}
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

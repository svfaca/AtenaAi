type AboutDifferentialProps = {
  items: string[]
}

export function AboutDifferential({ items }: AboutDifferentialProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Por que a AtenaAI e diferente</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Diferente de chats de IA genericos, a AtenaAI integra elementos reais da jornada educacional.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="mt-0.5 text-green-600">✔</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-6 text-slate-700 dark:text-slate-200">
            Isso permite uma experiencia de aprendizado mais contextualizada e eficaz.
          </p>
        </div>
      </div>
    </section>
  )
}

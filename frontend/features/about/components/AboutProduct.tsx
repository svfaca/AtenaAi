type AboutProductProps = {
  title: string
  description: string
  capabilities: string[]
}

export function AboutProduct({ title, description, capabilities }: AboutProductProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
      <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300">{title}</h3>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{description}</p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {capabilities.map((capability) => (
          <li
            key={capability}
            className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-emerald-800 dark:bg-slate-900/40 dark:text-slate-100"
          >
            {capability}
          </li>
        ))}
      </ul>
    </section>
  )
}
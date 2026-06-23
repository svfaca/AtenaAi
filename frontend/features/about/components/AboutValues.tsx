type AboutValuesProps = {
  values: string[]
}

export function AboutValues({ values }: AboutValuesProps) {
  return (
    <article className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900 dark:bg-violet-950/30">
      <h3 className="text-base font-bold text-violet-900 dark:text-violet-300">Valores</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {values.map((value) => (
          <li key={value} className="flex gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-violet-500" />
            <span>{value}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

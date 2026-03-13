type AboutValuesProps = {
  values: string[]
}

export function AboutValues({ values }: AboutValuesProps) {
  return (
    <article className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6">
      <h3 className="text-lg font-bold text-violet-900">Valores</h3>
      <ul className="mt-3 space-y-2 text-slate-700">
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

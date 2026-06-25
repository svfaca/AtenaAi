type AboutVisionProps = {
  text: string
}

export function AboutVision({ text }: AboutVisionProps) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
      <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300">Visao</h3>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{text}</p>
    </article>
  )
}

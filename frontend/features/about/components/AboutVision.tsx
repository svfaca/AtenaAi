type AboutVisionProps = {
  text: string
}

export function AboutVision({ text }: AboutVisionProps) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
      <h3 className="text-lg font-bold text-emerald-900">Visao</h3>
      <p className="mt-2 text-slate-700">{text}</p>
    </article>
  )
}

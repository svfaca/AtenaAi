type AboutMissionProps = {
  text: string
}

export function AboutMission({ text }: AboutMissionProps) {
  return (
    <article className="rounded-2xl border border-sky-200 bg-sky-50/70 p-6">
      <h3 className="text-lg font-bold text-sky-900">Missao</h3>
      <p className="mt-2 text-slate-700">{text}</p>
    </article>
  )
}

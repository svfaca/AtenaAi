type AboutMissionProps = {
  text: string
}

export function AboutMission({ text }: AboutMissionProps) {
  return (
    <article className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-900 dark:bg-sky-950/30">
      <h3 className="text-base font-bold text-sky-900 dark:text-sky-300">Missao</h3>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{text}</p>
    </article>
  )
}

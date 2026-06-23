type AboutHeroProps = {
  title: string
  subtitle: string
}

export function AboutHero({ title, subtitle }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-cyan-50 p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-300/30 blur-2xl" />
      <div className="absolute -bottom-8 left-8 h-20 w-20 rounded-full bg-cyan-300/30 blur-2xl" />
      <div className="relative">
        <p className="mb-2 inline-flex rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Plataforma
        </p>
        <h2 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm text-slate-700 sm:text-base">{subtitle}</p>
      </div>
    </section>
  )
}

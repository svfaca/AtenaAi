type AboutHeroProps = {
  title: string
  subtitle: string
}

export function AboutHero({ title, subtitle }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 p-8 sm:p-12">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
      <div className="absolute -bottom-8 left-8 h-24 w-24 rounded-full bg-teal-300/30 blur-2xl" />
      <div className="relative">
        <p className="mb-3 inline-flex rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Quem somos
        </p>
        <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base text-slate-700 sm:text-lg">{subtitle}</p>
      </div>
    </section>
  )
}

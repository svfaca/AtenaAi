import type { AboutCard } from '../../data/aboutPageData'

type AboutAudienceProps = {
  items: AboutCard[]
}

export function AboutAudience({ items }: AboutAudienceProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Para quem e a AtenaAI</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl">{item.icon}</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

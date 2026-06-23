import type { AboutCard } from '../../data/aboutPageData'

type AboutFeaturesProps = {
  items: AboutCard[]
}

export function AboutFeatures({ items }: AboutFeaturesProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">O que voce pode fazer com a AtenaAI</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl">{item.icon}</p>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

import type { AboutCard } from '../../data/aboutPageData'

type AboutProblemProps = {
  items: AboutCard[]
}

export function AboutProblem({ items }: AboutProblemProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">O problema da aprendizagem tradicional</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
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

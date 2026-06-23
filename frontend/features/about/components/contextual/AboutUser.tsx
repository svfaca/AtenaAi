import { aboutPageData } from '../../data/aboutPageData'
import { AboutCTA } from './AboutCTA'

export function AboutUser() {
  const content = aboutPageData.user

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">{content.title}</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-slate-600 dark:text-slate-300">{content.intro}</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">O sistema combina</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {content.systemCombines.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">O que voce pode fazer aqui</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {content.canDo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Filosofia da plataforma</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{content.philosophy}</p>
          </article>
        </div>
      </section>

      <AboutCTA title="Proximos passos" actions={content.ctas} />
    </div>
  )
}

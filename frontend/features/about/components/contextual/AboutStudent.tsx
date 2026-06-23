import { aboutPageData } from '../../data/aboutPageData'
import { useAboutModal } from '@/features/about'
import { AboutCTA } from './AboutCTA'

export function AboutStudent() {
  const content = aboutPageData.student
  const { closeAbout } = useAboutModal()

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">{content.title}</h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-slate-600 dark:text-slate-300">{content.intro}</p>

          <article className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Voce pode usar a plataforma para</h2>
            <ul className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              {content.uses.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>

          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Como aprender melhor na AtenaAI</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {content.tips.map((tip) => (
                <div key={tip.title} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-2xl">{tip.icon}</p>
                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{tip.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{tip.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
            <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">Dica importante</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{content.importantTip}</p>
          </article>
        </div>
      </section>

      <AboutCTA
        title="Pronto para estudar agora?"
        actions={[{ label: content.ctaLabel, href: content.ctaHref }]}
        onActionClick={closeAbout}
      />
    </div>
  )
}

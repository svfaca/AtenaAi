import Link from 'next/link'
import type { AboutHeroContent } from '../../data/aboutPageData'

type AboutHeroProps = {
  content: AboutHeroContent
  showMockup?: boolean
}

export function AboutHero({ content, showMockup = false }: AboutHeroProps) {
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">{content.title}</h1>
          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">{content.subtitle}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={content.primaryActionHref}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {content.primaryActionLabel}
            </Link>
            {content.secondaryActionLabel && content.secondaryActionHref ? (
              <Link
                href={content.secondaryActionHref}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {content.secondaryActionLabel}
              </Link>
            ) : null}
          </div>
        </div>

        {showMockup ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Mockup Chat IA</p>
            <div className="space-y-3">
              <div className="max-w-[85%] rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Professor, posso revisar funcoes quadraticas com voce?
              </div>
              <div className="ml-auto max-w-[85%] rounded-xl bg-blue-600 px-3 py-2 text-sm text-white">
                Claro. Vamos por passos e com exemplos praticos para seu nivel.
              </div>
              <div className="max-w-[85%] rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Mostre um exercicio e depois me avalie.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

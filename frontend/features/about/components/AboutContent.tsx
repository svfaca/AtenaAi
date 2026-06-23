'use client'

import Footer from '@/shared/layout/Footer'
import { aboutData } from '../data/aboutData'
import { AboutHero } from './AboutHero'
import { AboutMission } from './AboutMission'
import { AboutProduct } from './AboutProduct'
import { AboutValues } from './AboutValues'
import { AboutVision } from './AboutVision'

type AboutContentProps = {
  onClose?: () => void
}

export function AboutContent({ onClose }: AboutContentProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-gray-950/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            <AboutHero title={aboutData.hero.title} subtitle={aboutData.hero.subtitle} />

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{aboutData.problem.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {aboutData.problem.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            <AboutProduct
              title={aboutData.product.title}
              description={aboutData.product.description}
              capabilities={aboutData.product.capabilities}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <AboutMission text={aboutData.mission} />
              <AboutVision text={aboutData.vision} />
            </div>

            <AboutValues values={aboutData.values} />

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">{aboutData.cta.title}</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{aboutData.cta.description}</p>
              <button
                onClick={onClose}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {aboutData.cta.actionLabel}
              </button>
            </section>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">{aboutData.footer}</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Footer />
        </div>
      </footer>
    </>
  )
}
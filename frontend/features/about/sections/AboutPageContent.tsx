'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth, LoginModal, SignupModal } from '@/features/auth'
import { AboutValues } from '../components/AboutValues'
import { AboutCreator } from '../components/AboutCreator'
import { AboutCta } from '../components/AboutCta'
import { aboutData } from '../data/aboutData'
import { HeroSection } from './HeroSection'
import { MissionSection } from './MissionSection'
import { VisionSection } from './VisionSection'

type AboutUser = {
  full_name?: string
  role?: 'scholar' | 'student' | 'teacher' | 'admin'
}

export function AboutPageContent() {
  const [user, setUser] = useState<AboutUser | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const { refreshUser } = useAuth()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.status === 401) return
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        }
      } catch {
        // No-op: unauthenticated or network issue
      }
    }

    loadUser()
  }, [])

  const dashboardPath = useMemo(() => {
    if (user?.role === 'teacher') return '/app-area/professor'
    if (user?.role === 'admin') return '/admin'
    return '/app-area/estudante'
  }, [user?.role])

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <HeroSection />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{aboutData.problem.title}</h2>
        <div className="mt-4 space-y-3 text-slate-700 dark:text-slate-300">
          {aboutData.problem.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">{aboutData.solution.title}</h2>
        <p className="mt-3 text-slate-700 dark:text-slate-200">{aboutData.solution.text}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <MissionSection />
        <VisionSection />
      </div>

      <AboutValues values={aboutData.values} />

      <AboutCreator
        name={aboutData.creator.name}
        bio={aboutData.creator.bio}
        imageSrc={aboutData.creator.imageSrc}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contato</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {aboutData.contacts.map((contact) => (
            <a
              key={contact.label}
              href={contact.href}
              target={contact.href.startsWith('http') ? '_blank' : undefined}
              rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-600 dark:hover:bg-slate-700"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contact.label}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{contact.value}</p>
            </a>
          ))}
        </div>
      </section>

      <AboutCta
        isLoggedIn={Boolean(user)}
        dashboardPath={dashboardPath}
        title={aboutData.cta.title}
        description={aboutData.cta.description}
        signupButton={aboutData.cta.signupButton}
        loginButton={aboutData.cta.loginButton}
        backButton={aboutData.cta.backButton}
        onSignup={() => setSignupOpen(true)}
        onLogin={() => setLoginOpen(true)}
      />

      <footer className="pb-3 pt-2 text-center text-sm text-slate-500">{aboutData.footer}</footer>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => {
          setLoginOpen(false)
          setSignupOpen(true)
        }}
      />

      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={() => {
          setSignupOpen(false)
          setLoginOpen(true)
        }}
      />
    </main>
  )
}

import Link from 'next/link'

type AboutCtaProps = {
  isLoggedIn: boolean
  dashboardPath: string
  title: string
  description: string
  signupButton: string
  loginButton: string
  backButton: string
  onSignup: () => void
  onLogin: () => void
}

export function AboutCta({
  isLoggedIn,
  dashboardPath,
  title,
  description,
  signupButton,
  loginButton,
  backButton,
  onSignup,
  onLogin,
}: AboutCtaProps) {
  return (
    <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 text-center dark:border-teal-900 dark:from-teal-950/40 dark:to-cyan-950/40">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-slate-700 dark:text-slate-300">{description}</p>

      {!isLoggedIn ? (
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={onSignup}
            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-black"
          >
            {signupButton}
          </button>
          <button
            onClick={onLogin}
            className="rounded-lg border border-slate-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {loginButton}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <Link
            href={dashboardPath}
            className="inline-flex rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-black"
          >
            {backButton}
          </Link>
        </div>
      )}
    </section>
  )
}

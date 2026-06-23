import Link from 'next/link'

type AboutCTAAction = {
  label: string
  href: string
}

type AboutCTAProps = {
  title: string
  description?: string
  actions: AboutCTAAction[]
  onActionClick?: () => void
}

export function AboutCTA({ title, description, actions, onActionClick }: AboutCTAProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-900 dark:bg-blue-950/30">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200">{title}</h2>
          {description ? <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{description}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Link
                key={`${action.label}-${action.href}`}
                href={action.href}
                onClick={(event) => {
                  if (onActionClick) {
                    event.preventDefault()
                    onActionClick()
                  }
                }}
                className={
                  index === 0
                    ? 'rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700'
                    : 'rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

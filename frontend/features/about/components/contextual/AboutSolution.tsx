type AboutSolutionProps = {
  description: string
}

export function AboutSolution({ description }: AboutSolutionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-900 dark:bg-blue-950/30">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200">Como a AtenaAI resolve isso</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-700 dark:text-slate-200">{description}</p>
        </div>
      </div>
    </section>
  )
}

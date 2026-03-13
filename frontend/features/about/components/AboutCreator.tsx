import Image from 'next/image'

type AboutCreatorProps = {
  name: string
  bio: string
  imageSrc: string
}

export function AboutCreator({ name, bio, imageSrc }: AboutCreatorProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quem criou</h2>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-300">
          <Image src={imageSrc} alt={name} width={96} height={96} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{name}</p>
          <p className="mt-2 max-w-2xl text-slate-700 dark:text-slate-300">{bio}</p>
        </div>
      </div>
    </section>
  )
}

import { ArrowLeft, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PublishedStudy } from '@/core/observatoire'
import { Disclosure } from './primitives'
import { ReportTab } from './project/ReportTab'
import { TAB_ACTIONS } from './project/slots'

const date = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const paras = (t: string) => t.split(/\n+/).filter((p) => p.trim())

/**
 * Une étude de l'Observatoire lue dans l'application : le rapport de Synthèse, en lecture seule, avec sa fiche.
 * Le fichier publié est déjà masqué (prénoms) ; la version document reste à un lien, pour lire d'un trait ou imprimer.
 */
export function ObservatoryPage({ slug }: { slug: string }) {
  const [study, setStudy] = useState<PublishedStudy | null | undefined>(undefined)
  useEffect(() => {
    setStudy(undefined)
    fetch(`/observatoire/${slug}/etude.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStudy)
      .catch(() => setStudy(null))
  }, [slug])

  const back = (
    <a href="/observatoire/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Toutes les études de l'Observatoire
    </a>
  )
  if (study === undefined) return <p className="text-sm text-muted-foreground">Chargement de l'étude…</p>
  if (study === null)
    return (
      <div className="space-y-3">
        {back}
        <p>Cette étude est introuvable.</p>
      </div>
    )

  const analysis = study.project.analyses[0]
  const f = study.fiche
  return (
    <div className="space-y-6">
      <div className="no-print space-y-3">
        {back}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{study.title}</h1>
          <p className="text-sm text-muted-foreground">
            Publié le {date(study.publishedAt)}
            {study.news && ` · ${study.news}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/observatoire/${study.slug}/`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-accent"
          >
            <FileText className="size-4" /> Version document
          </a>
          <div id={TAB_ACTIONS} className="flex flex-wrap items-center gap-2" />
        </div>
      </div>

      <section aria-labelledby="en-bref" className="max-w-3xl space-y-2">
        <h2 id="en-bref" className="text-xl font-semibold">
          En bref
        </h2>
        {paras(f.summary).map((p, i) => (
          <p key={i} className="text-base">
            {p}
          </p>
        ))}
      </section>

      <Disclosure flat summary={<span className="text-base font-semibold">Avant de lire : la question, les données, les limites</span>}>
        <div className="max-w-3xl space-y-3 text-base">
          <blockquote className="border-l-[3px] border-primary pl-3 italic">{f.question}</blockquote>
          <p>
            <a className="text-primary underline" href={f.source.url}>
              {f.source.name}
            </a>
            , {f.source.period}. {f.source.license}.
          </p>
          <p>{f.sample}</p>
          {paras(f.sampling).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <ul className="list-disc space-y-2 pl-5">
            {f.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </Disclosure>

      <ReportTab project={study.project} analysis={analysis} published />
    </div>
  )
}

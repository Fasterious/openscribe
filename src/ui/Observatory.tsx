import { ArrowLeft, ArrowRight, FileText } from 'lucide-react'
import { href } from '@/app/router'
import { useEffect, useState } from 'react'
import type { PublishedStudy } from '@/core/observatoire'
import { Disclosure } from './primitives'
import { ReportTab } from './project/ReportTab'
import { TAB_ACTIONS } from './project/slots'

const date = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const paras = (t: string) => t.split(/\n+/).filter((p) => p.trim())

/**
 * Une étude de l'Observatoire lue dans l'application : le rapport de Synthèse, en lecture seule, avec sa fiche.
 * Le fichier publié est déjà masqué (prénoms) ; l'article (« Lire en une page ») reste à un lien, pour lire d'un trait ou imprimer.
 */
export function ObservatoryPage({ slug }: { slug: string }) {
  const [study, setStudy] = useState<PublishedStudy | null | undefined>(undefined)
  // Une coupure réseau n'est pas une étude introuvable : on le dit, et on peut réessayer.
  const [offline, setOffline] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setStudy(undefined)
    setOffline(false)
    fetch(`/observatoire/${slug}/etude.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStudy)
      .catch(() => setOffline(true))
  }, [slug, attempt])
  useEffect(() => {
    if (!study) return
    const before = document.title
    document.title = `${study.title} — L'Observatoire OpenScribe`
    return () => {
      document.title = before
    }
  }, [study])

  const back = (
    <a href={href({ name: 'observatories' })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Toutes les études de l'Observatoire
    </a>
  )
  if (offline)
    return (
      <div className="space-y-3">
        {back}
        <p>L'étude n'a pas pu être chargée : la connexion semble coupée.</p>
        <button type="button" className="text-primary underline" onClick={() => setAttempt((n) => n + 1)}>
          Réessayer
        </button>
      </div>
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
  // Les chiffres de l'en-tête : les personnes qui disent au moins une chose sur la question, les idées sans les copies du codage en double.
  const people = new Set(analysis.ideas.map((i) => i.participantId)).size
  const ideas = analysis.ideas.filter((i) => !i.copyOf).length
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="no-print">{back}</div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{study.title}</h1>
          <p className="text-sm text-muted-foreground">
            Publiée le {date(study.publishedAt)}
            {study.news && ` · ${study.news}`} · {people.toLocaleString('fr-FR')} participants · {ideas.toLocaleString('fr-FR')} idées
          </p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <a
            href={`/observatoire/${study.slug}/`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-accent"
          >
            <FileText className="size-4" /> Lire en une page
          </a>
          <div id={TAB_ACTIONS} className="flex flex-wrap items-center gap-2" />
        </div>
      </div>


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

/** Une ligne de la liste publiée (`public/observatoire/index.json`). */
type ListedStudy = { slug: string; title: string; publishedAt: string; news: string; summary: string }

/** La liste des études de l'Observatoire, dans l'application : le même menu que partout ailleurs. */
export function ObservatoryList() {
  const [studies, setStudies] = useState<ListedStudy[] | null | undefined>(undefined)
  useEffect(() => {
    fetch('/observatoire/index.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStudies)
      .catch(() => setStudies(null))
  }, [])
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">L'Observatoire</h1>
        <p className="text-muted-foreground">
          L'analyse publique de consultations citoyennes en données ouvertes, réalisée avec OpenScribe. Le moteur d'IA propose, le code vérifie : chaque
          chiffre se recompte, chaque citation renvoie à la réponse d'origine.
        </p>
      </div>
      {studies === undefined && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {studies === null && <p>La liste des études n'a pas pu être chargée.</p>}
      {studies?.map((s) => (
        <article key={s.slug} className="space-y-2 border-b pb-6">
          <h2 className="text-xl font-semibold">
            <a href={href({ name: 'observatory', slug: s.slug })} className="hover:text-primary">
              {s.title}
            </a>
          </h2>
          <p className="text-sm text-muted-foreground">
            Publiée le {date(s.publishedAt)}
            {s.news && ` · ${s.news}`}
          </p>
          <p>{paras(s.summary)[0]}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
            <a href={href({ name: 'observatory', slug: s.slug })} className="inline-flex items-center gap-1 text-primary hover:underline">
              Lire l'étude <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={`/observatoire/${s.slug}/`} className="text-muted-foreground hover:text-foreground hover:underline">
              Lire en une page
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}

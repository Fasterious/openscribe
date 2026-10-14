import { ArrowRight, ExternalLink, FileText, Newspaper, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { parseObservatoryIndex, sampleLine, type PublicStudy } from '@/core/observatory'
import { useProjects } from '@/app/store'
import { Alert, Badge, Button, Card } from './primitives'
import { openPublished } from './Synthesis'

const BASE = '/observatoire/'

/** L'index des synthèses publiques, lu une fois par visite. */
export function usePublicStudies(): { studies: PublicStudy[] | null; error: boolean } {
  const [studies, setStudies] = useState<PublicStudy[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(`${BASE}index.json`)
      .then((r) => r.json())
      .then((j) => alive && setStudies(parseObservatoryIndex(j)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [])
  return { studies, error }
}

const longDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * L'Observatoire : chaque semaine, une consultation citoyenne en données
 * ouvertes, analysée avec OpenScribe. Une vitrine du produit sur de vraies
 * données, avec les mêmes garanties : citations exactes, chiffres calculés par le code.
 */
export function ObservatoryPage({ slug }: { slug?: string }) {
  const { studies, error } = usePublicStudies()
  const projects = useProjects()
  const [opening, setOpening] = useState<string | null>(null)

  // #/observatoire/<slug> : lien direct vers une synthèse, ouverte dans l'application.
  useEffect(() => {
    const s = slug && studies?.find((x) => x.slug === slug)
    if (s && projects) void openPublished(`${BASE}${s.file}`, projects)
  }, [slug, studies, projects])

  async function open(s: PublicStudy) {
    setOpening(s.slug)
    try {
      await openPublished(`${BASE}${s.file}`, projects)
    } finally {
      setOpening(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Newspaper className="size-4" /> Observatoire OpenScribe
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ce que disent les citoyens, preuves à l'appui</h1>
        <p className="text-lg text-muted-foreground">
          Chaque semaine, un sujet d'actualité et une consultation publique en données ouvertes, analysée avec OpenScribe. L'IA lit et regroupe les réponses ;
          le code vérifie chaque citation et calcule chaque chiffre. Tout est vérifiable, jusqu'au verbatim.
        </p>
      </header>

      {error && <Alert tone="error">Impossible de charger les synthèses publiées. Réessayez dans un instant.</Alert>}
      {!studies && !error && <p className="text-muted-foreground">Chargement…</p>}
      {studies?.length === 0 && <p className="text-muted-foreground">Aucune synthèse publiée pour l'instant.</p>}

      <ol className="space-y-6">
        {studies?.map((s) => (
          <li key={s.slug}>
            <Card className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge tone="outline">{longDate(s.publishedAt)}</Badge>
                <span>{s.news}</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{s.title}</h2>
                <p className="text-sm text-muted-foreground">
                  « {s.question} » · {sampleLine(s)} ·{' '}
                  <a className="inline-flex items-center gap-1 underline" href={s.source.url} target="_blank" rel="noreferrer">
                    {s.source.name}, {s.source.period} <ExternalLink className="size-3" />
                  </a>{' '}
                  ({s.source.license})
                </p>
              </div>
              <p className="max-w-3xl whitespace-pre-line">{s.summary}</p>
              <details className="rounded-lg border bg-muted/40 p-3 text-sm">
                <summary className="flex cursor-pointer items-center gap-2 font-medium">
                  <TriangleAlert className="size-4 text-warning" /> Ce que cette synthèse permet de dire, et ce qu'elle ne permet pas
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {s.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </details>
              {s.sampling && (
                <details className="rounded-lg border p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Comment l'échantillon a été tiré au sort, et pourquoi il suffit</summary>
                  <p className="mt-2 whitespace-pre-line text-muted-foreground">{s.sampling}</p>
                  <a className="mt-2 inline-block text-primary underline" href={`${BASE}methode.html`}>
                    Méthode détaillée, formules comprises
                  </a>
                </details>
              )}
              <div className="flex flex-wrap gap-2">
                <a href={`${BASE}${s.page}`}>
                  <Button variant="outline" tabIndex={-1}>
                    <FileText /> Lire le rapport
                  </Button>
                </a>
                <Button onClick={() => open(s)} disabled={opening === s.slug}>
                  {opening === s.slug ? 'Ouverture…' : 'Explorer les verbatims dans OpenScribe'} <ArrowRight />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <p className="max-w-3xl text-sm text-muted-foreground">
        Les sujets suivent l'actualité ; les réponses, elles, viennent telles quelles des participants. Tirage au sort à graine publiée après retrait des
        réponses vides et des copier-coller, effectifs de personnes plutôt que pourcentages, avis minoritaires visibles (
        <a className="underline" href={`${BASE}methode.html`}>
          méthode détaillée, formules comprises
        </a>
        ). Une erreur, une consultation à proposer ?{' '}
        <a className="underline" href="https://github.com/Fasterious/openscribe/discussions" target="_blank" rel="noreferrer">
          Dites-le-nous
        </a>
        .
      </p>
    </div>
  )
}

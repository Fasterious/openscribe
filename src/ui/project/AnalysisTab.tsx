import { AlertTriangle, CheckCircle2, Circle, Loader2, Play, RotateCcw, Square, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SIMULATION_ENGINE, SIMULATION_ENGINE_ID, useEngines, type EngineConfig } from '@/app/engines'
import { href, navigate } from '@/app/router'
import { cancelAnalysis, startAnalysis, useIsRunning, useRunNotice } from '@/app/store'
import { corpusHash } from '@/core/analysis/pipeline'
import { DEFAULT_SETTINGS, type AnalysisSettings, type AnalysisState, type StepId } from '@/core/analysis/types'
import { activeParticipants } from '@/core/corpus'
import { presetById } from '@/core/providers/presets'
import { corpusForAnalysis, type Project } from '@/core/project'
import { CATEGORY, formatDuration, plural } from '../format'
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Disclosure, Input, Label, Progress, Select, Textarea } from '../primitives'

const STEP_LABEL: Record<StepId, { title: string; help: string }> = {
  extract: {
    title: 'Découper en idées',
    help: "Le moteur d'IA découpe chaque réponse en idées, chacune appuyée sur un verbatim ; le code vérifie que ce verbatim figure mot pour mot dans la réponse.",
  },
  group: { title: 'Regrouper en motifs', help: "Le moteur d'IA rassemble les idées en motifs ; le code vérifie que chaque idée n'est rangée qu'une fois." },
  summarize: { title: 'Synthétiser chaque motif', help: "Le code compte les participants et les avis ; le moteur d'IA rédige une synthèse qui cite ses verbatims." },
  themes: { title: 'Dégager les grands thèmes', help: "S'il y a beaucoup de motifs, le moteur d'IA les réunit en quelques grands thèmes." },
  report: { title: 'Écrire le résumé', help: "Le moteur d'IA rédige un résumé de l'ensemble à partir des synthèses." },
  polish: {
    title: 'Relire la langue',
    help: "Le moteur d'IA relit les synthèses pour qu'elles se lisent naturellement ; le code refuse toute réécriture qui perd un verbatim ou change un chiffre.",
  },
}

function estimate(project: Project, engine: EngineConfig | undefined) {
  const corpus = corpusForAnalysis(project)
  const people = activeParticipants(corpus).length
  const ideas = Math.round(corpus.contributions.filter((c) => c.text.trim()).length * 2.5)
  const calls = people + 2 + Math.ceil(ideas / 90) + 2 + 3
  const rpm = engine?.requestsPerMinute ?? 10
  const seconds = (calls / rpm) * 60 + calls * 4
  return { people, calls, seconds }
}

export function AnalysisTab({ project }: { project: Project }) {
  const running = useIsRunning(project.id)
  const { engines, defaultId, loaded } = useEngines()
  const latest = project.analyses[0] as AnalysisState | undefined
  const [engineId, setEngineId] = useState<string>('')
  const [settings, setSettings] = useState<AnalysisSettings>({ ...DEFAULT_SETTINGS, ...latest?.settings })
  const [gridText, setGridText] = useState((latest?.settings.grid ?? []).join('\n'))
  const [hash, setHash] = useState<string | null>(null)

  const allEngines = useMemo(() => [...engines, SIMULATION_ENGINE], [engines])
  useEffect(() => {
    if (!loaded || engineId) return
    setEngineId(defaultId && engines.some((e) => e.id === defaultId) ? defaultId : engines[0]?.id ?? SIMULATION_ENGINE_ID)
  }, [loaded, defaultId, engines, engineId])
  useEffect(() => {
    corpusHash(corpusForAnalysis(project)).then(setHash)
  }, [project])

  const engine = allEngines.find((e) => e.id === engineId)
  const est = estimate(project, engine)
  const outdated = latest && hash && latest.corpusHash !== hash
  const canResume = latest && !running && (latest.status === 'cancelled' || latest.status === 'error') && !outdated
  const preset = engine ? presetById(engine.presetId) : undefined
  const missingKey = engine && preset?.needsKey && preset.id !== 'custom' && !engine.apiKey

  const launch = (resume?: AnalysisState) => {
    if (!engine) return
    const s: AnalysisSettings = { ...settings, grid: gridText.split('\n').map((g) => g.trim()).filter(Boolean) }
    startAnalysis(project.id, engine, s, resume)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Réglages</CardTitle>
            <CardDescription>{plural(est.people, 'participant')} à analyser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objectif">Ce que vous cherchez à comprendre</Label>
              <Textarea
                id="objectif"
                rows={3}
                disabled={running}
                value={settings.researchQuestion}
                onChange={(e) => setSettings({ ...settings, researchQuestion: e.target.value })}
                placeholder="Ex. : comprendre ce qui freine l'usage de l'application"
              />
              <p className="text-xs text-muted-foreground">Facultatif. Donné au moteur d'IA comme contexte.</p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Regroupement</legend>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="radio" name="mode" className="mt-1 accent-[var(--primary)]" disabled={running} checked={settings.mode === 'free'} onChange={() => setSettings({ ...settings, mode: 'free' })} />
                <span>
                  <strong>Libre</strong> — les motifs émergent des réponses. Recommandé pour explorer.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="radio" name="mode" className="mt-1 accent-[var(--primary)]" disabled={running} checked={settings.mode === 'grid'} onChange={() => setSettings({ ...settings, mode: 'grid' })} />
                <span>
                  <strong>Grille</strong> — vous imposez les catégories (par exemple pour un audit sur critères). Ce qui n'y entre pas est rangé « Hors grille ».
                </span>
              </label>
              {settings.mode === 'grid' && (
                <Textarea
                  aria-label="Catégories de la grille, une par ligne"
                  rows={4}
                  disabled={running}
                  value={gridText}
                  onChange={(e) => setGridText(e.target.value)}
                  placeholder={'Une catégorie par ligne\nEx. : Guidage\nCharge de travail\nGestion des erreurs'}
                />
              )}
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="moteur">Moteur d'IA</Label>
              <Select id="moteur" value={engineId} disabled={running} onChange={(e) => setEngineId(e.target.value)}>
                {allEngines.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.presetId !== 'simulation' ? ` · ${e.model}` : ''}
                  </option>
                ))}
              </Select>
              {engines.length === 0 && (
                <Alert tone="info" className="space-y-2">
                  <p>Pour analyser vos données, branchez un moteur d'IA : une clé gratuite se crée en quelques minutes.</p>
                  <a href={href({ name: 'settings', back: project.id })}>
                    <Button size="sm" tabIndex={-1}>
                      Choisir un moteur
                    </Button>
                  </a>
                </Alert>
              )}
              {engine?.presetId === 'simulation' && (
                <Alert tone="warning">
                  La simulation fonctionne sans clé ni connexion, mais son contenu est fictif : elle sert à découvrir le parcours, pas à
                  analyser.
                </Alert>
              )}
              {missingKey && (
                <Alert tone="error">
                  Il manque la clé d'accès de ce moteur.{' '}
                  <a className="font-medium underline" href={href({ name: 'settings', back: project.id })}>
                    Ajouter la clé
                  </a>
                </Alert>
              )}
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">Réglages avancés</summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="langue">Langue du rapport</Label>
                  <Select id="langue" disabled={running} value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value as 'fr' | 'en' })}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="graine">Graine</Label>
                  <Input id="graine" type="number" disabled={running} value={settings.seed} onChange={(e) => setSettings({ ...settings, seed: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <label className="mt-3 flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  disabled={running}
                  checked={settings.polish}
                  onChange={(e) => setSettings({ ...settings, polish: e.target.checked })}
                />
                <span>
                  Relire la langue des synthèses
                  <span className="block text-xs text-muted-foreground">
                    Une passe de plus pour un texte fluide et naturel. Verbatims et chiffres sont contrôlés : une réécriture qui les modifie est
                    écartée.
                  </span>
                </span>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                Température fixée à 0 et réponses mémorisées : relancer la même analyse redonne exactement le même résultat, sans nouvelle demande.
              </p>
            </details>

            <p className="text-xs text-muted-foreground">
              Environ {est.calls} demandes au moteur d'IA
              {engine && engine.presetId !== 'simulation' ? `, soit ${formatDuration(est.seconds)} à la vitesse autorisée par ce moteur` : ''}. Les demandes
              déjà faites ne sont jamais refaites.
            </p>

            <div className="flex flex-wrap gap-2">
              {running ? (
                <Button variant="outline" onClick={() => cancelAnalysis(project.id)}>
                  <Square /> Arrêter
                </Button>
              ) : (
                <>
                  <Button variant={latest?.status === 'done' ? 'outline' : 'default'} onClick={() => launch()} disabled={!engine || Boolean(missingKey) || (settings.mode === 'grid' && !gridText.trim())}>
                    <Play /> {latest ? 'Relancer une analyse' : "Lancer l'analyse"}
                  </Button>
                  {canResume && (
                    <Button variant="outline" onClick={() => launch(latest)}>
                      <RotateCcw /> Reprendre
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sur mobile, une analyse en cours ou terminée passe avant les réglages. */}
      <div className={`min-w-0 space-y-4 ${latest ? 'order-first lg:order-none' : ''}`}>
        {!latest ? (
          <Card>
            <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Comment ça marche</p>
              <ol className="list-decimal space-y-1 pl-5">
                {(Object.keys(STEP_LABEL) as StepId[]).map((s) => (
                  <li key={s}>
                    <strong className="text-foreground">{STEP_LABEL[s].title}.</strong> {STEP_LABEL[s].help}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ) : (
          <RunView project={project} analysis={latest} running={running} outdated={Boolean(outdated)} />
        )}
      </div>
    </div>
  )
}

function StepIcon({ state }: { state: string }) {
  if (state === 'done') return <CheckCircle2 className="size-5 text-positive" />
  if (state === 'running') return <Loader2 className="size-5 animate-spin text-primary" />
  if (state === 'error') return <XCircle className="size-5 text-negative" />
  return <Circle className="size-5 text-muted-foreground" />
}

function RunView({ project, analysis, running, outdated }: { project: Project; analysis: AnalysisState; running: boolean; outdated: boolean }) {
  const byCat = useMemo(() => {
    const c = { positive: 0, negative: 0, neutral: 0, suggestion: 0 }
    analysis.ideas.forEach((i) => c[i.category]++)
    return c
  }, [analysis.ideas])
  const notice = useRunNotice(project.id)

  return (
    <div className="space-y-4">
      {running && notice && <Alert tone="warning">{notice}</Alert>}
      {outdated && (
        <Alert tone="warning">
          <AlertTriangle className="mr-1 inline size-4" /> Les données ont changé depuis cette analyse. Lancez une nouvelle analyse pour en
          tenir compte.
        </Alert>
      )}
      {analysis.status === 'error' && (
        <Alert tone="error">
          L'analyse s'est arrêtée : {analysis.error}
          <br />
          Ce qui a été fait est conservé.
        </Alert>
      )}
      {analysis.status === 'cancelled' && !running && (
        <Alert tone="warning">Analyse interrompue. Ce qui a été fait est conservé : « Reprendre » repart de là.</Alert>
      )}
      {analysis.status === 'done' && (
        <Alert tone="success" className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <CheckCircle2 className="mr-1 inline size-4" /> Analyse terminée : {plural(analysis.ideas.length, 'idée')},{' '}
            {plural(analysis.groups.length, 'motif')}
            {analysis.themes.length ? `, ${plural(analysis.themes.length, 'thème')}` : ''}.
          </span>
          <Button size="sm" onClick={() => navigate({ name: 'project', id: project.id, tab: 'report' })}>
            Voir le rapport
          </Button>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Étapes</CardTitle>
          <CardDescription>
            {analysis.engine.presetId === 'simulation' ? 'Simulation' : `${analysis.engine.model}`} · {plural(analysis.calls.total, 'demande')}
            {analysis.calls.cached ? ` (dont ${analysis.calls.cached} déjà en mémoire)` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {analysis.steps.map((s) => (
              <li key={s.id} className="flex gap-3">
                <StepIcon state={s.state} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{STEP_LABEL[s.id].title}</span>
                    {s.total > 0 && s.id === 'extract' && (
                      <span className="text-xs text-muted-foreground">
                        {s.done} / {plural(s.total, 'participant')}
                      </span>
                    )}
                  </div>
                  {s.state === 'running' && s.total > 0 && <Progress value={(s.done / s.total) * 100} label={STEP_LABEL[s.id].title} />}
                  {s.message && <p className="text-xs text-muted-foreground">{s.message}</p>}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {analysis.ideas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats intermédiaires</CardTitle>
            <CardDescription>Vérifiables à chaque étape.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(byCat) as (keyof typeof byCat)[]).map((k) => (
                <Badge key={k} tone={CATEGORY[k].tone}>
                  {CATEGORY[k].plural} : {byCat[k]}
                </Badge>
              ))}
              {analysis.rejected.length > 0 && <Badge tone="warning">Verbatims écartés : {analysis.rejected.length}</Badge>}
            </div>
            <Disclosure summary={`Idées extraites (${analysis.ideas.length})`}>
              <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
                {analysis.ideas.map((i) => (
                  <li key={i.id} className="flex gap-2">
                    <Badge tone={CATEGORY[i.category].tone} className="h-fit shrink-0">
                      {CATEGORY[i.category].mark}
                    </Badge>
                    <span className="min-w-0">
                      <strong>{i.label}</strong> — « {i.verbatim} » <span className="text-xs text-muted-foreground">{i.participantId}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Disclosure>
            {analysis.rejected.length > 0 && (
              <Disclosure summary={`Verbatims écartés (${analysis.rejected.length})`}>
                <p className="mb-2 text-xs text-muted-foreground">Le moteur d'IA a proposé ces verbatims, mais ils ne figurent pas tels quels dans les réponses : ils ne sont pas retenus.</p>
                <ul className="space-y-1 text-sm">
                  {analysis.rejected.map((r, i) => (
                    <li key={i}>
                      « {r.verbatim} » — {r.participantId} <span className="text-xs text-muted-foreground">({r.reason})</span>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}
            {analysis.groups.length > 0 && (
              <Disclosure summary={`Motifs (${analysis.groups.length})`}>
                <ul className="space-y-1 text-sm">
                  {analysis.groups.map((g) => (
                    <li key={g.id}>
                      <strong>{g.title}</strong> — {plural(g.metrics.participants, 'participant')}, {plural(g.metrics.mentions, 'occurrence')}
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { ArrowLeft, BadgeCheck, Check, CheckCircle2, Cloud, Copy, ExternalLink, FlaskConical, HardDrive, Info, Loader2, Lock, RefreshCw, Sparkles, Trash2, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  detectOllama,
  newEngineFromPreset,
  removeEngine,
  saveEngine,
  setConfidentialDefault,
  setDefaultEngine,
  testEngine,
  useEngines,
  type EngineConfig,
  type OllamaStatus,
} from '@/app/engines'
import { href } from '@/app/router'
import { runsLocally } from '@/core/providers/location'
import { PROVIDER_PRESETS, presetById, presetStudy, type DataPolicy, type ModelChoice, type PresetFamily, type ProviderKind, type ProviderPreset } from '@/core/providers/presets'
import { Alert, Badge, Button, Card, CardContent, Chevron, Dialog, DropMenu, Input, Label, MenuItem, MenuSection, Select, Tooltip, cn } from './primitives'

const POLICY: Record<DataPolicy, { label: string; tone: 'positive' | 'warning' | 'outline' }> = {
  local: { label: 'Rien ne quitte votre ordinateur', tone: 'positive' },
  'no-training': { label: "Vos données n'entraînent pas les modèles", tone: 'positive' },
  'may-train-free': { label: 'Offre gratuite : vos données peuvent être réutilisées', tone: 'warning' },
  check: { label: 'Politique de données à vérifier', tone: 'outline' },
}

/** Les autres fournisseurs, rangés par type : l'explication reste discrète, au survol. */
const KINDS: { id: ProviderKind | null; title: string; hint: string }[] = [
  {
    id: 'direct',
    title: 'Fournisseurs directs',
    hint: "L'éditeur sert ses propres modèles : un seul contrat, une politique de données claire, le prix catalogue. Il faut une clé par éditeur.",
  },
  {
    id: 'host',
    title: 'Hébergeurs de modèles ouverts',
    hint: "Ils font tourner sur leurs machines des modèles publiés par d'autres (Mistral, Qwen, gpt-oss…) : on sait qui traite les données, et le choix se limite aux modèles ouverts.",
  },
  {
    id: 'router',
    title: 'Plateformes multi-fournisseurs',
    hint: 'Une seule clé pour des centaines de modèles, relayés vers de nombreux hébergeurs. En contrepartie, un intermédiaire de plus voit passer les données, et la politique de données dépend du modèle choisi.',
  },
  { id: 'custom', title: 'Autre service', hint: "Tout service compatible avec l'API d'OpenAI (vLLM, un relais personnel…)." },
]

const FAMILIES: { id: PresetFamily; title: string; icon: React.ReactNode }[] = [
  { id: 'free', title: 'Pour essayer gratuitement', icon: <Zap /> },
  { id: 'local', title: 'Pour que rien ne quitte votre ordinateur', icon: <HardDrive /> },
  { id: 'other', title: 'Autres fournisseurs', icon: <Sparkles /> },
]

/**
 * Depuis le site en ligne, interroger Ollama fait demander au navigateur l'accès aux applications de cet appareil :
 * on ne le cherche donc que sur demande, sauf si la page tourne déjà sur l'ordinateur ou si l'accès est déjà accordé.
 */
async function mayProbeLocally(): Promise<boolean> {
  if (!originNeedingOllamaPermission()) return true
  for (const name of ['loopback-network', 'local-network-access']) {
    try {
      if ((await navigator.permissions.query({ name } as unknown as PermissionDescriptor)).state === 'granted') return true
    } catch {
      // Nom de permission inconnu de ce navigateur.
    }
  }
  return false
}

function useOllama() {
  // undefined : pas encore cherché ; null : recherche en cours.
  const [status, setStatus] = useState<OllamaStatus | null | undefined>(undefined)
  const refresh = useCallback(async () => {
    setStatus(null)
    setStatus(await detectOllama(presetById('ollama')!.baseUrl))
  }, [])
  useEffect(() => {
    mayProbeLocally().then((ok) => {
      if (ok) refresh()
    })
  }, [refresh])
  return { status, refresh }
}

export function SettingsPage({ back }: { back?: string }) {
  const { engines, defaultId, confidentialDefault, loaded } = useEngines()
  // Mode Confidentiel : montré seulement à qui a déjà un moteur sur son ordinateur (les moteurs locaux sont à l'étude).
  const hasLocal = engines.some((e) => runsLocally(e.baseUrl))
  const [editing, setEditing] = useState<EngineConfig | null>(null)
  const ollama = useOllama()
  const backHref = back ? href({ name: 'project', id: back, tab: 'analysis' }) : null

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        {backHref && (
          <a href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Revenir à votre synthèse
          </a>
        )}
        <h1 className="text-3xl font-bold tracking-tight">Moteurs d'IA</h1>
        <p className="max-w-2xl text-muted-foreground">
          Le moteur d'IA lit et rédige ; OpenScribe vérifie les citations et fait les comptes. Seuls les moteurs dont la qualité a été vérifiée sont
          proposés : les autres restent à l'étude.
        </p>
      </header>

      {backHref && loaded && engines.length > 0 && (
        <Alert
          tone={engines.some((e) => e.verified !== false) ? 'success' : 'warning'}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          {engines.some((e) => e.verified !== false) ? (
            <span>
              <CheckCircle2 className="mr-1 inline size-4" /> Votre moteur est prêt : vous pouvez lancer l'analyse.
            </span>
          ) : (
            <span>Votre moteur est enregistré, mais il n'a pas répondu au test. Vérifiez sa configuration avant de lancer l'analyse.</span>
          )}
          <a href={backHref}>
            <Button size="sm" tabIndex={-1}>
              <ArrowLeft /> Revenir à votre synthèse
            </Button>
          </a>
        </Alert>
      )}

      {engines.length > 0 && (
        <section aria-labelledby="qui-fait-quoi" className="space-y-3">
          <h2 id="qui-fait-quoi" className="text-lg font-semibold">
            Moteur d'IA par tâche
          </h2>
          <Card>
            <CardContent className="divide-y p-0">
              <div className="grid gap-2 p-4 sm:grid-cols-[12rem_1fr_auto] sm:items-center">
                <Label htmlFor="defaut-analyse" className="font-medium">
                  Analyser et rédiger
                </Label>
                <Select id="defaut-analyse" value={defaultId ?? ''} onChange={(e) => setDefaultEngine(e.target.value)}>
                  {!defaultId && <option value="">Choisir un moteur</option>}
                  {engines.map((e) => (
                    <option key={e.id} value={e.id} disabled={confidentialDefault && !runsLocally(e.baseUrl)}>
                      {e.name} · {e.model}
                      {confidentialDefault && !runsLocally(e.baseUrl) ? ' (en ligne)' : ''}
                    </option>
                  ))}
                </Select>
                {(() => {
                  const d = engines.find((e) => e.id === defaultId)
                  return d ? <Location local={runsLocally(d.baseUrl)} /> : null
                })()}
              </div>
              <div className="grid gap-1 p-4 text-muted-foreground sm:grid-cols-[12rem_1fr] sm:items-center">
                <span className="font-medium">Transcrire</span>
                <span className="text-sm">Bientôt, avec le module Entretiens.</span>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">Ces choix s'appliquent aux nouvelles synthèses ; vous pourrez les changer dans chacune.</p>
          {(hasLocal || confidentialDefault) && (
            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={confidentialDefault}
                onChange={(e) => setConfidentialDefault(e.target.checked)}
              />
              <span>
                <span className="flex items-center gap-1 font-medium">
                  <Lock className="size-4" /> Mode Confidentiel : rien ne quitte votre ordinateur
                </span>
                <span className="block text-sm text-muted-foreground">
                  Pour toute nouvelle synthèse, seuls les moteurs installés sur votre ordinateur (Ollama, LM Studio) sont proposés, et OpenScribe refuse
                  d'envoyer vos données ailleurs. Vous pourrez le désactiver pour une synthèse donnée.
                </span>
              </span>
            </label>
          )}
        </section>
      )}

      {engines.length > 0 && (
        <section aria-labelledby="mes-moteurs" className="space-y-3">
          <h2 id="mes-moteurs" className="text-lg font-semibold">
            Vos moteurs
          </h2>
          <ul className="grid gap-3">
            {engines.map((e) => {
              const preset = presetById(e.presetId)
              const policy = POLICY[preset?.dataPolicy ?? 'check']
              return (
                <li key={e.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{e.name}</span>
                          {defaultId === e.id && <Badge tone="positive">Utilisé par défaut</Badge>}
                          <Location local={runsLocally(e.baseUrl)} />
                          {e.verified === false && <Badge tone="warning">N'a pas répondu au test</Badge>}
                          <Badge tone={policy.tone}>{policy.label}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          Modèle : {e.model}
                          {preset?.needsKey && !e.apiKey ? " · clé d'accès manquante" : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                          Modifier
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => removeEngine(e.id)} aria-label={`Supprimer ${e.name}`}>
                          <Trash2 />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="choisir" className="space-y-6">
        <h2 id="choisir" className="text-lg font-semibold">
          {engines.length ? 'Ajouter un autre moteur' : 'Choisissez votre moteur'}
        </h2>
        {FAMILIES.map((f) => (
          <div key={f.id} className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground [&_svg]:size-4">
              {f.icon} {f.title}
            </h3>
            {(f.id === 'other' ? KINDS : [{ id: null, title: '', hint: '' }]).map((k) => {
              // Les moteurs validés d'abord, puis ceux à l'étude.
              const rank = (p: ProviderPreset) => (presetStudy(p) ? 0 : 2) + Number(!!p.featured)
              const presets = PROVIDER_PRESETS.filter((p) => p.family === f.id && (k.id === null || p.kind === k.id)).sort((a, b) => rank(b) - rank(a))
              if (!presets.length) return null
              return (
                <div key={k.id ?? f.id} className="space-y-2">
                  {k.id && (
                    <Tooltip content={k.hint}>
                      <h4 tabIndex={0} className="inline-flex cursor-help items-center gap-1 text-xs font-medium text-muted-foreground">
                        {k.title} <Info className="size-3" />
                      </h4>
                    </Tooltip>
                  )}
                  <ul className={cn('grid gap-3', f.id === 'other' ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                    {presets.map((p) => (
                      <li key={p.id}>
                        <ProviderCard
                          preset={p}
                          configured={engines.some((e) => e.presetId === p.id && e.verified !== false)}
                          ollama={p.id === 'ollama' ? ollama.status : undefined}
                          compact={f.id === 'other'}
                          onSetup={() => setEditing(engines.find((e) => e.presetId === p.id) ?? newEngineFromPreset(p.id))}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        ))}
      </section>

      <section className="space-y-2 rounded-xl bg-muted/50 p-5 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">Bon à savoir</h2>
        <p>
          Vos clés restent enregistrées dans ce navigateur. Pour l'analyse, seuls les verbatims partent vers le moteur choisi, avec un pseudonyme (P1, P2…). Les
          colonnes de nom et d'adresse ne partent pas. Les prénoms écrits dans les réponses font partie du texte envoyé : vous
          pouvez les masquer à l'écran et dans les exports.
        </p>
        <p>
          Données de participants : vérifiez que la politique du fournisseur est compatible avec le consentement recueilli. Avant d'ajouter une carte bancaire
          chez un fournisseur, fixez un plafond de dépenses dans son espace client.
        </p>
      </section>

      {editing && <SetupDialog engine={editing} ollama={ollama} back={backHref} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ProviderCard({
  preset,
  configured,
  ollama,
  compact,
  onSetup,
}: {
  preset: ProviderPreset
  configured: boolean
  ollama?: OllamaStatus | null
  compact?: boolean
  onSetup: () => void
}) {
  const policy = POLICY[preset.dataPolicy]
  const study = presetStudy(preset)
  return (
    <Card className={cn('flex h-full flex-col p-4', configured && 'border-positive/60', study && !configured && 'bg-muted/40')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('font-semibold', study && !configured && 'text-muted-foreground')}>{preset.label.replace(/ \(.*\)$/, '')}</span>
        <span className="flex flex-wrap gap-1">
          {configured && (
            <Badge tone="positive">
              <Check className="size-3" /> Configuré
            </Badge>
          )}
          {study ? (
            <Badge tone="outline" className="gap-1">
              <FlaskConical className="size-3" /> À l'étude
            </Badge>
          ) : (
            <>
              <Badge tone="positive" className="gap-1">
                <BadgeCheck className="size-3" /> Qualité vérifiée
              </Badge>
              {!configured && preset.family === 'free' && <Badge tone="default">Gratuit, sans carte</Badge>}
            </>
          )}
        </span>
      </div>
      <p className="mt-2 text-sm">{preset.bestFor}</p>
      {study ? (
        <p className="mt-1 text-xs text-muted-foreground">{study}</p>
      ) : (
        !compact && <p className="mt-1 text-xs text-muted-foreground">{preset.freeTier}</p>
      )}
      {ollama !== undefined && <OllamaLine status={ollama} />}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
        {!compact ? <Badge tone={policy.tone}>{policy.label}</Badge> : <span />}
        {study && !configured ? (
          <Button size="sm" variant="outline" disabled aria-label={`Configurer ${preset.label} : à l'étude`}>
            Non proposé
          </Button>
        ) : (
          <Button size="sm" variant={configured ? 'outline' : 'default'} onClick={onSetup}>
            {configured ? 'Modifier' : 'Configurer'}
          </Button>
        )}
      </div>
    </Card>
  )
}

function OllamaLine({ status }: { status: OllamaStatus | null | undefined }) {
  if (status === undefined)
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        Pour trouver Ollama, votre navigateur vous demandera d'autoriser OpenScribe à accéder aux applications de cet appareil : c'est ainsi que la
        page parle à Ollama, sans que rien ne quitte votre ordinateur.
      </p>
    )
  if (!status)
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Recherche d'Ollama sur cet ordinateur…
      </p>
    )
  if (!status.running) return <p className="mt-2 text-xs text-muted-foreground">Pas encore installé ou pas ouvert sur cet ordinateur.</p>
  return (
    <p className="mt-2 text-xs text-positive">
      <Check className="mr-1 inline size-3" />
      {status.models.length
        ? `Ollama est ouvert · ${status.models.length > 1 ? 'modèles' : 'modèle'} : ${status.models.join(', ')}.`
        : "Ollama est ouvert, mais aucun modèle n'est installé."}
    </p>
  )
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="mt-1 flex items-center gap-2 rounded-md bg-foreground/90 px-3 py-2 font-mono text-xs text-background">
      <span className="flex-1 select-all">{code}</span>
      <button
        type="button"
        className="cursor-pointer rounded p-1 hover:bg-background/20"
        aria-label="Copier la commande"
        onClick={async () => {
          await navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  )
}

/** Adresse de cette page, si Ollama doit l'autoriser explicitement (il autorise déjà localhost). */
function originNeedingOllamaPermission(): string | null {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' ? null : window.location.origin
}

function SetupDialog({
  engine,
  ollama,
  back,
  onClose,
}: {
  engine: EngineConfig
  ollama: { status: OllamaStatus | null | undefined; refresh: () => Promise<void> }
  back: string | null
  onClose: () => void
}) {
  const preset = presetById(engine.presetId)
  const isOllama = engine.presetId === 'ollama'
  const installed = isOllama ? (ollama.status?.models ?? []) : []
  const [draft, setDraft] = useState(() =>
    // Ollama : on propose d'emblée un modèle réellement installé.
    isOllama && installed.length && !installed.includes(engine.model) ? { ...engine, model: installed[0] } : engine,
  )
  const [state, setState] = useState<{ phase: 'idle' | 'testing' | 'ok' | 'error'; message?: string }>({ phase: 'idle' })
  // La détection d'Ollama peut répondre après l'ouverture : on se cale alors sur un modèle installé.
  useEffect(() => {
    if (installed.length && !installed.includes(draft.model)) setDraft((d) => ({ ...d, model: installed[0] }))
  }, [installed.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<EngineConfig>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setState({ phase: 'idle' })
  }
  const policy = POLICY[preset?.dataPolicy ?? 'check']
  const needsKey = preset?.needsKey !== false
  const ready = !!draft.model && !!draft.baseUrl && (!needsKey || !!draft.apiKey)
  const origin = isOllama ? originNeedingOllamaPermission() : null

  async function saveAndTest() {
    setState({ phase: 'testing' })
    const res = await testEngine(draft)
    if (res.ok) {
      await saveEngine({ ...draft, verified: true })
      setState({ phase: 'ok' })
    } else setState({ phase: 'error', message: res.message })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Configurer ${preset?.label ?? 'un moteur'}`} className="max-w-xl">
      {state.phase === 'ok' ? (
        <div className="space-y-4">
          <Alert tone="success">
            <CheckCircle2 className="mr-1 inline size-4" /> {preset?.label} répond : votre moteur est prêt.
          </Alert>
          <div className="flex justify-end gap-2">
            {back ? (
              <a href={back} onClick={onClose}>
                <Button tabIndex={-1}>
                  <ArrowLeft /> Revenir à votre synthèse
                </Button>
              </a>
            ) : (
              <Button onClick={onClose}>Terminé</Button>
            )}
          </div>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            saveAndTest()
          }}
        >
          <p className="text-sm text-muted-foreground">{preset?.bestFor}</p>

          {isOllama && (
            <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <OllamaLine status={ollama.status} />
              <Button type="button" size="sm" variant="ghost" onClick={ollama.refresh}>
                <RefreshCw /> {ollama.status === undefined ? 'Chercher Ollama' : 'Vérifier'}
              </Button>
            </div>
          )}

          {preset && preset.steps.length > 0 && (
            <ol className="space-y-3">
              {preset.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p>{s.text}</p>
                    {s.link && (
                      <a href={s.link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                        {s.link.label} <ExternalLink className="size-3" />
                      </a>
                    )}
                    {s.code && <CopyCode code={isOllama ? `ollama pull ${draft.model || 'gpt-oss:20b'}` : s.code} />}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {origin && (
            <Alert tone="info" className="space-y-1 text-xs">
              <p>Ollama doit aussi autoriser l'adresse de ce site. Sur Mac, lancez cette commande dans le Terminal, puis quittez et rouvrez Ollama :</p>
              <CopyCode code={`launchctl setenv OLLAMA_ORIGINS "${origin}"`} />
            </Alert>
          )}

          {needsKey && (
            <div className="space-y-2">
              <Label htmlFor="cle">Clé d'accès</Label>
              <Input
                id="cle"
                type="password"
                autoComplete="off"
                value={draft.apiKey}
                onChange={(e) => set({ apiKey: e.target.value.trim() })}
                placeholder="Collez votre clé ici"
              />
            </div>
          )}

          <ModelPicker
            choices={installed.length ? installed.map((id) => ({ id, label: id, hint: 'Installé sur votre ordinateur.' })) : modelChoices(preset)}
            value={draft.model}
            onChange={(model) => set({ model })}
          />

          {preset && (
            <p className="text-xs text-muted-foreground">
              <Badge tone={policy.tone} className="mr-1">
                {policy.label}
              </Badge>
              {preset.dataNote}
            </p>
          )}

          <details className="group/adv text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-muted-foreground [&::-webkit-details-marker]:hidden">
            Réglages avancés <Chevron className="group-open/adv:rotate-180" />
          </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom affiché</Label>
                <Input id="nom" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse du service</Label>
                <Input id="adresse" value={draft.baseUrl} onChange={(e) => set({ baseUrl: e.target.value.trim() })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debit">Demandes par minute</Label>
                <Input
                  id="debit"
                  type="number"
                  min={1}
                  max={1000}
                  value={draft.requestsPerMinute}
                  onChange={(e) => set({ requestsPerMinute: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parallele">Demandes simultanées</Label>
                <Input
                  id="parallele"
                  type="number"
                  min={1}
                  max={10}
                  value={draft.concurrency}
                  onChange={(e) => set({ concurrency: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Le débit proposé respecte l'offre gratuite du fournisseur. Pour des résultats reproductibles, préférez un nom de modèle qui finit par une date
              plutôt que par « latest ».
            </p>
          </details>

          {state.phase === 'error' && (
            <Alert tone="error" className="space-y-2">
              <p>{state.message}</p>
              {isOllama && !ollama.status?.running && <p>Suivez les étapes 1 et 2 ci-dessus, puis cliquez sur « {ollama.status === undefined ? 'Chercher Ollama' : 'Vérifier'} ».</p>}
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {state.phase === 'error' && (
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  await saveEngine({ ...draft, verified: false })
                  onClose()
                  // Sur mobile, le bandeau d'état et « Vos moteurs » sont en haut de page.
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Enregistrer quand même
              </Button>
            )}
            <Button type="submit" disabled={!ready || state.phase === 'testing'}>
              {state.phase === 'testing' ? (
                <>
                  <Loader2 className="animate-spin" /> Test en cours…
                </>
              ) : (
                'Enregistrer et tester'
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

/** Les modèles à proposer : la liste expliquée du fournisseur, ou à défaut ses suggestions. */
function modelChoices(preset: ProviderPreset | undefined): ModelChoice[] {
  if (!preset) return []
  if (preset.models?.length) return preset.models
  return preset.suggestedModels.map((id) => ({
    id,
    label: id,
    hint: id === preset.defaultModel ? 'Proposé par défaut.' : '',
    recommended: id === preset.defaultModel,
  }))
}

/** Choix du modèle : une liste expliquée, le modèle recommandé en tête, et la saisie libre pour les autres. */
function ModelPicker({ choices, value, onChange }: { choices: ModelChoice[]; value: string; onChange: (model: string) => void }) {
  const known = choices.find((c) => c.id === value)
  const [custom, setCustom] = useState(!known && choices.length > 0 ? true : choices.length === 0)
  const sections = [...new Set(choices.map((c) => c.section ?? ''))]
  return (
    <div className="space-y-2">
      <Label htmlFor={custom ? 'modele' : undefined}>Modèle</Label>
      {choices.length > 0 && (
        <DropMenu block align="left" ariaLabel="Choisir le modèle" label={custom ? 'Autre modèle' : (known?.label ?? value)}>
          {(close) => (
            <>
              {sections.map((section) => (
                <div key={section}>
                  {section && <MenuSection>{section}</MenuSection>}
                  {choices
                    .filter((c) => (c.section ?? '') === section)
                    .map((c) => (
                      <MenuItem
                        key={c.id}
                        checked={!custom && c.id === value}
                        disabled={!c.validated && c.id !== value}
                        label={
                          <>
                            {c.label}
                            {!c.validated && (
                              <Badge tone="outline" className="ml-2 align-middle">
                                À l'étude
                              </Badge>
                            )}
                            {c.validated && c.recommended && (
                              <Badge tone="default" className="ml-2 align-middle">
                                Recommandé
                              </Badge>
                            )}
                          </>
                        }
                        hint={
                          <>
                            {c.validated ? c.hint : (c.study ?? c.hint)}
                            {c.label !== c.id && <span className="block font-mono text-[11px]">{c.id}</span>}
                          </>
                        }
                        onSelect={() => {
                          setCustom(false)
                          onChange(c.id)
                          close()
                        }}
                      />
                    ))}
                </div>
              ))}
              <MenuSection>Autre</MenuSection>
              <MenuItem
                checked={custom}
                label="Autre modèle…"
                hint="Saisir le nom exact donné par le fournisseur."
                onSelect={() => {
                  setCustom(true)
                  close()
                }}
              />
            </>
          )}
        </DropMenu>
      )}
      {custom && (
        <Input
          id="modele"
          aria-label="Nom du modèle"
          placeholder="Nom exact du modèle"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
        />
      )}
      {!custom && known?.hint && <p className="text-xs text-muted-foreground">{known.hint}</p>}
    </div>
  )
}

/** Où vont les données : un mot et une icône, jamais la couleur seule. */
function Location({ local }: { local: boolean }) {
  return local ? (
    <Badge tone="positive" className="gap-1 whitespace-nowrap">
      <Lock className="size-3" /> Sur votre ordinateur
    </Badge>
  ) : (
    <Badge tone="outline" className="gap-1 whitespace-nowrap">
      <Cloud className="size-3" /> En ligne
    </Badge>
  )
}

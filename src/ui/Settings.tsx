import { ArrowLeft, Check, CheckCircle2, Copy, ExternalLink, HardDrive, Info, Loader2, RefreshCw, Sparkles, Trash2, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  detectOllama,
  newEngineFromPreset,
  removeEngine,
  saveEngine,
  setDefaultEngine,
  testEngine,
  useEngines,
  type EngineConfig,
  type OllamaStatus,
} from '@/app/engines'
import { href } from '@/app/router'
import { PROVIDER_PRESETS, presetById, type DataPolicy, type ModelChoice, type PresetFamily, type ProviderKind, type ProviderPreset } from '@/core/providers/presets'
import { Alert, Badge, Button, Card, CardContent, Dialog, DropMenu, Input, Label, MenuItem, MenuSection, Tooltip, cn } from './primitives'

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

function useOllama() {
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const refresh = useCallback(async () => {
    setStatus(null)
    setStatus(await detectOllama(presetById('ollama')!.baseUrl))
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh])
  return { status, refresh }
}

export function SettingsPage({ back }: { back?: string }) {
  const { engines, defaultId, loaded } = useEngines()
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
          Le moteur d'IA lit les verbatims et rédige ; OpenScribe vérifie les verbatims cités et fait les comptes. Pour commencer, créez une clé gratuite Mistral ou Google Gemini
          en quelques minutes. Pour que rien ne quitte votre ordinateur, choisissez Ollama.
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
                          {e.verified === false && <Badge tone="warning">N'a pas répondu au test</Badge>}
                          <Badge tone={policy.tone}>{policy.label}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          Modèle : {e.model}
                          {preset?.needsKey && !e.apiKey ? " · clé d'accès manquante" : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {defaultId !== e.id && (
                          <Button size="sm" variant="outline" onClick={() => setDefaultEngine(e.id)}>
                            Utiliser par défaut
                          </Button>
                        )}
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
              const presets = PROVIDER_PRESETS.filter((p) => p.family === f.id && (k.id === null || p.kind === k.id)).sort(
                (a, b) => Number(!!b.featured) - Number(!!a.featured),
              )
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
          Vos clés restent enregistrées dans ce navigateur. Pour l'analyse, seuls les verbatims partent vers le moteur choisi, avec un pseudonyme (P1, P2…) :
          jamais les noms ni les adresses.
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
  return (
    <Card className={cn('flex h-full flex-col p-4', configured && 'border-positive/60')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{preset.label.replace(/ \(.*\)$/, '')}</span>
        {configured ? (
          <Badge tone="positive">
            <Check className="size-3" /> Configuré
          </Badge>
        ) : (
          preset.family === 'free' && <Badge tone="default">Gratuit, sans carte</Badge>
        )}
      </div>
      <p className="mt-2 text-sm">{preset.bestFor}</p>
      {!compact && <p className="mt-1 text-xs text-muted-foreground">{preset.freeTier}</p>}
      {ollama !== undefined && <OllamaLine status={ollama} />}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
        {!compact ? <Badge tone={policy.tone}>{policy.label}</Badge> : <span />}
        <Button size="sm" variant={configured ? 'outline' : 'default'} onClick={onSetup}>
          {configured ? 'Modifier' : 'Configurer'}
        </Button>
      </div>
    </Card>
  )
}

function OllamaLine({ status }: { status: OllamaStatus | null }) {
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
  ollama: { status: OllamaStatus | null; refresh: () => Promise<void> }
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
                <RefreshCw /> Vérifier
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
                    {s.code && <CopyCode code={isOllama ? `ollama pull ${draft.model || 'qwen3:8b'}` : s.code} />}
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

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Réglages avancés</summary>
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
              {isOllama && !ollama.status?.running && <p>Suivez les étapes 1 et 2 ci-dessus, puis cliquez sur « Vérifier ».</p>}
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
                        label={
                          <>
                            {c.label}
                            {c.recommended && (
                              <Badge tone="default" className="ml-2 align-middle">
                                Recommandé
                              </Badge>
                            )}
                          </>
                        }
                        hint={
                          <>
                            {c.hint}
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

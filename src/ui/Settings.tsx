import { CheckCircle2, ExternalLink, KeyRound, Plus, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  newEngineFromPreset,
  removeEngine,
  saveEngine,
  setDefaultEngine,
  testEngine,
  useEngines,
  type EngineConfig,
} from '@/app/engines'
import { PROVIDER_PRESETS, presetById, type DataPolicy } from '@/core/providers/presets'
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, Input, Label } from './primitives'

const POLICY: Record<DataPolicy, { label: string; tone: 'positive' | 'warning' | 'outline' }> = {
  local: { label: 'Reste sur votre ordinateur', tone: 'positive' },
  'no-training': { label: 'Pas d’entraînement sur vos données', tone: 'positive' },
  'may-train-free': { label: 'Offre gratuite : données réutilisables', tone: 'warning' },
  check: { label: 'Politique de données à vérifier', tone: 'outline' },
}

export function SettingsPage() {
  const { engines, defaultId, loaded } = useEngines()
  const [editing, setEditing] = useState<EngineConfig | null>(null)
  const [choosing, setChoosing] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Moteurs d'IA</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          OpenScribe n'a pas de serveur : c'est votre navigateur qui s'adresse directement au fournisseur que vous
          choisissez, avec votre propre clé. Vous ne payez que ce que vous consommez chez lui, et plusieurs fournisseurs
          proposent une offre gratuite sans carte bancaire. Vos clés restent enregistrées dans ce navigateur uniquement.
        </p>
      </div>

      {loaded && engines.length === 0 && (
        <Alert>
          Aucun moteur configuré. Pour commencer gratuitement : une clé <strong>Groq</strong> ou <strong>Mistral</strong> se crée en quelques
          minutes. Pour que rien ne quitte votre ordinateur : <strong>Ollama</strong>.
        </Alert>
      )}

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
                      {defaultId === e.id && <Badge tone="positive">Par défaut</Badge>}
                      <Badge tone={policy.tone}>{policy.label}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Modèle : {e.model} · {e.requestsPerMinute} requêtes/min
                      {preset?.needsKey && !e.apiKey ? ' · clé manquante' : ''}
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

      <Button onClick={() => setChoosing(true)}>
        <Plus /> Ajouter un moteur
      </Button>

      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle>Bon à savoir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Données de participants : vérifiez que la politique du fournisseur est compatible avec le consentement que vous avez
            recueilli. Sur certaines offres gratuites, les contenus peuvent servir à entraîner des modèles.
          </p>
          <p>
            Pour limiter les dépenses : commencez par une offre gratuite, puis fixez un plafond de budget dans la console du
            fournisseur avant d'y ajouter une carte.
          </p>
          <p>Seuls des pseudonymes (P1, P2…) et le texte des réponses sont envoyés au modèle, jamais les noms ni les adresses.</p>
        </CardContent>
      </Card>

      <Dialog open={choosing} onOpenChange={setChoosing} title="Choisir un fournisseur" className="max-w-2xl">
        <ul className="grid gap-2 sm:grid-cols-2">
          {PROVIDER_PRESETS.map((p) => (
            <li key={p.id}>
              <button
                className="h-full w-full cursor-pointer rounded-lg border bg-card p-3 text-left hover:border-primary hover:bg-accent/40"
                onClick={() => {
                  setChoosing(false)
                  setEditing(newEngineFromPreset(p.id))
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.label}</span>
                  <Badge tone={POLICY[p.dataPolicy].tone}>{p.dataPolicy === 'local' ? 'Local' : p.needsKey ? 'Clé' : 'Sans clé'}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.freeTier}</p>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>

      {editing && <EngineDialog engine={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EngineDialog({ engine, onClose }: { engine: EngineConfig; onClose: () => void }) {
  const preset = presetById(engine.presetId)
  const [draft, setDraft] = useState(engine)
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const set = (patch: Partial<EngineConfig>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setTest(null)
  }
  const policy = POLICY[preset?.dataPolicy ?? 'check']

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={preset?.label ?? 'Moteur'} className="max-w-xl">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          await saveEngine(draft)
          onClose()
        }}
      >
        {preset && (
          <Alert tone={preset.dataPolicy === 'may-train-free' ? 'warning' : preset.dataPolicy === 'local' ? 'success' : 'info'}>
            <div className="flex gap-2">
              {preset.dataPolicy === 'local' ? <ShieldCheck className="size-4 shrink-0" /> : <ShieldAlert className="size-4 shrink-0" />}
              <div>
                <strong>{policy.label}.</strong> {preset.dataNote}
                <br />
                <span className="text-muted-foreground">{preset.freeTier}</span>
              </div>
            </div>
          </Alert>
        )}

        {preset?.needsKey !== false && (
          <div className="space-y-2">
            <Label htmlFor="cle">Clé API</Label>
            <Input
              id="cle"
              type="password"
              autoComplete="off"
              value={draft.apiKey}
              onChange={(e) => set({ apiKey: e.target.value.trim() })}
              placeholder="Collez votre clé ici"
            />
            {preset?.keyUrl && (
              <a href={preset.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <KeyRound className="size-3" /> Créer une clé chez {preset.label} <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="modele">Modèle</Label>
            <Input id="modele" list="modeles" value={draft.model} onChange={(e) => set({ model: e.target.value.trim() })} />
            <datalist id="modeles">
              {preset?.suggestedModels.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="debit">Requêtes par minute</Label>
            <Input
              id="debit"
              type="number"
              min={1}
              max={1000}
              value={draft.requestsPerMinute}
              onChange={(e) => set({ requestsPerMinute: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Réglages avancés</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom affiché</Label>
              <Input id="nom" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse de l'API</Label>
              <Input id="adresse" value={draft.baseUrl} onChange={(e) => set({ baseUrl: e.target.value.trim() })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parallele">Requêtes simultanées</Label>
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
            Pour des résultats reproductibles, préférez un nom de modèle avec une version datée plutôt qu'un alias « latest ».
          </p>
        </details>

        {test && (
          <Alert tone={test.ok ? 'success' : 'error'}>
            {test.ok && <CheckCircle2 className="mr-1 inline size-4" />}
            {test.message}
          </Alert>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={testing || !draft.model || !draft.baseUrl}
            onClick={async () => {
              setTesting(true)
              setTest(await testEngine(draft))
              setTesting(false)
            }}
          >
            {testing ? 'Test en cours…' : 'Tester la connexion'}
          </Button>
          <Button type="submit" disabled={!draft.model || !draft.baseUrl || (preset?.needsKey !== false && !draft.apiKey)}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

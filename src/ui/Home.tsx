import { FileUp, FlaskConical, Mic, Plus, Sparkles, Trash2, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { deleteProject, putResponses } from '@/app/db'
import { href, navigate } from '@/app/router'
import { createProject, notifyProjectsChanged, useProjects } from '@/app/store'
import { importProject, newProject, ProjectFileError, type Project } from '@/core/project'
import { activeParticipants } from '@/core/corpus'
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, Input, Label } from './primitives'
import { formatDate, plural } from './format'

function statusOf(p: Project): { label: string; tone: 'default' | 'positive' | 'warning' | 'outline' } {
  const a = p.analyses[0]
  if (!p.corpus.contributions.length) return { label: 'Aucune donnée', tone: 'outline' }
  if (!a) return { label: 'Données prêtes', tone: 'default' }
  if (a.status === 'done') return { label: 'Rapport prêt', tone: 'positive' }
  if (a.status === 'running') return { label: 'Analyse en cours', tone: 'default' }
  return { label: 'Analyse interrompue', tone: 'warning' }
}

/** Crée l'étude d'exemple et l'ouvre. */
/**
 * L'exemple est livré avec son analyse : un rapport produit une fois par un vrai
 * moteur d'IA et enregistré. On découvre ainsi un rapport réaliste sans clé.
 */
let openingExample: Promise<void> | null = null

async function openExample() {
  // Un double clic ne doit pas créer deux exemples.
  openingExample ??= loadExample().finally(() => (openingExample = null))
  return openingExample
}

async function loadExample() {
  const { project, responses } = importProject(await (await fetch('/exemple-mediatheque.openscribe.json')).text())
  await putResponses(responses)
  await createProject(project)
  navigate({ name: 'project', id: project.id, tab: 'report' })
}

export function Home() {
  const projects = useProjects()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Project | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function create() {
    const p = newProject(name)
    await createProject(p)
    setCreating(false)
    setName('')
    navigate({ name: 'project', id: p.id, tab: 'data' })
  }

  async function tryExample() {
    // Si l'exemple a déjà été ouvert, on y retourne plutôt que d'en créer un doublon.
    const existing = projects?.find((p) => p.description.startsWith('Questionnaire fictif'))
    if (existing) {
      navigate({ name: 'project', id: existing.id, tab: existing.analyses[0]?.status === 'done' ? 'report' : 'analysis' })
      return
    }
    await openExample()
  }

  async function openFile(file: File) {
    setError(null)
    try {
      const { project, responses } = importProject(await file.text())
      await putResponses(responses)
      await createProject(project)
      navigate({ name: 'project', id: project.id, tab: project.analyses.some((x) => x.status === 'done') ? 'report' : 'data' })
    } catch (e) {
      setError(e instanceof ProjectFileError ? e.message : "Impossible de lire ce fichier. Vérifiez qu'il s'agit d'une étude exportée depuis OpenScribe.")
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-x-6">
      {/* Ordre du DOM : présentation, mes études, boîte à outils (mobile) ; la grille replace la boîte à outils à droite sur grand écran. */}
      <section className="space-y-4 lg:col-start-1 lg:row-start-1 lg:self-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Comprendre ce que les gens disent,
            <br className="hidden sm:block" /> sans perdre le fil de leurs mots.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            OpenScribe découpe les réponses de vos questionnaires, entretiens ou ateliers en idées, les regroupe par sujet et
            compte qui pense quoi. Chaque chiffre du rapport mène à la phrase exacte d'une personne.
          </p>
          <ul className="grid gap-1 text-sm text-muted-foreground">
            <li>• Gratuit et libre. Vos données restent dans ce navigateur.</li>
            <li>• Vous choisissez votre moteur d'IA, y compris sur votre propre ordinateur.</li>
            <li>• Le moteur d'IA lit et rédige ; OpenScribe vérifie les citations et calcule les chiffres.</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nouvelle étude
            </Button>
            <Button variant="outline" onClick={tryExample}>
              <Sparkles /> Essayer avec un exemple
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              <FileUp /> Ouvrir une étude enregistrée
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              aria-label="Fichier d'étude OpenScribe"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) openFile(f)
                e.target.value = ''
              }}
            />
          </div>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </section>

      <section aria-labelledby="mes-etudes" className="space-y-3 lg:col-span-2 lg:row-start-2">
        <h2 id="mes-etudes" className="text-lg font-semibold">
          Mes études
        </h2>
        {projects === null ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Aucune étude pour l'instant. Créez-en une, ou essayez l'exemple pour voir le résultat en une minute.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const st = statusOf(p)
              return (
                <li key={p.id}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <a href={href({ name: 'project', id: p.id, tab: p.analyses[0]?.status === 'done' ? 'report' : 'data' })} className="block p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium leading-snug">{p.name}</h3>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {plural(activeParticipants(p.corpus).length, 'personne')} · {plural(p.corpus.contributions.length, 'réponse')} · modifiée le{' '}
                        {formatDate(p.updatedAt)}
                      </p>
                    </a>
                    <div className="flex justify-end px-2 pb-2">
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(p)} aria-label={`Supprimer ${p.name}`}>
                        <Trash2 /> Supprimer
                      </Button>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-label="La boîte à outils" className="lg:col-start-2 lg:row-start-1 lg:self-center">
        <Card className="bg-accent/40">
          <CardHeader>
            <CardTitle>La boîte à outils</CardTitle>
            <CardDescription>Des modules indépendants, qui parlent le même langage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Module icon={<FlaskConical />} title="Synthèse" text="Des réponses ouvertes au rapport : idées, groupes, consensus et désaccords." ready />
            <Module icon={<Mic />} title="Observation" text="Entretiens et tests : transcription, locuteurs, vidéo synchronisée avec le texte." />
            <Module icon={<Users />} title="Personas" text="Des profils à partir de questionnaires à échelles." />
          </CardContent>
        </Card>
      </section>

      <Dialog open={creating} onOpenChange={setCreating} title="Nouvelle étude" description="Donnez-lui un nom ; vous pourrez le changer plus tard.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            create()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="nom-etude">Nom de l'étude</Label>
            <Input id="nom-etude" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Bilan de la consultation 2026" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer cette étude ?"
        description={`« ${toDelete?.name ?? ''} » et ses analyses seront effacées de ce navigateur. Exportez-la d'abord si vous voulez la garder.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (toDelete) await deleteProject(toDelete.id)
              setToDelete(null)
              notifyProjectsChanged()
            }}
          >
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function Module({ icon, title, text, ready }: { icon: React.ReactNode; title: string; text: string; ready?: boolean }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <div className="mt-0.5 text-primary [&_svg]:size-5">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {ready ? <Badge tone="positive">Disponible</Badge> : <Badge tone="outline">Bientôt</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

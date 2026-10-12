import { FileUp, FlaskConical, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { deleteProject, putResponses } from '@/app/db'
import { href, navigate } from '@/app/router'
import { createProject, notifyProjectsChanged, useProjects } from '@/app/store'
import { activeParticipants } from '@/core/corpus'
import { importProject, newProject, ProjectFileError, type Project } from '@/core/project'
import { formatDate, plural } from './format'
import { Alert, Badge, Button, Card, Dialog, Input, Label, Tooltip } from './primitives'

function statusOf(p: Project): { label: string; tone: 'default' | 'positive' | 'warning' | 'outline' } {
  const a = p.analyses[0]
  if (!p.corpus.contributions.length) return { label: 'Aucune donnée', tone: 'outline' }
  if (!a) return { label: 'Données prêtes', tone: 'default' }
  if (a.status === 'done') return { label: 'Rapport prêt', tone: 'positive' }
  if (a.status === 'running') return { label: 'Analyse en cours', tone: 'default' }
  return { label: 'Analyse à reprendre', tone: 'warning' }
}

const EXAMPLE_FILE = '/exemple-mediatheque.openscribe.json'

/** L'étude d'exemple est livrée avec son analyse : un rapport produit une fois par un vrai moteur d'IA, puis enregistré. */
export function isExample(p: Project): boolean {
  return p.description.startsWith('Questionnaire fictif')
}

export function projectHref(p: Project): string {
  return href({ name: 'project', id: p.id, tab: p.analyses.some((a) => a.status === 'done') ? 'report' : 'data' })
}

let openingExample: Promise<void> | null = null

/**
 * Ouvre l'exemple, en le créant la première fois. Si une version plus récente
 * de l'exemple est livrée, elle remplace l'ancienne. Un double clic ne doit
 * pas créer deux exemples.
 */
export function openExample(projects: Project[] | null): Promise<void> {
  openingExample ??= (async () => {
    const { project, responses } = importProject(await (await fetch(EXAMPLE_FILE)).text())
    const existing = projects?.find(isExample)
    if (existing && existing.analyses[0]?.updatedAt === project.analyses[0]?.updatedAt) {
      window.location.hash = projectHref(existing)
      return
    }
    if (existing) await deleteProject(existing.id)
    await putResponses(responses)
    await createProject(project)
    navigate({ name: 'project', id: project.id, tab: 'report' })
  })().finally(() => (openingExample = null))
  return openingExample
}

/** Nouvelle étude, ouverture d'un fichier : les actions de création, partagées par l'accueil et l'espace Synthèse. */
export function useStudyActions() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function openFile(file: File) {
    setError(null)
    try {
      const { project, responses } = importProject(await file.text())
      await putResponses(responses)
      await createProject(project)
      window.location.hash = projectHref(project)
    } catch (e) {
      setError(e instanceof ProjectFileError ? e.message : "Impossible de lire ce fichier. Vérifiez qu'il s'agit d'une étude sauvegardée avec « Sauvegarder l'étude ».")
    }
  }

  const dialogs = (
    <>
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
      <NewStudyDialog open={creating} onOpenChange={setCreating} />
    </>
  )
  return { newStudy: () => setCreating(true), openFile: () => fileRef.current?.click(), error, dialogs }
}

function NewStudyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Nouvelle étude" description="Donnez un nom à votre étude ; vous pourrez le changer plus tard.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          // Un double clic ou un double Entrée ne doit pas créer deux études.
          if (creating) return
          setCreating(true)
          const p = newProject(name || `Étude du ${formatDate(new Date().toISOString())}`)
          await createProject(p)
          onOpenChange(false)
          setName('')
          setCreating(false)
          navigate({ name: 'project', id: p.id, tab: 'data' })
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="nom-etude">Nom de l'étude</Label>
          <Input id="nom-etude" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Entretiens usagers, printemps 2026" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={creating}>
            Créer
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function SynthesisPage() {
  const projects = useProjects()
  const actions = useStudyActions()
  const [toDelete, setToDelete] = useState<Project | null>(null)
  const mine = projects?.filter((p) => !isExample(p)) ?? null
  const example = projects?.find(isExample)

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <FlaskConical className="size-4" /> Module Synthèse
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Vos études</h1>
        <p className="max-w-2xl text-muted-foreground">
          Importez des réponses de questionnaire, des transcriptions d'entretiens ou des notes : OpenScribe en tire les motifs récurrents, compte
          qui dit quoi et rédige un rapport où chaque constat renvoie aux verbatims.
        </p>
      </header>

      <section aria-label="Liste de vos études" className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex flex-wrap gap-2">
            <Tooltip content="Rouvrir une étude sauvegardée depuis OpenScribe (fichier .openscribe.json), par exemple sur un autre ordinateur.">
              <Button variant="outline" onClick={actions.openFile}>
                <FileUp /> Ouvrir une sauvegarde
              </Button>
            </Tooltip>
            <Button onClick={actions.newStudy}>
              <Plus /> Nouvelle étude
            </Button>
          </div>
        </div>
        {actions.error && <Alert tone="error">{actions.error}</Alert>}

        {mine === null ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((p) => (
              <li key={p.id}>
                <StudyCard project={p} onDelete={() => setToDelete(p)} />
              </li>
            ))}
            {mine.length === 0 && (
              <li>
                <button
                  onClick={actions.newStudy}
                  className="flex h-full min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="size-5" />
                  Créer votre première étude
                </button>
              </li>
            )}
            <li>
              <ExampleCard project={example} onOpen={() => openExample(projects)} />
            </li>
          </ul>
        )}
      </section>

      {actions.dialogs}

      <Dialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer cette étude ?"
        description={`« ${toDelete?.name ?? ''} » et ses analyses seront effacées de ce navigateur. Sauvegardez-la d'abord si vous voulez la garder.`}
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

export function StudyCard({ project: p, onDelete }: { project: Project; onDelete?: () => void }) {
  const st = statusOf(p)
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <a href={projectHref(p)} className="block flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{p.name}</h3>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {plural(activeParticipants(p.corpus).length, 'participant')} · {plural(p.corpus.contributions.length, 'réponse')} · modifiée le{' '}
          {formatDate(p.updatedAt)}
        </p>
      </a>
      {onDelete && (
        <div className="flex justify-end px-2 pb-2">
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Supprimer ${p.name}`}>
            <Trash2 /> Supprimer
          </Button>
        </div>
      )}
    </Card>
  )
}

/** L'exemple : toujours là, visiblement à part de vos études. */
function ExampleCard({ project, onOpen }: { project?: Project; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex h-full w-full cursor-pointer flex-col rounded-xl border border-dashed border-primary/50 bg-accent/30 p-4 text-left transition-colors hover:border-primary hover:bg-accent/60"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug">Application de médiathèque</span>
        <Badge tone="default">
          <Sparkles className="size-3" /> Exemple
        </Badge>
      </span>
      <span className="mt-2 text-xs text-muted-foreground">
        Questionnaire fictif · 12 participants · rapport prêt.{' '}
        {project ? 'Reprenez-le où vous l\'avez laissé.' : 'Pour voir un rapport complet sans rien configurer.'}
      </span>
    </button>
  )
}

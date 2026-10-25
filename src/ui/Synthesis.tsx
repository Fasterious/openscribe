import { Copy, FileUp, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { deleteProject, getResponses, putResponses } from '@/app/db'
import { href, navigate } from '@/app/router'
import { createProject, notifyProjectsChanged, updateProject, useProjects } from '@/app/store'
import { activeParticipants } from '@/core/corpus'
import { corpusHash } from '@/core/analysis/pipeline'
import { corpusForAnalysis, exportProject, importProject, newProject, ProjectFileError, type Project } from '@/core/project'
import { formatDate, plural } from './format'
import { Alert, Button, Dialog, DropMenu, Input, Label, MenuItem, Tooltip } from './primitives'

function statusOf(p: Project, stale: boolean): { label: string; tone: 'default' | 'positive' | 'warning' | 'outline' } {
  const a = p.analyses[0]
  if (!p.corpus.contributions.length) return { label: 'Aucune donnée', tone: 'outline' }
  if (!a) return { label: 'Données prêtes', tone: 'default' }
  // Les données ont changé depuis le rapport : il reste lisible, mais il n'est plus « prêt ».
  if (a.status === 'done') return stale ? { label: 'Rapport à relancer', tone: 'warning' } : { label: 'Rapport prêt', tone: 'positive' }
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

/** Nouvelle synthèse, ouverture d'un fichier : les actions de création, partagées par l'accueil et l'espace Synthèse. */
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
      setError(
        e instanceof ProjectFileError
          ? e.message
          : "Impossible de lire ce fichier. Vérifiez qu'il s'agit d'une synthèse sauvegardée avec « Sauvegarder la synthèse ».",
      )
    }
  }

  const dialogs = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Fichier de synthèse OpenScribe"
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
    <Dialog open={open} onOpenChange={onOpenChange} title="Nouvelle synthèse" description="Donnez un nom à votre synthèse ; vous pourrez le changer plus tard.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          // Un double clic ou un double Entrée ne doit pas créer deux études.
          if (creating) return
          setCreating(true)
          const p = newProject(name || `Synthèse du ${formatDate(new Date().toISOString())}`)
          await createProject(p)
          onOpenChange(false)
          setName('')
          setCreating(false)
          navigate({ name: 'project', id: p.id, tab: 'data' })
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="nom-etude">Nom de la synthèse</Label>
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
  const [toRename, setToRename] = useState<Project | null>(null)
  const [renameValue, setRenameValue] = useState('')
  /** Une copie complète (données, réglages, analyses), sous un nouveau nom : pour essayer une autre analyse sans toucher à l'originale. */
  async function duplicate(p: Project) {
    const keys = [...new Set(p.analyses.flatMap((a) => a.cacheKeys ?? []))]
    const { project } = importProject(exportProject(p, await getResponses(keys)))
    await createProject({ ...project, name: `${p.name} (copie)` })
  }
  // Une synthèse supprimée quitte la liste aussitôt, sans attendre la relecture de la base (elle réapparaissait un instant).
  const [gone, setGone] = useState<Set<string>>(() => new Set())
  const mine = projects?.filter((p) => !isExample(p) && !gone.has(p.id)) ?? null
  const example = projects?.find(isExample)

  return (
    <div className="space-y-8">
      {/* Une seule ligne : le module en titre (son explication au survol), les actions à droite. */}
      <section aria-labelledby="vos-syntheses" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tooltip
            side="bottom"
            content="Importez des réponses de questionnaire, des transcriptions d'entretiens ou des notes : OpenScribe en tire les thèmes récurrents, compte qui dit quoi et rédige un rapport où chaque constat renvoie aux verbatims."
          >
            <h1 tabIndex={0} className="cursor-help text-2xl font-semibold tracking-tight sm:text-3xl">
              Synthèse
            </h1>
          </Tooltip>
          <h2 id="vos-syntheses" className="sr-only">
            Vos synthèses
          </h2>
          <div className="flex flex-wrap gap-2">
            <Tooltip content="Rouvrir une synthèse sauvegardée depuis OpenScribe (fichier .openscribe.json), par exemple sur un autre ordinateur.">
              <Button variant="outline" onClick={actions.openFile}>
                <FileUp /> Ouvrir une sauvegarde
              </Button>
            </Tooltip>
            <Button onClick={actions.newStudy}>
              <Plus /> Nouvelle synthèse
            </Button>
          </div>
        </div>
        {actions.error && <Alert tone="error">{actions.error}</Alert>}

        {mine === null ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            {/* Une liste, pas des cartes : une ligne par synthèse, alignée sur la même grille (refonte du 25/10). */}
            <ul className="divide-y border-y">
              {mine.map((p) => (
                <li key={p.id}>
                  <StudyCard
                    project={p}
                    actions={{
                      rename: () => {
                        setRenameValue(p.name)
                        setToRename(p)
                      },
                      duplicate: () => duplicate(p),
                      remove: () => setToDelete(p),
                    }}
                  />
                </li>
              ))}
              {mine.length === 0 && (
                <li className="py-5 text-sm text-muted-foreground">
                  Aucune synthèse pour l'instant. « Nouvelle synthèse » importe un questionnaire, des entretiens ou des notes.
                </li>
              )}
            </ul>
            <div className="space-y-2 pt-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pour découvrir</h2>
              <ExampleCard project={example} onOpen={() => openExample(projects)} />
            </div>
          </>
        )}
      </section>

      {actions.dialogs}

      <Dialog open={toRename !== null} onOpenChange={(o) => !o && setToRename(null)} title="Renommer la synthèse">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (toRename && renameValue.trim()) await updateProject(toRename.id, (x) => ({ ...x, name: renameValue.trim() }))
            setToRename(null)
          }}
        >
          <Input aria-label="Nouveau nom" autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setToRename(null)}>
              Annuler
            </Button>
            <Button type="submit">Renommer</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer cette synthèse ?"
        description={`« ${toDelete?.name ?? ''} » et ses analyses seront effacées de ce navigateur. Sauvegardez-la d'abord si vous voulez la garder.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (toDelete) {
                await deleteProject(toDelete.id)
                setGone((g) => new Set(g).add(toDelete.id))
              }
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

/** Le rapport porte sur d'autres données que celles de l'étude (source ajoutée, retirée…). */
function useStale(p: Project): boolean {
  const [stale, setStale] = useState(false)
  useEffect(() => {
    const a = p.analyses[0]
    if (a?.status !== 'done') return setStale(false)
    let alive = true
    corpusHash(corpusForAnalysis(p)).then((h) => alive && setStale(h !== a.corpusHash))
    return () => {
      alive = false
    }
  }, [p])
  return stale
}

const STATUS_DOT = { default: 'bg-primary', positive: 'bg-positive', warning: 'bg-warning', outline: 'bg-muted-foreground/40' } as const

export function StudyCard({ project: p, actions }: { project: Project; actions?: { rename: () => void; duplicate: () => void; remove: () => void } }) {
  const st = statusOf(p, useStale(p))
  return (
    <div className="group relative flex items-center gap-3">
      <a href={projectHref(p)} className="flex min-w-0 flex-1 flex-col gap-1 py-3.5 pr-2 sm:flex-row sm:items-center sm:gap-6">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium group-hover:text-primary">{p.name}</span>
          <span className="block text-sm text-muted-foreground tabular-nums">
            {plural(activeParticipants(p.corpus).length, 'participant')} · {plural(p.corpus.contributions.length, 'réponse')}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground sm:w-80 sm:justify-between">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground">
            <span aria-hidden className={`size-1.5 rounded-full ${STATUS_DOT[st.tone]}`} />
            {st.label}
          </span>
          <span className="whitespace-nowrap tabular-nums">modifiée le {formatDate(p.updatedAt)}</span>
        </span>
      </a>
      {/* Les actions rares (renommer, dupliquer, supprimer) restent à portée sans encombrer la ligne. */}
      {actions && (
        <div className="shrink-0">
          <DropMenu iconOnly icon={<MoreHorizontal />} label="Actions" ariaLabel={`Actions sur ${p.name}`} width="w-52">
            {(close) => (
              <>
                <MenuItem
                  icon={<Pencil className="size-4" />}
                  label="Renommer"
                  onSelect={() => {
                    close()
                    actions.rename()
                  }}
                />
                <MenuItem
                  icon={<Copy className="size-4" />}
                  label="Dupliquer"
                  onSelect={() => {
                    close()
                    actions.duplicate()
                  }}
                />
                <MenuItem
                  danger
                  icon={<Trash2 className="size-4" />}
                  label="Supprimer"
                  onSelect={() => {
                    close()
                    actions.remove()
                  }}
                />
              </>
            )}
          </DropMenu>
        </div>
      )}
    </div>
  )
}

/** L'exemple : toujours là, à part de vos synthèses, sous la même forme de ligne. */
function ExampleCard({ project, onOpen }: { project?: Project; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-accent/40"
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-medium group-hover:text-primary">Application de médiathèque</span>
        <span className="block text-sm text-muted-foreground">
          Exemple · questionnaire fictif · 12 participants · rapport prêt.{' '}
          {project ? "Reprenez-le où vous l'avez laissé." : 'Pour voir un rapport complet sans rien configurer.'}
        </span>
      </span>
    </button>
  )
}

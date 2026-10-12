import { ArrowLeft, Download, FileText, FlaskConical, Pencil, Table2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getResponses } from '@/app/db'
import { href, navigate } from '@/app/router'
import { markInterrupted, useIsRunning, useProject } from '@/app/store'
import { activeParticipants } from '@/core/corpus'
import { exportProject } from '@/core/project'
import { download, plural, slug } from '../format'
import { Badge, Button, Input, Tabs, TabsList, TabsTrigger } from '../primitives'
import { AnalysisTab } from './AnalysisTab'
import { DataTab } from './DataTab'
import { ReportTab } from './ReportTab'

export function ProjectPage({ id, tab }: { id: string; tab: 'data' | 'analysis' | 'report' }) {
  const { project, update } = useProject(id)
  const running = useIsRunning(id)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (project) markInterrupted(project)
    // On ne vérifie qu'au chargement de l'étude.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  if (project === undefined) return <p className="text-sm text-muted-foreground">Chargement…</p>
  if (project === null)
    return (
      <p>
        Cette étude n'existe pas dans ce navigateur. <a className="text-primary underline" href="#/">Retour à l'accueil</a>
      </p>
    )

  const hasData = project.corpus.contributions.length > 0
  const latest = project.analyses[0]
  const hasReport = latest?.status === 'done'

  async function exportFile() {
    const keys = [...new Set(project!.analyses.flatMap((a) => a.cacheKeys ?? []))]
    const responses = await getResponses(keys)
    download(`${slug(project!.name)}.openscribe.json`, exportProject(project!, responses), 'application/json')
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-3">
        <a href="#/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Mes études
        </a>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {renaming ? (
            <form
              className="flex w-full max-w-lg gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                await update((p) => ({ ...p, name: name.trim() || p.name }))
                setRenaming(false)
              }}
            >
              <Input aria-label="Nom de l'étude" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit">Enregistrer</Button>
            </form>
          ) : (
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <span className="truncate">{project.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Renommer l'étude"
                  onClick={() => {
                    setName(project.name)
                    setRenaming(true)
                  }}
                >
                  <Pencil />
                </Button>
              </h1>
              <p className="text-sm text-muted-foreground">
                {plural(activeParticipants(project.corpus).length, 'personne')} · {plural(project.corpus.contributions.length, 'réponse')}
                {running && (
                  <>
                    {' '}
                    · <Badge>Analyse en cours</Badge>
                  </>
                )}
              </p>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={exportFile} disabled={!hasData}>
            <Download /> Exporter l'étude
          </Button>
        </div>
        <Tabs value={tab} onValueChange={(v) => navigate({ name: 'project', id, tab: v as typeof tab })}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="data" className="flex-1 sm:flex-none">
              <Table2 className="size-4" /> Données
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1 sm:flex-none" disabled={!hasData}>
              <FlaskConical className="size-4" /> Analyse
            </TabsTrigger>
            <TabsTrigger value="report" className="flex-1 sm:flex-none" disabled={!hasReport}>
              <FileText className="size-4" /> Rapport
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === 'data' && <DataTab project={project} update={update} />}
      {tab === 'analysis' && hasData && <AnalysisTab project={project} />}
      {tab === 'report' && hasReport && <ReportTab project={project} analysis={latest} />}
      {tab !== 'data' && !hasData && (
        <p className="text-sm text-muted-foreground">
          Importez d'abord des données. <a className="text-primary underline" href={href({ name: 'project', id, tab: 'data' })}>Aller aux données</a>
        </p>
      )}
      {tab === 'report' && hasData && !hasReport && (
        <p className="text-sm text-muted-foreground">
          Le rapport apparaîtra ici à la fin de l'analyse.{' '}
          <a className="text-primary underline" href={href({ name: 'project', id, tab: 'analysis' })}>Aller à l'analyse</a>
        </p>
      )}
    </div>
  )
}

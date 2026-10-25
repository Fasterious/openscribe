import { ArrowLeft, FileText, FlaskConical, Pencil, Save, Table2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getResponses } from '@/app/db'
import { href, navigate } from '@/app/router'
import { markInterrupted, useIsRunning, useProject } from '@/app/store'
import { activeParticipants } from '@/core/corpus'
import { exportProject } from '@/core/project'
import { download, plural, slug } from '../format'
import { Alert, Badge, Button, Input, Tabs, TabsList, TabsTrigger, Tooltip } from '../primitives'
import { AnalysisTab } from './AnalysisTab'
import { DataTab } from './DataTab'
import { TAB_ACTIONS } from './slots'
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
        Cette synthèse n'existe pas dans ce navigateur.{' '}
        <a className="text-primary underline" href={href({ name: 'synthesis' })}>
          Voir vos synthèses
        </a>
      </p>
    )

  const hasData = project.corpus.contributions.length > 0
  // Le rapport affiché est celui de la dernière analyse terminée : une relance qui échoue ne le fait pas disparaître.
  const report = project.analyses.find((a) => a.status === 'done')
  const hasReport = Boolean(report)
  const newerThanReport = report && project.analyses[0] !== report ? project.analyses[0] : undefined

  async function exportFile() {
    const keys = [...new Set(project!.analyses.flatMap((a) => a.cacheKeys ?? []))]
    const responses = await getResponses(keys)
    download(`${slug(project!.name)}.openscribe.json`, exportProject(project!, responses), 'application/json')
  }

  return (
    <div className="space-y-8">
      <div className="no-print space-y-4">
        <a href={href({ name: 'synthesis' })} className="inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Vos synthèses
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
              <Input aria-label="Nom de la synthèse" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit">Valider</Button>
            </form>
          ) : (
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
                <span className="break-words">{project.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Renommer la synthèse"
                  onClick={() => {
                    setName(project.name)
                    setRenaming(true)
                  }}
                >
                  <Pencil />
                </Button>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {plural(activeParticipants(project.corpus).length, 'participant')} · {plural(project.corpus.contributions.length, 'réponse')}
                {running && (
                  <>
                    {' '}
                    · <Badge>Analyse en cours</Badge>
                  </>
                )}
              </p>
            </div>
          )}
          {/* Sur le rapport, la sauvegarde rejoint le menu « Exporter » de la barre d'actions. */}
          {tab !== 'report' && (
            <Tooltip
              side="left"
              content={
                <>
                  Vos modifications sont déjà enregistrées dans ce navigateur. Ce bouton en fait une copie complète dans un fichier (données, réglages, analyse,
                  rapport), pour la garder à l'abri ou la rouvrir sur un autre ordinateur avec « Ouvrir une sauvegarde ».
                </>
              }
            >
              <Button variant="outline" size="sm" onClick={exportFile} disabled={!hasData}>
                <Save /> Sauvegarder la synthèse
              </Button>
            </Tooltip>
          )}
        </div>
        {/* Une seule barre : les onglets à gauche, les actions de l'onglet ouvert à droite (le rapport y place ses exports et ses filtres). */}
        {/* Les onglets soulignés posés sur le filet de la page ; les actions de l'onglet ouvert à droite, sur la même ligne (au-dessus sur mobile). */}
        <div className="flex flex-col-reverse gap-3 border-b lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <Tabs value={tab} onValueChange={(v) => navigate({ name: 'project', id, tab: v as typeof tab })}>
            <TabsList>
              <TabsTrigger value="data">
                <Table2 className="size-4" /> Données
              </TabsTrigger>
              <TabsTrigger value="analysis" disabled={!hasData}>
                <FlaskConical className="size-4" /> Analyse
              </TabsTrigger>
              <TabsTrigger value="report" disabled={!hasReport}>
                <FileText className="size-4" /> Rapport
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div id={TAB_ACTIONS} className="flex flex-wrap items-center gap-2 empty:hidden lg:justify-end lg:pb-0" />
        </div>
      </div>

      {tab === 'data' && <DataTab project={project} update={update} />}
      {tab === 'analysis' && hasData && <AnalysisTab key={project.id} project={project} />}
      {tab === 'report' && report && newerThanReport && (
        <Alert tone={newerThanReport.status === 'running' ? 'info' : 'warning'} className="no-print">
          {newerThanReport.status === 'running'
            ? "Une nouvelle analyse est en cours. Ce rapport, issu de l'analyse précédente, reste affiché jusqu'à ce qu'elle se termine."
            : "La dernière analyse ne s'est pas terminée. Ce rapport est celui de l'analyse précédente, toujours valable."}{' '}
          <a className="font-medium underline" href={href({ name: 'project', id, tab: 'analysis' })}>
            Voir l'analyse
          </a>
        </Alert>
      )}
      {tab === 'report' && report && <ReportTab project={project} analysis={report} onSaveStudy={exportFile} />}
      {tab !== 'data' && !hasData && (
        <p className="text-sm text-muted-foreground">
          Importez d'abord des données.{' '}
          <a className="text-primary underline" href={href({ name: 'project', id, tab: 'data' })}>
            Aller aux données
          </a>
        </p>
      )}
      {tab === 'report' && hasData && !hasReport && (
        <p className="text-sm text-muted-foreground">
          Le rapport apparaîtra ici à la fin de l'analyse.{' '}
          <a className="text-primary underline" href={href({ name: 'project', id, tab: 'analysis' })}>
            Aller à l'analyse
          </a>
        </p>
      )}
    </div>
  )
}

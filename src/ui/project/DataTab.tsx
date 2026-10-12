import { ClipboardPaste, FileSpreadsheet, Plus, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { navigate } from '@/app/router'
import { activeParticipants, contributionsOf, mergeCorpus, promptsOf, type Corpus } from '@/core/corpus'
import { analyzeCsv, csvToCorpus, type ColumnRole, type CsvAnalysis } from '@/core/import/csv'
import { detectSpeakers, textToCorpus } from '@/core/import/text'
import type { Project } from '@/core/project'
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, Disclosure, Input, Label, Select, Textarea } from '../primitives'
import { plural } from '../format'

type Update = (change: (p: Project) => Project) => Promise<Project | undefined>

const ROLE_LABEL: Record<ColumnRole, string> = {
  open: 'Réponse ouverte — à analyser',
  attribute: 'Profil — pour comparer des groupes',
  identity: 'Nom ou identifiant — non envoyé',
  ignore: 'Ignorer',
}

function nextParticipantNumber(corpus: Corpus): number {
  const nums = corpus.participants.map((p) => Number(p.id.replace(/^P/, ''))).filter(Number.isFinite)
  return nums.length ? Math.max(...nums) + 1 : 1
}

export function DataTab({ project, update }: { project: Project; update: Update }) {
  const hasData = project.corpus.contributions.length > 0
  const [adding, setAdding] = useState(!hasData)
  const [confirmClear, setConfirmClear] = useState(false)

  const addCorpus = async (added: Corpus) => {
    await update((p) => ({ ...p, corpus: mergeCorpus(p.corpus, added) }))
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      {hasData && <CorpusSummary project={project} update={update} />}
      {hasData && !adding && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate({ name: 'project', id: project.id, tab: 'analysis' })}>Passer à l'analyse</Button>
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus /> Ajouter des données
          </Button>
          <Button variant="ghost" onClick={() => setConfirmClear(true)}>
            <Trash2 /> Tout retirer
          </Button>
        </div>
      )}
      {adding && (
        <ImportPanel
          firstNumber={nextParticipantNumber(project.corpus)}
          onImport={addCorpus}
          onCancel={hasData ? () => setAdding(false) : undefined}
        />
      )}
      <Dialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Retirer toutes les données ?"
        description="Les réponses importées seront retirées de cette étude. Les analyses déjà faites restent consultables mais deviendront obsolètes."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await update((p) => ({ ...p, corpus: { ...p.corpus, sources: [], participants: [], contributions: [] }, selectedPrompts: [] }))
              setConfirmClear(false)
              setAdding(true)
            }}
          >
            Tout retirer
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function CorpusSummary({ project, update }: { project: Project; update: Update }) {
  const corpus = project.corpus
  const prompts = promptsOf(corpus)
  const people = activeParticipants(corpus)
  const selected = new Set(project.selectedPrompts.length ? project.selectedPrompts : prompts)

  const toggle = (q: string) =>
    update((p) => {
      const all = promptsOf(p.corpus)
      const cur = new Set(p.selectedPrompts.length ? p.selectedPrompts : all)
      if (cur.has(q)) cur.delete(q)
      else cur.add(q)
      const list = all.filter((x) => cur.has(x))
      return { ...p, selectedPrompts: list.length === all.length ? [] : list }
    })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Vos données</CardTitle>
          <CardDescription>
            {plural(people.length, 'personne')} · {plural(corpus.contributions.length, 'réponse')} ·{' '}
            {plural(corpus.sources.length, 'source')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm">
            {corpus.sources.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <Badge tone="outline">{s.kind === 'survey' ? 'Questionnaire' : s.kind === 'transcript' ? 'Transcription' : 'Notes'}</Badge>
                <span className="truncate">{s.name}</span>
              </li>
            ))}
          </ul>
          {prompts.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Questions à analyser</legend>
              {prompts.map((q) => {
                const n = corpus.contributions.filter((c) => c.prompt === q).length
                return (
                  <label key={q} className="flex cursor-pointer items-start gap-2 rounded-md p-1 text-sm hover:bg-muted">
                    <input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={selected.has(q)} onChange={() => toggle(q)} />
                    <span className="min-w-0">
                      {q} <span className="text-muted-foreground">({plural(n, 'réponse')})</span>
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Les personnes</CardTitle>
          <CardDescription>Identifiées par un pseudonyme : seul lui est envoyé au moteur d'IA, avec le texte des réponses.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[28rem] space-y-2 overflow-y-auto">
          {people.map((p) => {
            const items = contributionsOf(corpus, p.id)
            return (
              <Disclosure
                key={p.id}
                summary={
                  <span className="flex flex-wrap items-center gap-2">
                    <strong>{p.label}</strong>
                    {p.label !== p.id && <span className="text-xs text-muted-foreground">{p.id}</span>}
                    {Object.values(p.attributes).slice(0, 2).map((v) => (
                      <Badge key={v} tone="outline">
                        {v}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">{plural(items.length, 'réponse')}</span>
                  </span>
                }
              >
                <ul className="space-y-2 text-sm">
                  {items.map((c) => (
                    <li key={c.id}>
                      {c.prompt && <p className="text-xs font-medium text-muted-foreground">{c.prompt}</p>}
                      <p className="whitespace-pre-wrap">{c.text}</p>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function ImportPanel({
  firstNumber,
  onImport,
  onCancel,
}: {
  firstNumber: number
  onImport: (c: Corpus) => Promise<void>
  onCancel?: () => void
}) {
  const [mode, setMode] = useState<'choose' | 'csv' | 'text'>('choose')
  const [csv, setCsv] = useState<{ name: string; analysis: CsvAnalysis; roles: Record<number, ColumnRole> } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function readFile(file: File) {
    setError(null)
    if (/\.(xlsx|xls|ods|numbers)$/i.test(file.name)) {
      setError('Ce format de tableur n’est pas encore lu directement. Exportez la feuille en CSV (Fichier › Télécharger › CSV) puis importez-la.')
      return
    }
    const text = await file.text()
    if (/\.(txt|md|srt|vtt)$/i.test(file.name)) {
      setMode('text')
      setTextInitial({ name: file.name, text })
      return
    }
    const analysis = analyzeCsv(text)
    if (!analysis.table.rows.length) {
      setError("Ce fichier ne contient aucune ligne de réponses. Vérifiez qu'il s'agit bien d'un export CSV avec une ligne d'en-tête.")
      return
    }
    setCsv({ name: file.name, analysis, roles: Object.fromEntries(analysis.columns.map((c) => [c.index, c.suggestedRole])) })
    setMode('csv')
  }
  const [textInitial, setTextInitial] = useState<{ name: string; text: string } | null>(null)

  if (mode === 'csv' && csv) {
    return (
      <CsvMapping
        csv={csv}
        setRoles={(roles) => setCsv({ ...csv, roles })}
        onBack={() => setMode('choose')}
        onImport={() => onImport(csvToCorpus(csv.analysis.table, { roles: csv.roles, sourceName: csv.name, firstParticipantNumber: firstNumber }))}
      />
    )
  }
  if (mode === 'text') {
    return <TextImport initial={textInitial} firstNumber={firstNumber} onBack={() => setMode('choose')} onImport={onImport} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer des réponses</CardTitle>
        <CardDescription>Un questionnaire exporté en CSV, ou du texte : transcription d'entretien, notes, post-its recopiés.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Choisir un fichier CSV ou texte"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) readFile(f)
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-primary bg-accent/60' : 'hover:border-primary/60 hover:bg-accent/30'
          }`}
        >
          <Upload className="size-8 text-primary" />
          <p className="font-medium">Déposez un fichier ici, ou cliquez pour le choisir</p>
          <p className="text-sm text-muted-foreground">CSV (Google Forms, Typeform, tableur…) ou texte (.txt)</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.md,text/csv,text/plain"
            className="hidden"
            aria-label="Fichier à importer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) readFile(f)
              e.target.value = ''
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTextInitial(null)
              setMode('text')
            }}
          >
            <ClipboardPaste /> Coller du texte
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          )}
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </CardContent>
    </Card>
  )
}

function CsvMapping({
  csv,
  setRoles,
  onBack,
  onImport,
}: {
  csv: { name: string; analysis: CsvAnalysis; roles: Record<number, ColumnRole> }
  setRoles: (r: Record<number, ColumnRole>) => void
  onBack: () => void
  onImport: () => void
}) {
  const openCount = Object.values(csv.roles).filter((r) => r === 'open').length
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-5 text-primary" /> {csv.name}
        </CardTitle>
        <CardDescription>
          {plural(csv.analysis.table.rows.length, 'ligne')} · {plural(csv.analysis.columns.length, 'colonne')}. Vérifiez le rôle de chaque colonne :
          nous l'avons deviné, à vous de corriger.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {csv.analysis.warnings.length > 0 && <Alert tone="warning">{csv.analysis.warnings.join(' ')}</Alert>}
        <ul className="divide-y rounded-lg border">
          {csv.analysis.columns.map((c) => (
            <li key={c.index} className="grid gap-2 p-3 sm:grid-cols-[1fr_16rem] sm:items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.header}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.filled} réponses · ex. : {c.samples.join(' · ') || '—'}
                </p>
              </div>
              <Select
                aria-label={`Rôle de la colonne ${c.header}`}
                value={csv.roles[c.index]}
                onChange={(e) => setRoles({ ...csv.roles, [c.index]: e.target.value as ColumnRole })}
              >
                {(Object.keys(ROLE_LABEL) as ColumnRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
        {openCount === 0 && <Alert tone="warning">Choisissez au moins une colonne « Réponse ouverte » à analyser.</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button disabled={openCount === 0} onClick={onImport}>
            Importer {plural(openCount, 'question')}
          </Button>
          <Button variant="ghost" onClick={onBack}>
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TextImport({
  initial,
  firstNumber,
  onBack,
  onImport,
}: {
  initial: { name: string; text: string } | null
  firstNumber: number
  onBack: () => void
  onImport: (c: Corpus) => Promise<void>
}) {
  const [text, setText] = useState(initial?.text ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const detected = useMemo(() => detectSpeakers(text), [text])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer du texte</CardTitle>
        <CardDescription>
          Une ligne par prise de parole, sous la forme « Prénom : texte », pour reconnaître les personnes. Sans locuteurs, chaque
          paragraphe devient une réponse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nom-source">Nom de la source</Label>
          <Input id="nom-source" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Entretien n°3 — Julie" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="texte">Texte</Label>
          <Textarea
            id="texte"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Animatrice : Comment s’est passée votre inscription ?\nJulie : Plutôt simplement, mais le mot de passe…'}
          />
        </div>
        {detected.hasSpeakers && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Personnes reconnues — décochez l'animateur ou l'intervieweur</legend>
            <div className="flex flex-wrap gap-2">
              {detected.speakers.map((s) => (
                <label key={s.name} className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--primary)]"
                    checked={!excluded.has(s.name)}
                    onChange={() => {
                      const n = new Set(excluded)
                      if (n.has(s.name)) n.delete(s.name)
                      else n.add(s.name)
                      setExcluded(n)
                    }}
                  />
                  {s.name} <span className="text-xs text-muted-foreground">({s.words} mots)</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Les questions des personnes décochées sont gardées comme contexte des réponses qui suivent.</p>
          </fieldset>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!text.trim()}
            onClick={() =>
              onImport(
                textToCorpus(text, {
                  sourceName: name.trim() || 'Texte importé',
                  kind: detected.hasSpeakers ? 'transcript' : 'notes',
                  excludeSpeakers: [...excluded],
                  firstParticipantNumber: firstNumber,
                }),
              )
            }
          >
            Importer
          </Button>
          <Button variant="ghost" onClick={onBack}>
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

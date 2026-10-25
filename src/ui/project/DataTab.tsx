import { ClipboardPaste, FileSpreadsheet, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { navigate } from '@/app/router'
import { activeParticipants, contributionsOf, mergeCorpus, promptsOf, removeSource, renameSource, type Corpus, type Source } from '@/core/corpus'
import { analyzeCsv, csvToCorpus, decodeText, type ColumnRole, type CsvAnalysis } from '@/core/import/csv'
import { detectSpeakers, textToCorpus } from '@/core/import/text'
import type { Project } from '@/core/project'
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, Disclosure, Input, Label, Select, Textarea } from '../primitives'
import { plural } from '../format'

type Update = (change: (p: Project) => Project) => Promise<Project | undefined>

const ROLE_LABEL: Record<ColumnRole, string> = {
  open: 'Réponse ouverte — à analyser',
  attribute: 'Profil — pour filtrer le rapport',
  identity: "Nom ou identifiant — jamais envoyé au moteur d'IA",
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

  const addCorpus = async (added: Corpus, more = false) => {
    await update((p) => ({ ...p, corpus: mergeCorpus(p.corpus, added) }))
    if (!more) setAdding(false)
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
          textSources={project.corpus.sources.filter((s) => s.kind !== 'survey').length}
          onImport={addCorpus}
          onCancel={hasData ? () => setAdding(false) : undefined}
        />
      )}
      <Dialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Retirer toutes les données ?"
        description="Les réponses importées seront retirées de cette synthèse. Les analyses déjà faites resteront consultables, mais ne correspondront plus aux données."
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
    // Deux colonnes séparées par un filet, sans cartes (refonte du 25/10) : les sources et les questions, puis les participants.
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-0">
      <section aria-labelledby="vos-donnees" className="space-y-4 lg:border-r lg:pr-8">
        <header>
          <h2 id="vos-donnees" className="text-base font-semibold">
            Vos données
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {plural(people.length, 'participant')} · {plural(corpus.contributions.length, 'réponse')} ·{' '}
            {plural(corpus.sources.length, 'source')}
          </p>
        </header>
        <ul className="space-y-1 text-sm">
          {corpus.sources.map((s) => (
            <SourceRow
              key={s.id}
              source={s}
              people={new Set(corpus.contributions.filter((c) => c.sourceId === s.id).map((c) => c.participantId)).size}
              onRename={(name) => update((p) => ({ ...p, corpus: renameSource(p.corpus, s.id, name) }))}
              onRemove={
                corpus.sources.length > 1
                  ? () => update((p) => ({ ...p, corpus: removeSource(p.corpus, s.id), selectedPrompts: p.selectedPrompts.filter((q) => promptsOf(removeSource(p.corpus, s.id)).includes(q)) }))
                  : undefined
              }
            />
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Une synthèse peut mêler un questionnaire et des entretiens : chaque entretien compte comme un participant aux réponses longues, analysé
          avec la même méthode.
        </p>
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
      </section>
      <section aria-labelledby="participants" className="space-y-4 lg:pl-8">
        <header>
          <h2 id="participants" className="text-base font-semibold">
            Les participants
          </h2>
          <p className="text-sm text-muted-foreground">
            Chaque participant reçoit un pseudonyme (P1, P2…). Pour l'analyse, seuls ce pseudonyme et ses verbatims partent vers le moteur d'IA :
            jamais son nom ni son adresse.
          </p>
        </header>
        <div className="max-h-[32rem] divide-y overflow-y-auto border-y">
        {people.map((p) => {
          const items = contributionsOf(corpus, p.id)
          return (
            <Disclosure
              key={p.id}
              plain
              summary={
                <span className="flex flex-wrap items-center gap-2">
                  <strong>{p.label}</strong>
                  {p.label !== p.id && <span className="text-xs text-muted-foreground">{p.id}</span>}
                  {Object.entries(p.attributes)
                    .slice(0, 2)
                    .map(([k, v]) => (
                      <span key={k} className="text-xs text-muted-foreground" title={`Profil (${k}) : sert à afficher un segment dans le rapport`}>
                        <span className="opacity-70">{k} :</span> {v}
                      </span>
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
        </div>
      </section>
    </div>
  )
}

const KIND_LABEL: Record<Source['kind'], string> = { survey: 'Questionnaire', transcript: 'Entretien', notes: 'Notes' }

/** Une source de l'étude : renommer (« Entretien du 18 mai — Julie ») ou retirer. */
function SourceRow({ source, people, onRename, onRemove }: { source: Source; people: number; onRename: (name: string) => void; onRemove?: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(source.name)
  const [confirm, setConfirm] = useState(false)
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Badge tone="outline">{KIND_LABEL[source.kind]}</Badge>
      {editing ? (
        <form
          className="flex min-w-0 flex-1 items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            onRename(name)
            setEditing(false)
          }}
        >
          <Input aria-label="Nom de la source" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="h-8" />
          <Button type="submit" size="sm" disabled={!name.trim()}>
            Renommer
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </form>
      ) : (
        <>
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{source.name}</span>
          <span className="text-xs text-muted-foreground">{plural(people, 'participant')}</span>
          <button type="button" className="cursor-pointer text-muted-foreground hover:text-foreground" aria-label={`Renommer ${source.name}`} onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </button>
          {onRemove &&
            (confirm ? (
              <span className="flex items-center gap-1 text-xs">
                Retirer cette source et ses réponses ?
                <Button size="sm" variant="destructive" onClick={onRemove}>
                  Retirer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                  Non
                </Button>
              </span>
            ) : (
              <button type="button" className="cursor-pointer text-muted-foreground hover:text-negative" aria-label={`Retirer ${source.name}`} onClick={() => setConfirm(true)}>
                <X className="size-3.5" />
              </button>
            ))}
        </>
      )}
    </li>
  )
}

function ImportPanel({
  firstNumber,
  textSources,
  onImport,
  onCancel,
}: {
  firstNumber: number
  /** Entretiens et notes déjà présents : pour nommer le suivant « Entretien 3 » plutôt que par son nom de fichier. */
  textSources: number
  onImport: (c: Corpus, more?: boolean) => Promise<void>
  onCancel?: () => void
}) {
  const [mode, setMode] = useState<'choose' | 'csv' | 'text'>('choose')
  const [csv, setCsv] = useState<{ name: string; analysis: CsvAnalysis; roles: Record<number, ColumnRole> } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // Plusieurs fichiers déposés ensemble (un questionnaire, une série d'entretiens) : importés l'un après l'autre, aucun n'est perdu.
  const [queue, setQueue] = useState<File[]>([])
  // Les locuteurs décochés (l'animatrice) le restent d'un entretien à l'autre de la série.
  const [excludedSpeakers, setExcludedSpeakers] = useState<string[]>([])
  /**
   * Ouvre le premier fichier lisible de la liste. Un fichier vide ou illisible
   * est sauté et signalé : il ne doit jamais laisser à l'écran le fichier
   * précédent, qu'on importerait deux fois.
   */
  async function openFirst(files: File[]): Promise<boolean> {
    const skipped: string[] = []
    let rest = files
    while (rest.length) {
      const [f, ...others] = rest
      const problem = await readFile(f)
      if (!problem) {
        setQueue(others)
        setError(skipped.length ? `Ignoré : ${skipped.join(' ; ')}` : null)
        return true
      }
      skipped.push(`${f.name} (${problem})`)
      rest = others
    }
    setQueue([])
    setMode('choose')
    setError(skipped.length === 1 && files.length === 1 ? skipped[0].replace(/^.*\((.*)\)$/, '$1') : `Ignoré : ${skipped.join(' ; ')}`)
    return false
  }
  async function readFiles(files: File[]) {
    if (files.length) await openFirst(files)
  }
  /** Fichier suivant de la série, s'il y en a un. */
  async function next(): Promise<boolean> {
    return queue.length ? openFirst(queue) : false
  }
  /** Importe, puis ouvre le fichier suivant ; sans suivant, l'import se termine. */
  async function importAndContinue(c: Corpus) {
    if (!queue.length) return onImport(c)
    await onImport(c, true)
    // Si aucun fichier suivant n'est lisible, l'import se termine là.
    if (!(await next())) await onImport({ ...c, sources: [], participants: [], contributions: [] })
  }

  /** Ouvre un fichier ; renvoie la raison s'il ne peut pas l'être. */
  async function readFile(file: File): Promise<string | null> {
    if (/\.(xlsx|xls|ods|numbers)$/i.test(file.name)) {
      return "Ce format de tableur n'est pas encore lu directement. Exportez la feuille en CSV (Google Sheets : Fichier › Télécharger › CSV ; Excel : Enregistrer sous › CSV) puis importez-la."
    }
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/') || /\.(pdf|docx?|pptx?|png|jpe?g|gif|zip)$/i.test(file.name)) {
      return 'Ce fichier ne contient pas de texte lisible. Importez un CSV (questionnaire) ou un fichier texte (transcription, notes).'
    }
    const text = decodeText(await file.arrayBuffer())
    if (!text.trim()) {
      return 'Ce fichier est vide.'
    }
    if (/\.(txt|md|srt|vtt)$/i.test(file.name)) {
      setMode('text')
      setTextInitial({ name: file.name, text, n: ++textCount.current })
      return null
    }
    const analysis = analyzeCsv(text)
    if (!analysis.table.rows.length) {
      return "Ce fichier ne contient aucune ligne de réponses. Vérifiez qu'il s'agit bien d'un export CSV avec une ligne d'en-tête."
    }
    setCsv({ name: file.name, analysis, roles: Object.fromEntries(analysis.columns.map((c) => [c.index, c.suggestedRole])) })
    setMode('csv')
    return null
  }
  const [textInitial, setTextInitial] = useState<{ name: string; text: string; n: number } | null>(null)
  const textCount = useRef(textSources)

  // Un fichier sauté dans une série reste signalé au-dessus du fichier suivant.
  const notice = error && mode !== 'choose' ? <Alert tone="warning">{error}</Alert> : null
  if (mode === 'csv' && csv) {
    return (
      <div className="space-y-3">
      {notice}
      <CsvMapping
        csv={csv}
        setRoles={(roles) => setCsv({ ...csv, roles })}
        onBack={() => setMode('choose')}
        remaining={queue.length}
        onImport={() => importAndContinue(csvToCorpus(csv.analysis.table, { roles: csv.roles, sourceName: csv.name, firstParticipantNumber: firstNumber }))}
      />
      </div>
    )
  }
  if (mode === 'text') {
    return (
      <div className="space-y-3">
      {notice}
      <TextImport
        key={`${textInitial?.name ?? 'collé'}-${textInitial?.n ?? 0}`}
        initial={textInitial}
        defaultName={`Entretien ${textInitial?.n ?? textSources + 1}`}
        excludedSpeakers={excludedSpeakers}
        onExcludedChange={setExcludedSpeakers}
        firstNumber={firstNumber}
        remaining={queue.length}
        onSkip={
          queue.length
            ? () => {
                // Un fichier passé ne consomme pas de numéro : le suivant reprend « Entretien 2 ».
                textCount.current -= 1
                next()
              }
            : undefined
        }
        onBack={() => {
          setQueue([])
          setMode('choose')
        }}
        onImport={importAndContinue}
      />
      </div>
    )
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
            readFiles([...e.dataTransfer.files])
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-primary bg-accent/60' : 'hover:border-primary/60 hover:bg-accent/30'
          }`}
        >
          <Upload className="size-8 text-primary" />
          <p className="font-medium">Déposez vos fichiers ici, ou cliquez pour les choisir</p>
          <p className="text-sm text-muted-foreground">Un questionnaire en CSV (Google Forms, Typeform, tableur…), des entretiens ou des notes en texte (.txt) : plusieurs à la fois si besoin</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.md,text/csv,text/plain"
            multiple
            className="hidden"
            aria-label="Fichier à importer"
            onChange={(e) => {
              readFiles([...(e.target.files ?? [])])
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
  remaining = 0,
  onBack,
  onImport,
}: {
  csv: { name: string; analysis: CsvAnalysis; roles: Record<number, ColumnRole> }
  setRoles: (r: Record<number, ColumnRole>) => void
  remaining?: number
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
          {plural(csv.analysis.table.rows.length, 'ligne')} · {plural(csv.analysis.columns.length, 'colonne')}. Nous avons proposé un rôle pour chaque
          colonne : vérifiez-le et corrigez-le si besoin.
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
                  {plural(c.filled, 'réponse')} · ex. : {c.samples.join(' · ') || '—'}
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
          <Button disabled={openCount === 0} onClick={onImport} className="h-auto whitespace-normal py-2 text-left">
            Importer les réponses à {plural(openCount, 'question')}
            {remaining > 0 && ` · fichier suivant ensuite (${remaining})`}
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
  defaultName,
  excludedSpeakers,
  onExcludedChange,
  firstNumber,
  remaining = 0,
  onSkip,
  onBack,
  onImport,
}: {
  initial: { name: string; text: string } | null
  defaultName: string
  excludedSpeakers: string[]
  onExcludedChange: (names: string[]) => void
  firstNumber: number
  remaining?: number
  onSkip?: () => void
  onBack: () => void
  onImport: (c: Corpus) => Promise<void>
}) {
  const [text, setText] = useState(initial?.text ?? '')
  // Par défaut « Entretien 2 » plutôt que le nom du fichier, qui contient souvent le prénom de la personne interrogée.
  const [name, setName] = useState(defaultName)
  const [excludedRaw, setExcludedRaw] = useState<Set<string>>(new Set(excludedSpeakers))
  const excluded = excludedRaw
  const setExcluded = (n: Set<string>) => {
    setExcludedRaw(n)
    onExcludedChange([...n])
  }
  const detected = useMemo(() => detectSpeakers(text), [text])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer du texte</CardTitle>
        <CardDescription>
          Une ligne par prise de parole, sous la forme « Prénom : texte », pour reconnaître les locuteurs. Sans locuteurs, chaque
          paragraphe devient une réponse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nom-source">Nom de la source</Label>
          <Input id="nom-source" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Entretien du 18 mai" />
          {initial?.name && (
            <p className="text-xs text-muted-foreground">
              Fichier : {initial.name}. Le nom de la source apparaît dans le rapport à côté des verbatims : évitez d'y mettre le prénom de la personne.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="texte">Texte</Label>
          <Textarea
            id="texte"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Animatrice : Comment s'est passée votre inscription ?\nJulie : Plutôt simplement, mais le mot de passe…"}
          />
        </div>
        {detected.hasSpeakers && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Locuteurs reconnus — décochez l'animateur ou l'intervieweur</legend>
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
            <p className="text-xs text-muted-foreground">Ce que disent les locuteurs décochés n'est pas analysé : leurs questions servent de contexte aux réponses qui suivent.</p>
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
            {remaining > 0 ? `Importer · fichier suivant ensuite (${remaining})` : 'Importer'}
          </Button>
          {onSkip && (
            <Button variant="outline" onClick={onSkip}>
              Passer ce fichier
            </Button>
          )}
          <Button variant="ghost" onClick={onBack}>
            Retour
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

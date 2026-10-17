import { CORPUS_FORMAT_VERSION, type Corpus, type SourceKind } from '../corpus'
import { randomId } from '../ids'

/**
 * Import de texte libre : une transcription, des notes, des post-its recopiés.
 *
 * Deux formes sont reconnues :
 * - « Locuteur : texte » sur chaque ligne (ou « [Locuteur] texte », ou
 *   « Locuteur (00:12:03) : texte ») → un participant par locuteur ;
 * - du texte sans locuteurs → un seul participant, une contribution par paragraphe.
 *
 * Les lignes successives d'un même locuteur sont regroupées en un seul tour de
 * parole. Les horodatages éventuels sont conservés.
 */

const SPEAKER_LINE =
  /^\s*(?:\[(?<b>[^\]]{1,40})\]|(?<n>[\p{L}\p{N}][\p{L}\p{N} ._'’-]{0,38}?))\s*(?:\((?<t>\d{1,2}:\d{2}(?::\d{2})?)\))?\s*[:：]\s+(?<text>.+)$/u
const TIME_PREFIX = /^\s*\[?(?<t>\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[-–—]?\s*/

export interface TextImportOptions {
  sourceName: string
  kind?: SourceKind
  /** Locuteurs à exclure de l'analyse (animateur, intervieweur…). */
  excludeSpeakers?: string[]
  firstParticipantNumber?: number
}

export interface DetectedSpeakers {
  speakers: { name: string; turns: number; words: number }[]
  hasSpeakers: boolean
}

function parseTime(t: string | undefined): number | undefined {
  if (!t) return undefined
  const parts = t.split(':').map(Number)
  return parts.reduce((acc, p) => acc * 60 + p, 0)
}

interface Turn {
  speaker: string | null
  text: string
  start?: number
}

export function splitTurns(raw: string): Turn[] {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  const turns: Turn[] = []
  let current: Turn | null = null
  const looksLikeDialogue =
    lines.filter((l) => SPEAKER_LINE.test(l)).length >= Math.max(2, lines.filter((l) => l.trim()).length * 0.3)

  for (const line of lines) {
    if (!line.trim()) {
      if (!looksLikeDialogue && current) {
        turns.push(current)
        current = null
      }
      continue
    }
    const m = looksLikeDialogue ? SPEAKER_LINE.exec(line) : null
    if (m?.groups) {
      const speaker = (m.groups.b ?? m.groups.n ?? '').trim()
      const text = m.groups.text.trim()
      const start = parseTime(m.groups.t)
      if (current && current.speaker === speaker) {
        current.text += ` ${text}`
      } else {
        if (current) turns.push(current)
        current = { speaker, text, start }
      }
    } else {
      const tm = TIME_PREFIX.exec(line)
      const text = line.replace(TIME_PREFIX, '').trim()
      if (current) {
        current.text += ` ${text}`
      } else {
        current = { speaker: null, text, start: parseTime(tm?.groups?.t) }
      }
    }
  }
  if (current) turns.push(current)
  return turns.filter((t) => t.text.trim())
}

export function detectSpeakers(raw: string): DetectedSpeakers {
  const turns = splitTurns(raw)
  const map = new Map<string, { turns: number; words: number }>()
  for (const t of turns) {
    if (!t.speaker) continue
    const s = map.get(t.speaker) ?? { turns: 0, words: 0 }
    s.turns++
    s.words += t.text.split(/\s+/).length
    map.set(t.speaker, s)
  }
  const speakers = [...map.entries()].map(([name, s]) => ({ name, ...s }))
  return { speakers, hasSpeakers: speakers.length > 0 }
}

export function textToCorpus(raw: string, options: TextImportOptions): Corpus {
  const sourceId = randomId('src')
  const turns = splitTurns(raw)
  const exclude = new Set((options.excludeSpeakers ?? []).map((s) => s.toLowerCase()))
  const first = options.firstParticipantNumber ?? 1
  const corpus: Corpus = {
    formatVersion: CORPUS_FORMAT_VERSION,
    sources: [
      { id: sourceId, kind: options.kind ?? 'transcript', name: options.sourceName, importedAt: new Date().toISOString() },
    ],
    participants: [],
    contributions: [],
  }
  const ids = new Map<string, string>()
  const idFor = (speaker: string) => {
    let id = ids.get(speaker)
    if (!id) {
      id = `P${first + ids.size}`
      ids.set(speaker, id)
      corpus.participants.push({ id, label: speaker, attributes: {} })
    }
    return id
  }

  // La dernière intervention d'un locuteur exclu (l'animateur) sert de
  // « question » aux réponses qui suivent : c'est le contexte de ce qui est dit.
  let lastQuestion: string | undefined
  turns.forEach((t, i) => {
    const speaker = t.speaker ?? options.sourceName
    if (exclude.has(speaker.toLowerCase())) {
      lastQuestion = t.text.length > 300 ? `${t.text.slice(0, 297)}…` : t.text
      return
    }
    const next = turns[i + 1]
    corpus.contributions.push({
      id: `${sourceId}-T${i + 1}`,
      participantId: idFor(speaker),
      sourceId,
      prompt: lastQuestion,
      text: t.text.trim(),
      time: t.start !== undefined ? { start: t.start, end: next?.start ?? t.start } : undefined,
    })
  })
  return corpus
}

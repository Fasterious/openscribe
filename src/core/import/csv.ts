import Papa from 'papaparse'
import { CORPUS_FORMAT_VERSION, type Corpus } from '../corpus'
import { randomId } from '../ids'

/**
 * Import d'un questionnaire exporté en CSV (Google Forms, Typeform, LimeSurvey,
 * tableur…). Une ligne = une personne, une colonne = une question.
 *
 * L'import se fait en deux temps : on analyse d'abord les colonnes pour
 * proposer un rôle à chacune, l'utilisateur corrige, puis on construit le corpus.
 */

export type ColumnRole =
  /** Réponse ouverte : sera analysée. */
  | 'open'
  /** Réponse fermée (choix, échelle) : sert à segmenter les participants. */
  | 'attribute'
  /** Nom, prénom, pseudo : sert d'étiquette seulement si l'utilisateur le décide. */
  | 'identity'
  /** Horodatage, e-mail, colonnes techniques : ignorées. */
  | 'ignore'

export interface ColumnInfo {
  index: number
  header: string
  suggestedRole: ColumnRole
  /** Nombre de réponses non vides. */
  filled: number
  /** Nombre de valeurs distinctes. */
  distinct: number
  /** Longueur moyenne des réponses non vides, en caractères. */
  avgLength: number
  /** Quelques exemples de valeurs, pour aider l'utilisateur à décider. */
  samples: string[]
}

export interface ParsedTable {
  headers: string[]
  rows: string[][]
}

export interface CsvAnalysis {
  table: ParsedTable
  columns: ColumnInfo[]
  /** Problèmes non bloquants détectés à la lecture. */
  warnings: string[]
}

const TECHNICAL_HEADER = /horodat|timestamp|date de soumission|submitted|submission|^id$|response id|adresse e-?mail|e-?mail address|^e-?mail$|ip address|user agent/i
const IDENTITY_HEADER = /^(nom|prénom|prenom|name|first name|last name|pseudo|nom complet|full name|votre nom|votre prénom)\b/i

export function parseCsvText(text: string): { table: ParsedTable; warnings: string[] } {
  const clean = text.replace(/^﻿/, '')
  const result = Papa.parse<string[]>(clean, { skipEmptyLines: 'greedy' })
  const warnings = result.errors
    .filter((e) => e.type !== 'Delimiter')
    .slice(0, 5)
    .map((e) => `Ligne ${(e.row ?? 0) + 1} : ${e.message}`)
  const data = result.data.filter((r) => r.some((cell) => String(cell ?? '').trim() !== ''))
  if (data.length === 0) return { table: { headers: [], rows: [] }, warnings: ['Le fichier est vide.'] }
  const width = Math.max(...data.map((r) => r.length))
  const headers = Array.from({ length: width }, (_, i) => String(data[0][i] ?? '').trim() || `Colonne ${i + 1}`)
  const rows = data.slice(1).map((r) => Array.from({ length: width }, (_, i) => String(r[i] ?? '').trim()))
  return { table: { headers: dedupeHeaders(headers), rows }, warnings }
}

function dedupeHeaders(headers: string[]): string[] {
  const count = new Map<string, number>()
  return headers.map((h) => {
    const n = (count.get(h) ?? 0) + 1
    count.set(h, n)
    return n === 1 ? h : `${h} (${n})`
  })
}

export function analyzeColumns(table: ParsedTable): ColumnInfo[] {
  return table.headers.map((header, index) => {
    const values = table.rows.map((r) => r[index]).filter((v) => v !== '')
    const distinct = new Set(values).size
    const avgLength = values.length ? values.reduce((s, v) => s + v.length, 0) / values.length : 0
    const samples = [...new Set(values)].slice(0, 3).map((v) => (v.length > 80 ? `${v.slice(0, 77)}…` : v))
    return {
      index,
      header,
      filled: values.length,
      distinct,
      avgLength,
      samples,
      suggestedRole: suggestRole(header, values, distinct, avgLength, table.rows.length),
    }
  })
}

function suggestRole(
  header: string,
  values: string[],
  distinct: number,
  avgLength: number,
  rowCount: number,
): ColumnRole {
  if (values.length === 0) return 'ignore'
  if (TECHNICAL_HEADER.test(header)) return 'ignore'
  if (values.filter((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)).length > values.length / 2) return 'ignore'
  if (IDENTITY_HEADER.test(header)) return 'identity'
  // Valeurs courtes et presque toutes différentes : un identifiant ou un nom.
  const looksNumeric = values.every((v) => /^-?\d+([.,]\d+)?$/.test(v))
  if (!looksNumeric && avgLength < 12 && values.length >= 3 && distinct >= values.length * 0.9) return 'identity'
  if (looksNumeric) return 'attribute'
  // Peu de valeurs différentes et courtes : un choix fermé.
  const fewValues = distinct <= Math.max(8, Math.ceil(rowCount * 0.3))
  if (fewValues && avgLength < 40) return 'attribute'
  // Texte assez long ou très varié : une réponse ouverte.
  if (avgLength >= 15 || distinct > rowCount * 0.6) return 'open'
  return 'attribute'
}

export function analyzeCsv(text: string): CsvAnalysis {
  const { table, warnings } = parseCsvText(text)
  return { table, columns: analyzeColumns(table), warnings }
}

export interface CsvImportOptions {
  /** Rôle retenu pour chaque colonne (index → rôle). */
  roles: Record<number, ColumnRole>
  /** Nom de la source (nom du fichier). */
  sourceName: string
  /**
   * Utiliser la colonne d'identité comme étiquette des participants.
   * Désactivé par défaut : les participants restent pseudonymes (P1, P2…).
   */
  useIdentityAsLabel?: boolean
  /** Premier numéro de participant (pour ajouter à un corpus existant). */
  firstParticipantNumber?: number
}

export function csvToCorpus(table: ParsedTable, options: CsvImportOptions): Corpus {
  const sourceId = randomId('src')
  const openCols = table.headers.map((_, i) => i).filter((i) => options.roles[i] === 'open')
  const attrCols = table.headers.map((_, i) => i).filter((i) => options.roles[i] === 'attribute')
  const identityCol = table.headers.findIndex((_, i) => options.roles[i] === 'identity')
  const first = options.firstParticipantNumber ?? 1

  const corpus: Corpus = {
    formatVersion: CORPUS_FORMAT_VERSION,
    sources: [{ id: sourceId, kind: 'survey', name: options.sourceName, importedAt: new Date().toISOString() }],
    participants: [],
    contributions: [],
  }

  table.rows.forEach((row, r) => {
    const pid = `P${first + r}`
    const identity = identityCol >= 0 ? row[identityCol] : ''
    corpus.participants.push({
      id: pid,
      label: options.useIdentityAsLabel && identity ? identity : pid,
      attributes: Object.fromEntries(attrCols.map((i) => [table.headers[i], row[i]]).filter(([, v]) => v !== '')),
    })
    for (const i of openCols) {
      const text = row[i]
      if (!text) continue
      corpus.contributions.push({
        id: `${pid}-Q${i + 1}`,
        participantId: pid,
        sourceId,
        prompt: table.headers[i],
        text,
      })
    }
  })
  return corpus
}

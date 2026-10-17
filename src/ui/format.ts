import type { IdeaCategory } from '@/core/analysis/types'

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n > 1 ? many : one}`
}

export const CATEGORY: Record<IdeaCategory, { label: string; plural: string; tone: IdeaCategory; mark: string }> = {
  positive: { label: 'Positif', plural: 'Positifs', tone: 'positive', mark: '+' },
  negative: { label: 'Négatif', plural: 'Négatifs', tone: 'negative', mark: '−' },
  suggestion: { label: 'Suggestion', plural: 'Suggestions', tone: 'suggestion', mark: '→' },
  question: { label: 'Question', plural: 'Questions', tone: 'question', mark: '?' },
  neutral: { label: 'Constat', plural: 'Constats', tone: 'neutral', mark: '·' },
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slug(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'etude'
  )
}

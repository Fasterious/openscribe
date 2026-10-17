/**
 * Couverture d'une réponse par les idées extraites.
 *
 * Dans une longue réponse, le modèle laisse parfois des idées de côté. Le code
 * repère les passages qu'aucune citation ne couvre ; s'ils sont assez longs
 * pour porter une idée, on les soumet une seconde fois au modèle.
 */

/** Lettres et chiffres d'un passage : la ponctuation et les espaces ne portent pas d'idée. */
function contentLength(s: string): number {
  return (s.match(/[\p{L}\p{N}]/gu) ?? []).length
}

/**
 * Passages d'un texte qu'aucun intervalle ne couvre, découpés aux limites de
 * phrase, et gardés seulement s'ils contiennent au moins `minContent` lettres.
 */
export function uncoveredPassages(text: string, spans: { start: number; end: number }[], minContent = 60): string[] {
  return uncoveredWithContext(text, spans, minContent).map((p) => p.text)
}

/**
 * Les mêmes passages, chacun avec ce qui le précède dans la réponse (jusqu'à `contextChars` caractères,
 * coupé à un début de mot) : seul, un passage peut changer de sens. « Par exemple les horaires, la navette
 * du samedi… » illustre une critique quand la phrase d'avant dit « on n'ouvre aucune perspective ».
 */
export function uncoveredWithContext(
  text: string,
  spans: { start: number; end: number }[],
  minContent = 60,
  contextChars = 220,
): { text: string; before?: string }[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const gaps: { start: number; end: number }[] = []
  let pos = 0
  for (const s of sorted) {
    if (s.start > pos) gaps.push({ start: pos, end: s.start })
    pos = Math.max(pos, s.end)
  }
  if (pos < text.length) gaps.push({ start: pos, end: text.length })
  return gaps
    .map((g) => {
      const raw = text.slice(g.start, g.end)
      const start = g.start + (raw.length - raw.trimStart().length)
      const prev = text.slice(Math.max(0, start - contextChars), start)
      const before = (start > contextChars ? prev.slice(prev.indexOf(' ') + 1) : prev).trim()
      return { text: raw.trim(), ...(before ? { before } : {}) }
    })
    .filter((p) => contentLength(p.text) >= minContent)
}

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
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const gaps: string[] = []
  let pos = 0
  for (const s of sorted) {
    if (s.start > pos) gaps.push(text.slice(pos, s.start))
    pos = Math.max(pos, s.end)
  }
  if (pos < text.length) gaps.push(text.slice(pos))
  return gaps.map((g) => g.trim()).filter((g) => contentLength(g) >= minContent)
}

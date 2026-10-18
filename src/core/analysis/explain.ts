import { computeMetrics, stanceOf } from './metrics'
import { conclusionMove, dividedFragile } from './highlights'
import type { Group, Idea, Metrics } from './types'

/**
 * Ce que le lecteur doit comprendre d'une étiquette, calculé par le code seul, cas par cas
 * (`docs/LECTURE-RAPPORT.md`, §6, textes relus par le `methodologue`) : pourquoi « fragile », pourquoi « à vérifier »,
 * et le verdict d'un motif dans son thème. Aucun texte du moteur d'IA : chiffres et personnes viennent des indicateurs.
 */

/** Le verdict d'un motif, tel que le résument les étiquettes d'un thème (« ● 4 critiqués »). */
export type Verdict = 'appreciated' | 'criticized' | 'divided' | 'nomajority' | 'few' | 'none'

/**
 * Un verdict n'est jamais plus fort que l'étiquette du motif : « pas de majorité, penche vers le négatif » reste
 * « sans majorité ». Un motif sans aucun avis (seulement des propositions) est « sans avis », pas « peu d'avis ».
 * Les motifs d'un seul participant sont comptés à part (« signal isolé ») par l'affichage.
 */
export function verdictOf(m: Metrics): Verdict {
  if ((m.stance === 'unanimous' || m.stance === 'consensus' || m.stance === 'majority') && m.majority)
    return m.majority === 'positive' ? 'appreciated' : 'criticized'
  if (m.stance === 'divided') return 'divided'
  if (m.stance === 'lean') return 'nomajority'
  if (m.stance === 'none') return 'none'
  return 'few'
}

/** L'ordre des étiquettes d'un thème : ce qui est apprécié, critiqué, discuté, puis le reste. */
export const VERDICT_ORDER: Verdict[] = ['appreciated', 'criticized', 'divided', 'nomajority', 'few', 'none']

/** « 1 apprécié », « 4 critiqués », « 1 qui divise », « 2 qui divisent »… */
export function verdictLabel(v: Verdict, n: number): string {
  const many = n > 1
  const word = {
    appreciated: many ? 'appréciés' : 'apprécié',
    criticized: many ? 'critiqués' : 'critiqué',
    divided: many ? 'qui divisent' : 'qui divise',
    nomajority: 'sans majorité',
    few: "avec peu d'avis",
    none: 'sans avis',
  }[v]
  return `${n} ${word}`
}

/** Les verdicts des motifs d'un thème, comptés, dans l'ordre d'affichage. */
export function themeVerdicts(groups: Metrics[]): { verdict: Verdict; count: number }[] {
  const counts = new Map<Verdict, number>()
  for (const m of groups) counts.set(verdictOf(m), (counts.get(verdictOf(m)) ?? 0) + 1)
  return VERDICT_ORDER.filter((v) => counts.has(v)).map((v) => ({ verdict: v, count: counts.get(v)! }))
}

const WORD: Record<Metrics['stance'], string> = {
  unanimous: 'unanime',
  consensus: 'large majorité',
  majority: 'majorité',
  lean: 'pas de majorité',
  divided: 'avis partagés',
  thin: "peu d'avis",
  none: "pas d'avis",
}
const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`
/**
 * Espaces insécables de la typographie française (avant « : », « ; », « ? », dans les guillemets) : aucune ligne ne
 * commence par un deux-points ni ne finit sur un guillemet ouvrant (plume, 18/10).
 */
const nbsp = (t: string) =>
  t
    .replace(/ ([:»])/g, '\u00a0$1')
    .replace(/ ([;?!])/g, '\u202f$1')
    .replace(/« /g, '«\u00a0')
/** « du motif « Accès… » », « du motif « École… » » : l'élision se fait sur « motif », jamais sur le titre. */
const motifName = (title: string) => `du thème « ${title} »`
/** « 2 avis positifs contre 4 négatifs et 1 mitigé » : la répartition après la bascule, mitigés compris. */
const split = (P: number, N: number, M: number) =>
  `${count(P, 'avis positif', 'avis positifs')} contre ${count(N, 'négatif', 'négatifs')}${M ? ` et ${count(M, 'mitigé', 'mitigés')}` : ''}`

/**
 * Pourquoi « fragile », dans ce cas précis : une seule voix changerait la conclusion. Aucune personne n'est désignée :
 * n'importe laquelle des voix du camp suffirait.
 */
export function fragileReason(g: Group): string | undefined {
  const m = g.metrics
  const P = m.positiveOnly.length
  const N = m.negativeOnly.length
  const M = m.mixed.length
  const T = P + N + M
  if (m.stance === 'divided') {
    if (!dividedFragile(g)) return undefined
    // Une voix du plus petit camp qui rejoint le plus grand : celui-ci l'emporte.
    const bigPos = P >= N
    const [p, n] = bigPos ? [P + 1, N - 1] : [P - 1, N + 1]
    const after = stanceOf(p, n, M)
    if (after === 'divided') return undefined
    return nbsp(
      `${P} ${P > 1 ? 'personnes donnent' : 'personne donne'} un avis positif, ${N} un avis négatif${M ? ` et ${M} un avis mitigé` : ''} : le plus petit camp compte au moins la moitié du plus grand, d'où « avis partagés ». Si une seule des ${bigPos ? N : P} personnes d'avis ${bigPos ? 'négatif' : 'positif'} avait donné un avis ${bigPos ? 'positif' : 'négatif'}, ce serait ${split(p, n, M)} : « ${WORD[after]} » (${Math.max(p, n)} sur ${T}). La conclusion tient donc à une voix.`,
    )
  }
  const move = conclusionMove(m)
  if (!move) return undefined
  const pos = m.majority === 'positive'
  const D = pos ? P : N
  const consequence =
    move.stance === 'divided'
      ? 'les avis seraient partagés, le plus petit camp comptant au moins la moitié du plus grand'
      : move.stance === 'lean'
        ? 'aucun camp ne dépasserait la moitié des avis'
        : `« ${WORD[move.stance]} »`
  const as = move.as === 'mixed' ? 'mitigé' : move.as === 'positive' ? 'positif' : 'négatif'
  return nbsp(
    `Sur les ${T} personnes qui donnent un avis, ${D} ${D > 1 ? 'sont' : 'est'} d'avis ${pos ? 'positif' : 'négatif'}${M ? ` et ${M} d'avis mitigé` : ''}. Si une seule de ces ${D} personnes avait donné un avis ${as}, ce serait ${split(move.P, move.N, move.M)} : ${consequence}. La conclusion tient donc à une voix : citez le chiffre (${D} sur ${T}) plutôt que l'étiquette seule, et lisez les verbatims des deux camps.`,
  )
}

const byNumber = (a: string, b: string) => a.localeCompare(b, 'fr', { numeric: true })
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}` : (xs[0] ?? ''))
const RANK: Record<Metrics['stance'], number> = { unanimous: 5, consensus: 4, majority: 3, lean: 2, divided: 1, thin: 0, none: 0 }

/**
 * Pourquoi « à vérifier » : combien des personnes qui donnent un avis ne sont comptées ici que par une idée rangée
 * d'abord dans un autre motif (copie du codage en double), dans quel camp, venues d'où ; ce que serait l'étiquette
 * sans ces idées. Les personnes se comptent par la différence des camps avant et après, pas par le nombre de copies
 * (une personne peut avoir aussi une idée à elle). `ideaIds` : toutes les copies, quel que soit leur camp.
 */
export function doubtReason(
  g: Group,
  ideas: Map<string, Idea>,
  alsoIn: (idea: Idea) => string | undefined,
): { text: string; ideaIds: string[] } | undefined {
  const all = g.ideaIds.map((id) => ideas.get(id)).filter((i): i is Idea => !!i)
  const copies = all.filter((i) => i.copyOf)
  if (!copies.length) return undefined
  const before = g.metrics
  const after = computeMetrics(all.filter((i) => !i.copyOf))
  if (after.stance === before.stance) return undefined
  const camp = (m: Metrics) => {
    const c = new Map<string, 'positive' | 'negative' | 'mixed'>()
    for (const p of m.positiveOnly) c.set(p, 'positive')
    for (const p of m.negativeOnly) c.set(p, 'negative')
    for (const p of m.mixed) c.set(p, 'mixed')
    return c
  }
  const was = camp(before)
  const now = camp(after)
  const T = was.size
  const gone = [...was].filter(([p]) => !now.has(p))
  const changed = [...was].filter(([p, c]) => now.has(p) && now.get(p) !== c)
  // D'où vient chaque personne retirée : le motif où son idée a été rangée d'abord.
  const from = (p: string) => {
    const c = copies.find((i) => i.participantId === p && (i.category === 'positive' || i.category === 'negative'))
    return (c && alsoIn(c)) ?? 'un autre thème'
  }
  const describe = (side: 'positive' | 'negative' | 'mixed', one: string, many: string) => {
    const people = gone.filter(([, c]) => c === side).map(([p]) => p)
    if (!people.length) return ''
    const where = new Map<string, string[]>()
    for (const p of people) where.set(from(p), [...(where.get(from(p)) ?? []), p])
    // Le motif d'abord, puis ses personnes : « (« Démarches d'inscription » : P109 et P227 ; « Carte scolaire » : P137) ».
    return `${count(people.length, one, many)} (${[...where].map(([other, who]) => `« ${other} » : ${list(who.sort(byNumber))}`).join(' ; ')})`
  }
  const parts = [describe('positive', 'avis positif', 'avis positifs'), describe('negative', 'avis négatif', 'avis négatifs'), describe('mixed', 'avis mitigé', 'avis mitigés')].filter(Boolean)
  const to = now.get(changed[0]?.[0] ?? '') === 'positive' ? 'positif' : 'négatif'
  const movedText = (other: boolean) =>
    `${changed.length} ${other ? (changed.length > 1 ? 'autres personnes passeraient' : 'autre personne passerait') : changed.length > 1 ? 'personnes passeraient' : 'personne passerait'} d'un avis mitigé à un avis ${to}`
  const T2 = now.size
  const D2 = Math.max(after.positiveOnly.length, after.negativeOnly.length)
  const verdict =
    after.stance === 'thin' || after.stance === 'none'
      ? "« peu d'avis », trop peu pour conclure"
      : `« ${WORD[after.stance]} » (${D2} sur ${T2}), ${RANK[after.stance] > RANK[before.stance] ? 'une étiquette plus nette' : 'une étiquette moins nette'}`
  const head = gone.length
    ? `${gone.length} des ${T} personnes qui donnent un avis ${gone.length > 1 ? 'ne sont comptées' : "n'est comptée"} ici que par une idée rangée d'abord dans un autre thème : ${list(parts)}${changed.length ? ` ; ${movedText(true)}` : ''}. Sans ces idées, il resterait`
    : `Sans les idées rangées d'abord dans un autre thème, ${movedText(false)}. Il resterait alors`
  const judge =
    copies.length > 1 ? `À\u00a0vous de juger si ces ${copies.length} verbatims parlent bien ${motifName(g.title)}.` : `À\u00a0vous de juger si ce verbatim parle bien ${motifName(g.title)}.`
  const text = nbsp(`${head} ${T2} avis : ${verdict}. ${judge}`)
  return { text, ideaIds: copies.map((i) => i.id) }
}

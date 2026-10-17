/**
 * Observatoire : tire un échantillon reproductible d'une question ouverte
 * d'une consultation publique, prêt pour le pont d'analyse.
 *
 * Le fichier brut n'est jamais modifié ni versionné : il
 * reste hors du dépôt pour pouvoir rejouer l'analyse
 * quand la méthode progresse.
 *
 * Usage :
 *   npx tsx scripts/observatoire/echantillon.ts <brut.csv> <sortie.csv>
 *     --colonne 32 [--segment 10] [--exclure 6] [--n auto] [--marge 5] [--graine 1]
 *     [--min 15] [--question "libellé court"]
 *
 * --n auto (par défaut) : taille d'échantillon calculée pour une proportion à
 *   95 % de confiance et ± --marge points (5 par défaut), avec correction pour
 *   population finie. Si toute la population tient dans cette taille, on prend tout.
 *
 * --segment : colonne de code postal, réduite à la région (un département
 *   compterait trop peu de personnes pour être comparé).
 * --exclure : colonne booléenne (« true » = contribution supprimée).
 *
 * Règles validées par le `methodologue` (docs/OBSERVATOIRE.md) : seuil court
 * (n'écarter que le vide, sinon on écarte surtout les satisfactions brèves),
 * réponses longues gardées entières (le comptage par personne neutralise le
 * bavard), textes copiés-collés retirés avant le tirage, tout ce qui est
 * écarté est compté et publié.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import Papa from 'papaparse'

const [input, output, ...rest] = process.argv.slice(2)
if (!input || !output) {
  console.error('Usage : npx tsx scripts/observatoire/echantillon.ts <brut.csv> <sortie.csv> --colonne N [...]')
  process.exit(1)
}
const opt = (name: string) => {
  const i = rest.indexOf(`--${name}`)
  return i >= 0 ? rest[i + 1] : undefined
}
const col = Number(opt('colonne'))
const segment = opt('segment') !== undefined ? Number(opt('segment')) : undefined
const exclude = opt('exclure') !== undefined ? Number(opt('exclure')) : undefined
const margin = Number(opt('marge') ?? 5) / 100
const seed = Number(opt('graine') ?? 1)
const min = Number(opt('min') ?? 15)

const REGIONS: Record<string, string[]> = {
  'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
  Bretagne: ['22', '29', '35', '56'],
  'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
  Corse: ['20'],
  'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'Hauts-de-France': ['02', '59', '60', '62', '80'],
  'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
  Normandie: ['14', '27', '50', '61', '76'],
  'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  Occitanie: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'Pays de la Loire': ['44', '49', '53', '72', '85'],
  "Provence-Alpes-Côte d'Azur": ['04', '05', '06', '13', '83', '84'],
}
function regionOf(zip: string): string {
  if (!/^\d{5}$/.test(zip)) return 'Non précisé'
  if (zip.startsWith('97') || zip.startsWith('98')) return 'Outre-mer'
  const d = zip.slice(0, 2)
  return Object.entries(REGIONS).find(([, ds]) => ds.includes(d))?.[0] ?? 'Non précisé'
}
/** Deux textes identiques à la casse, aux espaces et à la ponctuation près sont un copier-coller. */
const fingerprint = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim()

/** Générateur pseudo-aléatoire à graine (mulberry32) : même graine, même échantillon. */
function rng(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rows = Papa.parse<string[]>(readFileSync(input, 'utf8'), { skipEmptyLines: true }).data
const header = rows[0]
let removed = 0
let tooShort = 0
let duplicates = 0
const seen = new Map<string, number>()
const pool: { text: string; region: string }[] = []
for (const r of rows.slice(1)) {
  if (exclude !== undefined && r[exclude]?.toLowerCase() === 'true') {
    removed++
    continue
  }
  const text = (r[col] ?? '').trim()
  if (text.length < min) {
    tooShort++
    continue
  }
  const f = fingerprint(text)
  if (seen.has(f)) {
    duplicates++
    seen.set(f, seen.get(f)! + 1)
    continue
  }
  seen.set(f, 1)
  pool.push({ text, region: segment !== undefined ? regionOf((r[segment] ?? '').trim()) : 'Non précisé' })
}

/** n = n0 / (1 + (n0 − 1) / N), avec n0 = z² · p(1 − p) / e², z = 1,96 et p = 0,5 (cas le plus prudent). */
export function sampleSize(population: number, e: number): number {
  const n0 = (1.96 ** 2 * 0.25) / e ** 2
  return Math.min(population, Math.ceil(n0 / (1 + (n0 - 1) / population)))
}
const n = opt('n') && opt('n') !== 'auto' ? Number(opt('n')) : sampleSize(pool.length, margin)

// Mélange de Fisher-Yates à graine fixe, puis les n premiers.
const rand = rng(seed)
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1))
  ;[pool[i], pool[j]] = [pool[j], pool[i]]
}
const sample = pool.slice(0, n)

const question = opt('question') ?? header[col].replace(/^[A-Za-z0-9=]+ - /, '')
// Pas de colonne d'identité : l'application numérote elle-même les participants (P1, P2…).
const out = Papa.unparse({ fields: ['Région', question], data: sample.map((s) => [s.region, s.text]) })
writeFileSync(output, out)

const campaigns = [...seen.values()].filter((c) => c >= 5).length
const stats = { lignes: rows.length - 1, supprimees: removed, videsOuTropCourtes: tooShort, doublons: duplicates, textesCopiesAuMoins5Fois: campaigns, eligibles: pool.length, echantillon: sample.length, graine: seed, min, margeAnnoncee: n >= pool.length ? 0 : Math.round(1000 * 1.96 * Math.sqrt((0.25 / n) * ((pool.length - n) / (pool.length - 1)))) / 10 }
writeFileSync(output.replace(/\.csv$/, '.tirage.json'), JSON.stringify(stats, null, 2))
console.log(stats)

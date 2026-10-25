import { activeParticipants, promptsOf, type SourceKind } from '@/core/corpus'
import { LIMITS_HELP } from '@/core/analysis/glossary'
import { showsDoubts } from '@/core/analysis/highlights'
import { engineName } from '@/core/analysis/report'
import type { AnalysisState } from '@/core/analysis/types'
import { corpusForAnalysis, type Project } from '@/core/project'
import { Chevron, Disclosure } from '../primitives'

/**
 * « Avant de lire » : ce qu'un lecteur doit savoir avant le rapport, en quatre parties titrées (la question, la collecte,
 * les participants, les limites ; Arnaud, 20/10). Le même volet pour une étude de l'Observatoire (sa fiche) et pour
 * une synthèse (ses données) : les deux rapports ont la même forme (Arnaud, 25/10).
 */
export interface BeforeReadingData {
  /** La question posée, ou ce que la synthèse cherche à comprendre. */
  question?: string
  questionContext?: string
  /** Les questions du questionnaire ; `questionIndex` : celle qu'analyse le rapport (sinon, toutes sont analysées). */
  questions?: string[]
  questionIndex?: number
  /** Comment les données ont été recueillies, paragraphe par paragraphe. */
  collection: string[]
  source?: { name: string; url: string; period: string; license: string }
  /** Les participants (ou l'échantillon), paragraphe par paragraphe. */
  sample: string[]
  sampleTitle?: string
  warnings: string[]
}

export function BeforeReading({ data }: { data: BeforeReadingData }) {
  const q = data.questions ?? []
  return (
    // À la largeur du texte qu'il ouvre : plus de grand vide à droite sur ordinateur (Arnaud, 19/10).
    <Disclosure flat className="max-w-lecture" summary={<span className="text-base font-semibold">Avant de lire : la question, les données, les limites</span>}>
      <div className="space-y-5 text-base">
        {(data.question || q.length > 0) && (
          <section className="space-y-2">
            <h3 className="font-semibold">{data.question ? 'La question posée' : q.length > 1 ? 'Les questions analysées' : 'La question analysée'}</h3>
            {data.question && <blockquote className="border-l-[3px] border-primary pl-3 italic">{data.question}</blockquote>}
            {data.questionContext && <p className="text-sm text-muted-foreground">{data.questionContext}</p>}
            {q.length > 0 &&
              (data.question ? (
                <details className="group/q text-sm">
                  <summary className="flex cursor-pointer list-none items-center gap-1 py-1 text-muted-foreground [&::-webkit-details-marker]:hidden">
                    {data.questionIndex !== undefined ? `Voir les ${q.length} questions du questionnaire` : `Voir ${q.length > 1 ? `les ${q.length} questions analysées` : 'la question analysée'}`}
                    <Chevron className="group-open/q:rotate-180" />
                  </summary>
                  <QuestionList questions={q} index={data.questionIndex} />
                </details>
              ) : (
                <QuestionList questions={q} index={data.questionIndex} />
              ))}
          </section>
        )}
        <section className="space-y-2">
          <h3 className="font-semibold">Comment les données ont été recueillies</h3>
          {data.collection.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {data.source && (
            <p>
              Source :{' '}
              <a className="text-primary underline" href={data.source.url}>
                {data.source.name}
              </a>
              , {data.source.period}. {data.source.license}.
            </p>
          )}
        </section>
        <section className="space-y-2">
          <h3 className="font-semibold">{data.sampleTitle ?? 'Notre échantillon'}</h3>
          {data.sample.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
        <section className="space-y-2">
          <h3 className="font-semibold">Les limites</h3>
          <ul className="list-disc space-y-2 pl-5">
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      </div>
    </Disclosure>
  )
}

function QuestionList({ questions, index }: { questions: string[]; index?: number }) {
  return (
    <ol className="mt-1 list-decimal space-y-1 pl-8 text-sm">
      {questions.map((q, i) => (
        <li key={i} className={index === undefined ? 'text-foreground' : i === index ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
          {q}
          {i === index && <span className="font-normal"> (celle qu'analyse ce rapport)</span>}
        </li>
      ))}
    </ol>
  )
}

const KIND: Record<SourceKind, string> = { survey: 'Questionnaire', transcript: 'Entretien', notes: 'Notes' }

/** Le volet d'une synthèse, tiré de ses propres données : mêmes parties que la fiche d'une étude de l'Observatoire. */
export function synthesisBeforeReading(project: Project, analysis: AnalysisState): BeforeReadingData {
  const corpus = corpusForAnalysis(project)
  const prompts = promptsOf(corpus)
  const people = activeParticipants(corpus).length
  const speakers = new Set(analysis.ideas.map((i) => i.participantId)).size
  const silent = people - speakers
  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k > 1 ? many : one}`
  // Une phrase par source : « Questionnaire « exemple-mediatheque.csv » : 12 participants. »
  const sources = corpus.sources.map((s) => {
    const who = new Set(corpus.contributions.filter((c) => c.sourceId === s.id).map((c) => c.participantId)).size
    return `${KIND[s.kind]} « ${s.name} » : ${n(who, 'participant')}.`
  })
  return {
    question: analysis.settings.researchQuestion.trim() || (prompts.length === 1 ? prompts[0] : undefined),
    questions: analysis.settings.researchQuestion.trim() || prompts.length > 1 ? prompts : undefined,
    collection: sources,
    sampleTitle: 'Les participants',
    sample: [
      `${n(people, 'participant')}, ${n(corpus.contributions.length, 'réponse')}.${silent > 0 ? ` ${n(silent, 'participant')} ne ${silent > 1 ? 'donnent' : 'donne'} aucune idée sur la question : le rapport porte sur les ${speakers} autres.` : ''}`,
    ],
    warnings: [
      "Les réponses sont spontanées : se taire n'est ni approuver ni désapprouver. « 4 sur 5 » compte seulement ceux qui donnent un avis.",
      `Méthode : l'analyse a été faite avec ${engineName(analysis.engine.presetId, analysis.engine.model)}, selon la méthode décrite en fin de rapport. Le moteur d'IA découpe, regroupe et rédige ; le code vérifie chaque citation et calcule tous les chiffres.`,
      `${LIMITS_HELP.what} ${LIMITS_HELP.why}`,
      ...(showsDoubts(analysis.settings) ? ["Quand une étiquette dépend d'avis comptés dans deux thèmes, elle porte la mention « à vérifier » : relisez ses citations avant de la citer."] : []),
    ],
  }
}

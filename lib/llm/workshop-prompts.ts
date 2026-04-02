/**
 * Workshop extraction prompt — adapted from CSV extraction.
 * Batches multiple participant responses for a single workshop question.
 */
export function buildWorkshopExtractionPrompt(
  question: string,
  responses: { id: string; participant_name: string; text: string }[]
): string {
  const responsesBlock = responses
    .map(
      (r) =>
        `Participant : "${r.participant_name}" (ID: "${r.id}")\nRéponse : "${r.text}"`
    )
    .join('\n\n');

  return `Tu es un expert en analyse qualitative UX et en recherche utilisateur. Tu reçois les réponses de plusieurs participants à UNE question posée lors d'un atelier collaboratif.

Ta mission : Extraire CHAQUE idée atomique (substance atomique) de chaque réponse et la documenter sous forme de "quintuplet".

QUESTION POSÉE :
"${question}"

RÉPONSES DES PARTICIPANTS :
${responsesBlock}

RÈGLES D'EXTRACTION :
1. Une réponse peut contenir PLUSIEURS idées distinctes. Chaque idée = un quintuplet séparé.
2. Si une phrase contient un aspect positif ET un aspect négatif (ex: "L'interface est belle mais trop lente"), tu DOIS créer DEUX quintuplets distincts.
3. Le "tag" est l'idée essentielle en 2-5 mots (ex: "Design interface", "Performance", "Communication interne").
4. Le "verbatim" est un fragment contextualisé de la réponse — ni un mot isolé, ni la phrase complète, mais un extrait porteur de sens. Cite FIDÈLEMENT le texte source.
5. Le "sentiment" est déterminé par le contenu du verbatim : "positive" = satisfaction/force/réussite, "negative" = problème/frustration/manque, "suggestion" = idée/proposition pour le futur.
6. N'omets AUCUNE idée. Sois exhaustif. Chaque réponse doit produire au minimum 1 quintuplet.

Réponds UNIQUEMENT en JSON valide (sans balises markdown) :
[
  {
    "tag": "Concept clé en 2-5 mots",
    "verbatim": "Fragment contextualisé extrait fidèlement de la réponse",
    "sentiment": "positive|negative|suggestion",
    "participant_id": "ID exact du participant tel que fourni",
    "participant_name": "Nom exact du participant"
  }
]`;
}

/**
 * Reuse CSV clustering prompt — identical logic works for workshop quintuplets.
 * Re-exported from csv-prompts to avoid importing CSV prompts directly in workshop code.
 */
export { buildClusteringPrompt, buildSynthesisPrompt } from './csv-prompts';

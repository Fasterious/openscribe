import type { ClusteringInput } from './types';

export function buildClusteringPrompt(input: ClusteringInput): string {
  const responsesBlock = input.responses
    .map(
      (r) =>
        `Participant: ${r.participant_name} (ID: ${r.id})\nRéponse: ${r.text}`
    )
    .join('\n\n');

  return `Tu es un expert en analyse qualitative UX. Tu reçois des réponses de participants à une question posée lors d'un atelier collaboratif.

Ta tâche :
1. Lire chaque réponse et identifier les idées distinctes qu'elle contient (une réponse peut contenir plusieurs idées).
2. Regrouper les idées similaires en clusters thématiques.
3. Pour chaque cluster, fournir un label court, un résumé, le nombre de participants concernés, et les extraits pertinents avec attribution.

Question posée : "${input.question}"

Réponses des participants :
${responsesBlock}

Réponds UNIQUEMENT en JSON valide (sans balises markdown) avec cette structure exacte :
{
  "clusters": [
    {
      "label": "Label court (2-5 mots)",
      "summary": "Résumé synthétique de ce que les participants expriment sur ce thème",
      "participant_count": 3,
      "excerpts": [
        {
          "participant_name": "Prénom",
          "response_id": "uuid du participant",
          "excerpt": "extrait fidèle de la réponse"
        }
      ]
    }
  ],
  "global_summary": "Synthèse globale en 2-3 phrases capturant les tendances principales",
  "total_responses": 10,
  "total_participants": 10
}

Règles :
- Les clusters doivent être thématiquement distincts.
- Un même participant peut apparaître dans plusieurs clusters s'il a exprimé plusieurs idées.
- Les extraits doivent être des citations fidèles ou des paraphrases très proches du texte original.
- Ordonne les clusters du plus mentionné au moins mentionné.
- Le champ participant_count compte les participants uniques, pas les extraits.
- Utilise les IDs exacts des participants fournis dans le champ response_id.`;
}

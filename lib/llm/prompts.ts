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
1. Lire chaque réponse en entier et identifier TOUTES les idées distinctes qu'elle contient (une réponse peut contenir plusieurs idées, y compris à la fin du texte).
2. Regrouper les idées similaires en clusters thématiques.
3. Pour chaque cluster, fournir un label court, un résumé, le nombre de participants uniques, et les extraits pertinents avec attribution.

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
          "participant_name": "Prénom exact tel qu'indiqué",
          "response_id": "UUID exact de la réponse (voir ci-dessus)",
          "excerpt": "extrait fidèle, citation du texte original"
        }
      ]
    }
  ],
  "global_summary": "Synthèse globale en 2-3 phrases capturant les tendances principales",
  "total_responses": 10,
  "total_participants": 10
}

Règles OBLIGATOIRES :
- response_id : utilise OBLIGATOIREMENT l'UUID exact fourni entre parenthèses après le nom (format "Participant: Nom (ID: xxx)"). Ne jamais inventer d'ID, ne jamais utiliser le nom à la place.
- Un même participant DOIT apparaître dans PLUSIEURS clusters si sa réponse contient plusieurs idées thématiques distinctes. Chaque idée va dans le cluster correspondant, avec son propre extrait.
- Extrais TOUS les verbatims pertinents, y compris ceux en fin de réponse. Ne néglige aucune partie du texte.
- Les extraits doivent être des citations fidèles du texte original (pas de paraphrase libre).
- Ordonne les clusters du plus mentionné au moins mentionné.
- participant_count = nombre de participants UNIQUES dans ce cluster (compter les noms distincts, pas le nombre d'excerpts).`;
}

export function buildStructureTextPrompt(rawText: string): string {
  return `Tu reçois du texte brut (notes, post-its, transcription d'atelier, liste de retours, etc.).

Ta tâche : extraire une liste de réponses distinctes au format JSON strict.

Règles :
- Si un nom ou identifiant est explicite (ex: "Marie : ...", "Alice dit : ...", "Jean - ..."), utilise-le comme participant_name.
- Si aucun nom n'est identifiable pour une réponse, utilise "Speaker 1", "Speaker 2", "Speaker 3", etc. dans l'ordre d'apparition.
- Chaque entrée doit être une réponse distincte. Découpe le texte en réponses individuelles.
- Ne fusionne pas des réponses différentes. Chaque idée/retour distinct = une entrée.
- Retourne UNIQUEMENT le JSON, sans texte avant ou après, sans balises markdown.

Format attendu :
[
  { "participant_name": "...", "response_text": "..." },
  { "participant_name": "...", "response_text": "..." }
]

Texte à structurer :

${rawText}`;
}

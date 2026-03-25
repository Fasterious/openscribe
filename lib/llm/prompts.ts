import type { ClusteringInput } from './types';

export function buildClusteringPrompt(input: ClusteringInput): string {
  const responsesBlock = input.responses
    .map(
      (r) =>
        `Participant: ${r.participant_name} (ID: ${r.id})\nRéponse: ${r.text}`
    )
    .join('\n\n');

  return `Tu es un expert Sénior en analyse qualitative UX et en recherche utilisateur. Tu reçois des réponses de participants à une question posée lors d'un atelier collaboratif.

Ta mission : Extraire la substantifique moelle de ces retours avec une exhaustivité totale et une structuration parfaite.

MÉTHODOLOGIE À SUIVRE (Mentalement) :
1. Déconstruire : Lis chaque réponse et découpe-la en idées atomiques (une longue réponse contient souvent 3 ou 4 idées distinctes).
2. Classifier : Regroupe ces idées en clusters thématiques précis et mutuellement exclusifs.
3. Polariser : Pour chaque idée, détermine si elle relève du "Pro" (satisfaction, force, réussite) ou du "Con" (problème, frustration, manque, besoin, suggestion d'amélioration).
4. Synthétiser : Rédige des résumés clairs et percutants pour chaque cluster.

Question posée : "${input.question}"

Réponses des participants :
${responsesBlock}

Réponds UNIQUEMENT en JSON valide (sans balises markdown comme \`\`\`json, sans aucun texte avant ou après) en respectant RIGOUREUSEMENT cette structure exacte :

{
  "clusters": [
    {
      "label": "Label court et explicite (2-5 mots)",
      "summary": "Pros (2) : [Synthèse fluide des forces et réussites]. Cons (1) : [Synthèse fluide des problèmes, frustrations et pistes d'amélioration].",
      "participant_count": 3,
      "excerpts_pros": [
        {
          "participant_name": "Prénom exact tel qu'indiqué",
          "response_id": "UUID exact de la réponse",
          "excerpt": "Citation exacte et fidèle du texte (verbatim positif)"
        }
      ],
      "excerpts_cons": [
        {
          "participant_name": "Prénom exact tel qu'indiqué",
          "response_id": "UUID exact de la réponse",
          "excerpt": "Citation exacte et fidèle du texte (verbatim négatif ou suggestion d'amélioration)"
        }
      ]
    }
  ],
  "global_summary": "Synthèse globale de haut niveau en 2 à 3 phrases capturant les dynamiques et tendances principales de l'ensemble des réponses.",
  "total_responses": 10,
  "total_participants": 10
}

RÈGLES ABSOLUES ET OBLIGATOIRES (Le non-respect entraînera une erreur système) :

1. EXHAUSTIVITÉ DES VERBATIMS :
- Tu ne dois omettre AUCUNE idée. Extrais TOUS les verbatims pertinents, du premier au dernier mot de chaque réponse.
- Un même participant DOIT apparaître dans PLUSIEURS clusters si sa réponse aborde différents thèmes.
- Si une phrase contient deux idées (ex: une force et une faiblesse), coupe-la en deux extraits distincts et place-les dans les bonnes listes. Un extrait = un seul ton.

2. MATHÉMATIQUES ET COMPTEURS :
- Dans le champ "summary", la valeur N de "Pros (N) :" DOIT ÊTRE EXACTEMENT ÉGALE au nombre d'éléments dans le tableau excerpts_pros (length).
- La valeur M de "Cons (M) :" DOIT ÊTRE EXACTEMENT ÉGALE au nombre d'éléments dans le tableau excerpts_cons (length).
- participant_count DOIT ÊTRE EXACTEMENT ÉGAL au nombre de response_id UNIQUES trouvés en fusionnant excerpts_pros et excerpts_cons.

3. GESTION DES VIDES :
- S'il n'y a aucun extrait positif : excerpts_pros = [], et écris exactement "Pros (0) : Non applicable." dans le summary.
- S'il n'y a aucun extrait négatif/amélioration : excerpts_cons = [], et écris exactement "Cons (0) : Non applicable." dans le summary.

4. FIDÉLITÉ DES DONNÉES :
- response_id : Utilise UNIQUEMENT l'UUID fourni entre parenthèses après le nom (format "Participant: Nom (ID: xxx)"). N'invente jamais d'ID.
- Les extraits (excerpt) doivent être des CITATIONS EXACTES (copier-coller) du texte source. Aucune paraphrase, aucun résumé dans ce champ.

5. ORDRE :
- Ordonne le tableau "clusters" du cluster le plus mentionné (plus grand participant_count) au moins mentionné.`;
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

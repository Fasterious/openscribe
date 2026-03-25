import type { ParsedCsvData, Quintuplet, AnalysisCluster } from '@/types/csv-analysis';

/**
 * ÉTAPE 2 — Extraction atomique + Quintuplets
 * Un prompt par participant (toutes ses réponses à toutes les questions).
 */
export function buildExtractionPrompt(
  participant: ParsedCsvData['participants'][0],
  questions: string[]
): string {
  const responsesBlock = questions
    .map((q) => {
      const answer = participant.responses[q];
      if (!answer || answer.trim().length === 0) return null;
      return `Question : "${q}"\nRéponse : "${answer}"`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `Tu es un expert en analyse qualitative. Tu reçois les réponses d'UN participant à un questionnaire (Google Form).

Ta mission : Extraire CHAQUE idée atomique (substance atomique) de chaque réponse et la documenter sous forme de "quintuplet".

PARTICIPANT :
- ID : "${participant.id}"
- Nom : "${participant.name || 'Anonyme'}"

RÉPONSES :
${responsesBlock}

RÈGLES D'EXTRACTION :
1. Une réponse peut contenir PLUSIEURS idées distinctes. Chaque idée = un quintuplet séparé.
2. Si une phrase contient un aspect positif ET un aspect négatif (ex: "L'interface est belle mais trop lente"), tu DOIS créer DEUX quintuplets distincts.
3. Le "tag" est l'idée essentielle en 2-5 mots (ex: "Design interface", "Performance", "Communication interne").
4. Le "verbatim" est un fragment contextualisé de la réponse — ni un mot isolé, ni la phrase complète, mais un extrait porteur de sens.
5. Le "sentiment" est déterminé par le contenu du verbatim, PAS par la question. Un participant peut exprimer quelque chose de négatif même dans une question orientée positivement.
6. Pour le sentiment : "positive" = satisfaction/force/réussite, "negative" = problème/frustration/manque, "suggestion" = idée/proposition pour le futur.
7. N'omets AUCUNE idée. Sois exhaustif.

Réponds UNIQUEMENT en JSON valide (sans balises markdown) :
[
  {
    "tag": "Concept clé en 2-5 mots",
    "verbatim": "Fragment contextualisé extrait de la réponse",
    "sentiment": "positive|negative|suggestion",
    "question": "La question exacte d'origine"
  }
]`;
}

/**
 * ÉTAPE 3 — Normalisation et Clustering
 * Un seul appel avec tous les tags extraits.
 */
export function buildClusteringPrompt(quintuplets: Quintuplet[]): string {
  const tagsWithContext = quintuplets.map((q) => ({
    tag: q.tag,
    sentiment: q.sentiment,
    participant_id: q.participant_id,
    question: q.question,
  }));

  const tagsSummary = tagsWithContext
    .map(
      (t) =>
        `- Tag: "${t.tag}" | Sentiment: ${t.sentiment} | Participant: ${t.participant_id} | Question: "${t.question}"`
    )
    .join('\n');

  return `Tu es un expert en analyse qualitative. Tu reçois une liste de tags extraits de réponses à un questionnaire.

Ta mission : Regrouper ces tags en clusters thématiques cohérents, en normalisant les noms de tags similaires.

LISTE DES TAGS EXTRAITS (${quintuplets.length} tags au total) :
${tagsSummary}

RÈGLES DE CLUSTERING :
1. Regroupe les tags sémantiquement proches sous un "tag normalisé" commun (ex: "ergonomie", "facilité d'usage", "navigation" → tag normalisé "Expérience Utilisateur").
2. Chaque tag normalisé doit rassembler des tags SIMILAIRES en substance, pas juste en mots-clés.
3. Regroupe ensuite les tags normalisés en grands "clusters" thématiques (2-6 mots pour le titre).
4. Un cluster contient entre 1 et 10 tags normalisés maximum.
5. Vise entre 5 et 12 clusters au total pour garder une granularité utile.
6. CHAQUE tag extrait DOIT apparaître dans exactement UN tag normalisé d'exactement UN cluster. Aucun tag ne doit être perdu.

Réponds UNIQUEMENT en JSON valide (sans balises markdown) :
{
  "clusters": [
    {
      "title": "Titre du grand thème (2-6 mots)",
      "normalized_tags": [
        {
          "label": "Tag normalisé",
          "original_tags": ["tag brut 1", "tag brut 2"],
          "quintuplet_indices": [0, 3, 7]
        }
      ]
    }
  ]
}

Le champ "quintuplet_indices" contient les indices (0-based) des tags dans la liste ci-dessus qui appartiennent à ce tag normalisé. Cela permet de reconstituer la traçabilité complète.`;
}

/**
 * ÉTAPE 5 — Synthèse pour UN cluster
 * Un appel par cluster, avec ses quintuplets complets.
 */
export function buildSynthesisPrompt(cluster: AnalysisCluster): string {
  const tagsBlock = cluster.normalized_tags
    .map((tag) => {
      const lines = tag.quintuplets
        .map(
          (q) =>
            `  - [${q.sentiment === 'positive' ? '✅' : q.sentiment === 'negative' ? '⚠️' : '💡'}] Verbatim: "${q.verbatim}" — Question: "${q.question}" — Participant: ${q.participant_id}${q.participant_name ? ` (${q.participant_name})` : ''}`
        )
        .join('\n');

      return `TAG NORMALISÉ : "${tag.label}"
Nombre de verbatims : ${tag.quintuplets.length}
Participants uniques : ${tag.unique_participants.join(', ')}
Verbatims :
${lines}`;
    })
    .join('\n\n---\n\n');

  return `Tu es un expert en analyse qualitative. Tu rédiges des synthèses fidèles et percutantes.

CLUSTER : "${cluster.title}"

DONNÉES COMPLÈTES :
${tagsBlock}

Ta mission en DEUX parties :

PARTIE 1 — Pour CHAQUE tag normalisé ci-dessus, rédige un "micro-résumé" (2-4 phrases) qui :
- S'appuie EXCLUSIVEMENT sur les verbatims fournis
- Mentionne le nombre de retours positifs/négatifs/suggestions
- Précise le nombre de participants uniques concernés
- Reste fidèle au terrain sans interpréter au-delà des données

PARTIE 2 — Rédige un "résumé global" du cluster entier (3-5 phrases) qui :
- Synthétise les micro-résumés
- Donne les compteurs globaux (X verbatims positifs / Y participants, Z verbatims négatifs / W participants)
- Met en lumière les dynamiques principales et les tensions éventuelles

Réponds UNIQUEMENT en JSON valide (sans balises markdown) :
{
  "tag_summaries": {
    "Tag normalisé exact": "Micro-résumé du tag...",
    "Autre tag normalisé": "Micro-résumé..."
  },
  "cluster_summary": "Résumé global du cluster entier..."
}`;
}

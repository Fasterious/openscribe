// "En clair" glossary — plain-language definitions surfaced inline in the UI.
//
// A3 (transparency): every technical term displayed in the product carries an
// "En clair" tooltip, so the pedagogy lives in the product, not only in the doc.

export interface GlossaryEntry {
  term: string;
  plain: string;
  example?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  surprise: {
    term: 'Surprise',
    plain:
      "À quel point un groupe dépasse ce que le pur hasard produirait. On compare le nombre de personnes réellement observées (o) à l'effectif attendu (e). Beaucoup plus que prévu = comportement segmentant = vrai persona.",
    example: '8 attendus, 25 observés → très surprenant.',
  },
  lift: {
    term: 'Lift',
    plain:
      "Combien de fois l'observé dépasse le hasard : lift = observé / attendu. Un lift de 3 veut dire « 3× plus de monde que si les réponses étaient indépendantes ».",
    example: '25 trouvés / 8 attendus ≈ ×3.',
  },
  tailProb: {
    term: 'Probabilité de hasard',
    plain:
      "La chance d'observer au moins ce groupe par pur hasard (loi binomiale). Quasi nulle = le groupe ne peut pas être un accident, c'est un vrai signal.",
    example: 'p ≈ 0,0001 ⇒ pratiquement impossible par hasard.',
  },
  subspace: {
    term: 'Sous-espace',
    plain:
      "Les quelques questions sur lesquelles un groupe se définit (pas toutes). Deux personnes peuvent diverger partout ailleurs : ce qui compte, c'est leur accord sur CES questions-là.",
    example: '4 questions sur 11 = le sous-espace du persona.',
  },
  coreTarget: {
    term: 'Cœur de cible',
    plain:
      "Le profil global majoritaire, décrit AVANT de chercher des sous-groupes. Sur quelles questions une large majorité converge, et dans quel sens. Il existe même quand tout le monde se ressemble.",
    example: '80 % des répondants veulent X.',
  },
  noiseClass: {
    term: 'Classe U (non assignés)',
    plain:
      "Le « bac » des répondants qui ne collent à aucun persona (réponses au hasard, profils rares, trolls). Les exclure rend les personas plus nets. U est une information, pas un échec.",
    example: '2 répondants qui cassaient un motif → mis de côté.',
  },
  ipsatisation: {
    term: 'Ipsatisation',
    plain:
      "Retrancher à chaque répondant sa propre moyenne, pour neutraliser ceux qui notent « toujours haut » ou « toujours bas ». On garde la FORME de leurs préférences, pas leur niveau. Désactivée par défaut (elle peut fabriquer de fausses corrélations).",
    example: '(5,4) et (3,2) ont la même structure après centrage.',
  },
  cohesion: {
    term: 'Cohésion (subspace)',
    plain:
      "À quel point les membres d'un persona sont serrés SUR LEUR PROPRE sous-espace (pas sur toutes les questions). C'est la silhouette corrigée : elle ne pénalise plus un groupe qui diverge sur les questions non pertinentes.",
    example: '0,8 = membres très cohérents sur leurs questions clés.',
  },
  stability: {
    term: 'Stabilité',
    plain:
      "Un vrai persona réapparaît si on relance le calcul sur un échantillon légèrement différent (on retire quelques répondants au hasard). S'il se désagrège, c'était sans doute un artefact.",
    example: '0,9 = réapparaît dans 9 relances sur 10.',
  },
  ari: {
    term: 'ARI',
    plain:
      "Adjusted Rand Index : la note de comparaison entre les groupes trouvés et un corrigé connu. 1 = parfait, 0 = hasard, négatif = pire que le hasard. C'est le « chronomètre » de l'algorithme.",
    example: '0,82 = très proche de la vérité terrain.',
  },
  purity: {
    term: 'Pureté',
    plain:
      "Quelle proportion des répondants se retrouve dans le « bon » groupe quand on connaît la vérité. Plus c'est haut, plus les groupes trouvés sont nets.",
    example: '0,9 = 90 % bien classés.',
  },
  nmi: {
    term: 'NMI',
    plain:
      "Normalized Mutual Information : autre mesure (0..1) du recouvrement entre groupes trouvés et corrigé, basée sur l'information partagée. Complémentaire de l'ARI.",
  },
  lambda: {
    term: 'Curseur λ (couverture ↔ spécificité)',
    plain:
      "Le réglage du compromis. À gauche : peu de gros groupes grossiers qui couvrent beaucoup de monde. À droite : beaucoup de petits groupes très nets et spécifiques. Il n'y a pas de « bonne » valeur unique, à toi de trancher.",
    example: 'λ bas = fin/pur ; λ haut = large/couvrant.',
  },
  support: {
    term: 'Support',
    plain:
      "La taille brute d'un groupe (combien de répondants). Attention : le support seul est trompeur, car un petit groupe « identique » peut apparaître par hasard. C'est pourquoi on préfère la surprise.",
    example: '20 personnes satisfont le motif.',
  },
  pareto: {
    term: 'Front de Pareto',
    plain:
      "Quand deux objectifs s'opposent (groupes précis vs groupes qui couvrent beaucoup), il n'y a pas une seule meilleure solution mais une famille de bons compromis. On en présente quelques-uns (fin / moyen / large).",
  },
  specificity: {
    term: 'Spécificité',
    plain:
      "Le nombre de questions discriminantes d'un persona. Plus il y en a, plus la fiche est riche. Enlever une variable pour gagner des membres, c'est renoncer à un moyen de décrire la réalité.",
    example: '9 questions communes = très spécifique.',
  },
  coverage: {
    term: 'Couverture',
    plain:
      "La fraction de répondants assignés à un persona (le reste va dans la classe U). Une couverture de 100 % n'est pas un but : forcer tout le monde dans un groupe injecte du bruit.",
    example: '90 % classés, 10 % en U.',
  },
  surpriseExpectation: {
    term: 'Effectif attendu (e = n·∏ pₖ)',
    plain:
      "Combien de personnes DEVRAIENT satisfaire un motif par pur hasard : total × popularité de la 1ʳᵉ condition × popularité de la 2ᵉ × … On compare l'observé à ce nombre.",
    example: '100 × 0,8 × 0,1 = 8 attendus.',
  },
  agreement: {
    term: 'Accord interne',
    plain:
      "Sur une question donnée, la proportion des membres du persona qui répondent dans la même direction. 1 = unanime.",
    example: "0,95 = quasiment tout le groupe répond « haut ».",
  },
};

export function getGlossary(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}

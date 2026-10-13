# Vision et décisions fondatrices

Ce qu'Arnaud a exprimé, et ce qui a été tranché, pendant la conversation de
cadrage des 11 et 12 octobre 2026. À relire avant toute décision de produit,
pour vérifier qu'on va dans la bonne direction ou pour nommer l'écart quand on
s'en éloigne. Le fil complet (privé, hors dépôt) est dans
`fixtures/private/conversation/conversation-dialogue.md`, et le document de
cadrage détaillé dans `fixtures/private/reference/`.

## L'intention

- **Un outil libre de recherche utilisateur, accessible à tous** : chercheurs,
  mais aussi citoyens, journalistes, toute personne qui veut comprendre des
  retours pour « mieux comprendre le monde et trouver des solutions ».
- **Le prix du logiciel s'effondre** : autant que l'outil libre existe et soit
  le meilleur. Le projet ne paie rien pour ses utilisateurs ; Arnaud est « un
  passeur de relais », chacun apporte ses clés et garde ses données.
- **Lever la friction d'entrée** : pas de carte bancaire, pas de dix
  inscriptions. Le premier usage doit marcher sans compte.
- **Une boîte à outils, pas un clone** (12/10) : une recherche, c'est une
  question à laquelle on répond avec plusieurs outils dont les résultats
  convergent vers un rapport. Modules séparés mais reliés par un format commun
  (le corpus) : Synthèse d'abord, puis Entretiens et tests (transcription,
  vidéo, locuteurs), puis Personas, plus tard l'atelier en direct et les tests
  à distance. L'expérience unifiée viendra ensuite.
- **Vocabulaire (13/10)** : tant que les modules sont séparés, chacun nomme ses travaux (« vos synthèses », plus tard « vos personas ») ; « étude » désignera l'ensemble quand les modules se combineront. Navigation : les modules à gauche (Accueil, Synthèse, modules à venir grisés), les moteurs d'IA, communs à tous, à droite.
- **Synthèse + entretiens = 80 % de la valeur** d'un chercheur : réconcilier le
  qualitatif et le quantitatif.
- **Sources multiples dans une même étude** (13/10) : un questionnaire et des
  entretiens analysés ensemble, avec la même méthode ; un entretien est une
  personne aux réponses longues.

## Ce qu'attend un chercheur à la fin

« Une synthèse parfaite qui dit : les utilisateurs, dans leur ensemble, ont
bloqué sur ça. » Concrètement :
- un bon résumé par entretien, puis une synthèse de l'étude entière ;
- pour chaque motif : combien de personnes, positives, négatives, neutres, ce
  qu'elles disent, les citations qui le prouvent (« 10 personnes trouvent le
  système lent, 3 pensent que ça vient de leur navigateur, 2 le trouvent
  rapide ») ;
- **ne jamais perdre le lien** rapport → thème → motif → idée → citation →
  personne : c'est ce qui donne confiance.

## La méthode des idées atomiques (celle d'Arnaud)

1. Personne par personne, l'IA découpe tout ce qui a été dit en idées
   atomiques (un sujet, un ton), avec la citation exacte et la personne.
2. Chaque idée reçoit une catégorie : positif, négatif, suggestion, question
   ou constat (quatre le 11/10 ; la « question » ajoutée le 13/10, car les
   questionnements du groupe ouvrent des pistes au-delà des solutions
   proposées). Suggestion, question et constat ne sont pas des polarités.
3. Les idées sont regroupées en motifs ; chaque motif reçoit un titre, des
   comptages de personnes par ton, une synthèse appuyée sur ses citations.
4. Facultatif : des motifs aux thèmes, même logique un niveau plus haut
   (« le résumé des résumés »).
5. Mode libre par défaut (les thèmes émergent ; une grille imposée biaise les
   sujets complexes comme la citoyenneté), mode grille possible (audit
   ergonomique).
- La normalisation des libellés de la v1 n'est plus une étape obligatoire :
  le titre du motif fait ce travail. À réévaluer si la vérification humaine en
  souffre.
- Le séquençage en étapes est gardé même avec un modèle puissant : points de
  contrôle et traçabilité.

## Exigences de confiance

- **Déterministe** : mêmes données, même configuration → mot pour mot le même
  résultat (température 0, graine fixe, version de modèle datée, cache des
  réponses, analyse figée). Ajouter une donnée ne doit pas tout chambouler.
- **L'IA ne décide jamais** : le code vérifie les citations, range, compte.
- **Les minorités restent visibles** ; on compte des personnes, pas des mentions.
  Une personne = une ligne dans le rapport, même si elle s'exprime plusieurs fois.
- **Restitution brute, le moins de biais possible** (13/10) : verbatims tels
  quels, nuances comprises, prénoms compris ; c'est le chercheur qui anonymise
  ensuite s'il le souhaite. Une contradiction d'une même personne se montre,
  elle ne se juge pas.
- **Comprendre ce que la personne a voulu dire** (13/10) : la question posée, le fil d'un entretien, l'ironie ou un conditionnel peuvent inverser le sens apparent des mots. On y reste attentif sans alourdir le processus ; dans le doute, le sens littéral.
- **La langue fait partie de la qualité** (12/10) : un rapport qui sonne
  traduit n'est pas fini, dans chaque langue. Mais la fidélité aux données
  passe avant.

## Architecture et modèle économique

- **Local d'abord, construit pour être synchronisé** ; plus tard, « ton cloud,
  pas le nôtre » (le Drive de l'utilisateur, chiffré), bascule libre
  local ↔ cloud par élément, mode Confidentiel où rien ne sort (moteurs locaux
  seulement).
- **Moteurs interchangeables**, choisis pour leur qualité et leur facilité ;
  avertir quand une offre gratuite réutilise les données.
- **Transcription** : un fournisseur en ligne asynchrone pour commencer ;
  transcription locale ensuite. La vidéo ne bouge jamais : on n'envoie que
  l'audio et des images clés.
- Site statique gratuit ; mesure d'audience anonyme et désactivable.
- **Modèle économique : non tranché.** Pistes : rien de payant, prestation à la
  demande (l'expertise, pas l'outil), offre hébergée seulement si la demande
  apparaît. À reprendre après la vitrine.

## Idées pour plus tard

- Anonymisation en un geste, à la demande du chercheur (pas de masquage automatique).
- Segments : comparer ce que disent des groupes (rôle, ancienneté) quand les données le permettent, proposés par l'outil quand rien n'est étiqueté, au choix du chercheur.

- Analyse d'écran : relier ce qui est dit à ce que la personne avait sous les
  yeux, illustrer une citation représentative par sa capture.
- Lecture ancrée : clic sur une phrase → instant de la vidéo.
- Synthèse d'étude « où les utilisateurs bloquent », classée par fréquence,
  gravité et nombre de personnes.

## Façon de travailler

- Arnaud est le visionnaire et le testeur final, avec peu de temps ; Claude
  orchestre, prend l'initiative, teste comme un utilisateur avant de livrer
  (deux passes, trois au plus).
- Qualité avant quantité ; raisonnable en jetons.
- Réponses à Arnaud en français.
- Juridique : on s'inspire des besoins, jamais de l'apparence ; aucun produit
  commercial nommé dans le dépôt.

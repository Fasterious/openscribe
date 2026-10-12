# Journal de décisions

Chaque décision structurante, datée, avec sa raison. Le plus récent en haut.

## 2026-10-12 — Qualité de la langue (demande d'Arnaud)

- **La langue fait partie de la qualité, sans jamais passer avant la fidélité.** Un rapport juste mais qui sonne « traduit de l'anglais » n'est pas fini.
- **Trois niveaux** : (1) un guide de style par langue dans les consignes de rédaction ; (2) une étape « Relire la langue » (activée par défaut, désactivable) qui réécrit les synthèses ; (3) des garde-fous dans le code : une réécriture qui change une citation [I…] ou un nombre (en chiffres ou en lettres) est refusée, et tout nombre d'une synthèse qui ne correspond à aucun chiffre calculé ni cité est signalé « À vérifier » dans le rapport.
- **Corriger à la source.** La première relecture a montré que la plupart des défauts venaient de nos propres textes recopiés par le modèle (formulation des chiffres, ponctuation abîmée par le nettoyage des citations). Ils sont corrigés dans le code, pas confiés à la relecture.
- **Nouveau rôle `plume`** (langue et ton de l'interface et des rapports), intégré à la boucle de qualité.
- Langues : français et anglais pour l'instant ; ajouter une langue = ajouter son guide de style.

## 2026-10-12 — Démarrage

- **Branche vierge `next`** dans le dépôt existant, sans historique commun : la session ne peut pas créer de nouveau dépôt.
- **Licence AGPL-3.0 (ou ultérieure).** Libre d'usage, de modification et de redistribution ; mais toute personne qui propose une version modifiée en service en ligne doit publier ses modifications. Cela empêche qu'un tiers referme le projet dans une offre commerciale fermée, tout en laissant possible une offre hébergée officielle. Contributions externes sous DCO (certificat d'origine) pour garder la possibilité d'une double licence.
- **Vite + React** plutôt que Next.js : l'application est statique (aucun serveur), Vite est plus simple et plus rapide pour ce cas.
- **Le module Synthèse d'abord**, avant l'Observation : c'est l'essentiel de la valeur, le moteur existe et a fait ses preuves, et c'est du texte seulement.
- **Regroupement par le modèle sur des libellés courts, validé par le code**, plutôt que par vecteurs (embeddings) : pas de dépendance supplémentaire, reproductible, et les libellés courts tiennent largement dans le contexte des modèles actuels. Au-delà de 350 libellés distincts, regroupement par lots. Les vecteurs restent une option future.
- **Quatre catégories** : positif, négatif, neutre, suggestion. La suggestion n'est pas une polarité.
- **Synthèses par lots de groupes** (au plus ~90 idées par demande) pour limiter le nombre d'appels, crucial avec des offres gratuites à 2 requêtes par minute.
- **Pas de nom de participant envoyé au modèle** : seuls les pseudonymes (P1, P2…) partent, avec le texte.
- **Moteur de simulation** intégré (hors ligne, déterministe) pour tester et découvrir l'outil sans clé ; il peut aussi simuler les défauts d'un vrai modèle.

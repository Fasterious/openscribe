# Journal de décisions

Chaque décision structurante, datée, avec sa raison. Le plus récent en haut.

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

# Journal de décisions

Chaque décision structurante, datée, avec sa raison. Le plus récent en haut.

## 2026-10-12 — Retour d'Arnaud (test pensé à voix haute) : accueil, moteurs, méthode

- **Accueil = page produit, puis reprise du travail.** Sans compte, c'est le navigateur qui « se souvient » : s'il contient des études, un bandeau « Reprendre » passe en premier et le héros se réduit. Une seule page sert le visiteur et l'habitué ; pas de page de présentation séparée.
- **Accroche « Des verbatims au rapport, preuves à l'appui. »** (proposée par `conteur`) plutôt que « de A à Z » : elle dit une valeur vraie aujourd'hui. La boîte à outils montre honnêtement ce qui est disponible et ce qui arrive. La preuve est montrée (un constat de l'exemple dont on déplie les verbatims), pas affirmée.
- **Les modules sont des espaces.** « Synthèse » mène à ses études (`#/synthese`) ; l'exemple y est une carte à part, sans doublon de bouton. « Observation » devient « Entretiens et tests » (un entretien n'est pas une observation), icône vidéo.
- **Moteurs d'IA : le catalogue est visible d'emblée**, rangé par usage (essayer gratuitement, rien ne sort de l'ordinateur, autres), avec un guide pas à pas et des liens directs vers la page des clés. Ollama est détecté automatiquement (ouvert ? modèles installés ?). « Enregistrer et tester » d'un seul geste. Toute page qui quitte une étude offre le retour (`#/moteurs?retour=…`).
- **Méthode : un groupe = un motif.** Cause du regroupement grossier : la cible imposait 2 à 6 groupes pour 37 idées et les thèmes ne venaient qu'au-delà de 8 groupes. Nouvelle cible en racine carrée (le nombre de motifs croît moins vite que les idées), consignes réécrites avec le `methodologue` (ne pas fusionner deux sujets voisins, ne pas séparer un même motif : problème et solution, avis opposés sur un même objet), thèmes dès 5 groupes.
- **Pas de consensus ni de désaccord calculé sur un thème** : il réunit des objets différents, additionner leurs avis inventait de faux « avis partagés ». Un thème affiche ses participants, ses avis et le nombre de motifs dont les avis sont partagés. Le modèle reçoit les participants de chaque groupe pour ne pas compter deux fois une même personne.
- **Vocabulaire de la recherche utilisateur, un concept = un mot** (avec `plume`) : étude, participant, verbatim, idée, motif, thème, segment, occurrences ; moteur d'IA ; sauvegarder (fichier) / télécharger (rapport) / enregistrer (automatique).
- **Verbatims dépliés sur place** dans le rapport, plus de fenêtre qui casse la lecture.

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

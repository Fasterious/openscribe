# Avancement

Mis à jour à chaque étape. Légende : ✅ fait et vérifié · 🔄 en cours · ⏳ à faire.

## Phase 0 — Socle

- ✅ Format commun « corpus » (personnes, contributions, sources)
- ✅ Import de questionnaire CSV avec détection des rôles de colonnes
- ✅ Import de texte (transcription avec locuteurs, notes)
- ✅ Moteurs interchangeables : API compatible OpenAI (Mistral, Groq, Gemini, OpenRouter, Ollama, autre) + simulation
- ✅ Débit, parallélisme et nouvelles tentatives
- ✅ Stockage local et export/import d'étude

## Phase 1 — Module Synthèse

- ✅ Moteur : idées atomiques, vérification des citations, regroupement validé, indicateurs par le code, synthèses citées, thèmes, résumé global
- ✅ Reproductibilité (cache des réponses) et reprise après coupure
- ✅ Interface : import → réglages → analyse visible → rapport, sur ordinateur et mobile
- ✅ Exemple livré avec un rapport réaliste enregistré (questionnaire fictif)
- ✅ Robustesse avec un modèle léger (Haiku) sur ÉcoSol : 307 idées (référence v1 : 304), 0 citation écartée, 1 réécriture refusée à bon droit, 0 fausse alerte
- ✅ Tests de parcours automatiques (Playwright) : 12/12 sur ordinateur et mobile
- ✅ Test utilisateur : passe 1 (persona Camille, 5 défauts gênants), corrections, passe 2 : certifiée après correction du dernier point
- ✅ Test sur corpus réel (ÉcoSol, 20 personnes) avec un modèle joué par un sous-agent : 286 idées, 0 citation écartée, 35 groupes, 8 thèmes
- ✅ Qualité de la langue : guide de style, étape de relecture contrôlée, nombres vérifiés (relecture `plume` : 4/5 avec un modèle puissant, 3,5/5 avec un modèle léger ; dernières consignes ajoutées, à confirmer sur un vrai moteur)

## Itération 5 — Retour d'Arnaud (test pensé à voix haute, 12/10)

- ✅ Accueil raconté (promesse, preuve dépliable, comment ça marche, boîte à outils, données, questions fréquentes, feuille de route) et bandeau « Reprendre » pour qui revient
- ✅ Espace Synthèse : vos études, l'exemple à part, actions en tête ; « Entretiens et tests » remplace « Observation »
- ✅ Moteurs d'IA : catalogue visible, guide pas à pas avec liens directs, détection d'Ollama, test à l'enregistrement, retour à l'étude, moteurs non vérifiés signalés
- ✅ Méthode : un groupe = un motif (cible en racine carrée, consignes revues par le `methodologue`), thèmes sans faux consensus ni faux désaccord, personne comptée deux fois ; exemple regénéré (25 motifs, 9 thèmes)
- ✅ Rapport : verbatims dépliés sur place, avis isolés regroupés, exports expliqués, « Sauvegarder l'étude », rapport conservé pendant et après une relance, reprise toujours avec le moteur d'origine
- ✅ Vocabulaire unique de la recherche utilisateur (relecture `plume` : 3,5/5 avant la passe de vocabulaire)
- ✅ CSV d'Excel en français (Windows-1252) lus correctement
- ✅ Tests : 32 règles d'analyse, 22 parcours automatiques (ordinateur et mobile), 3 passes `testeur` → certifié livrable

Reste, non bloquant : confirmation avant de supprimer un moteur ; deux études créées le même jour portent le même nom par défaut ; message « Reprendre repart de là » encore affiché quand le moteur d'origine a été supprimé.

## Itération 6 — Le rapport face à la v1 sur le corpus réel (13/10)

- ✅ Étude ÉcoSol rejouée en trois passes avec un vrai modèle ; certifiée pour une restitution par le `methodologue` (4/5, contre 2,5/5 pour le rapport de la v1) et la `plume` (4/5 contre 3,5/5)
- ✅ Extraction : énumérations découpées, passe de couverture des longues réponses (306 idées, 0 citation écartée)
- ✅ Regroupement sur le sens, motif = objet sur lequel agir, porte de qualité et consolidation, motif défini par son ton redistribué (30 motifs, aucun à une personne)
- ✅ Rapport : résumé en trois temps sourcé, « Ce qui a marché / bloque / divise / proposent » calculés par le code, signaux isolés, questions Q1…, prénoms masqués, biais annoncés
- ✅ Tests : 41 règles d'analyse, 22 parcours (ordinateur et mobile) à cette étape
- ⏳ Décisions d'Arnaud : mitigés au dénominateur du consensus ; masquage des personnalités publiques ; découpage d'une phrase conditionnelle ; motif à deux objets
- ⏳ Liste des prénoms à valider avant l'export ; contexte affiché autour d'une citation tronquée ; idées d'une même personne qui se chevauchent ; analyse par rôle

## Itération 7 — Retours d'Arnaud sur le rapport (13/10)

- ✅ Catégorie « question » et section « Questions soulevées » ; « constat » gardé
- ✅ Échelle d'avis v2 (consensus, majoritairement, plutôt, avis partagés, avis mitigés, peu d'avis), validée par le `methodologue`
- ✅ Une ligne par personne, verbatims enchaînés avec leur origine, comptes « (dont N mitigés) » cohérents ; clic sur un verbatim = texte d'origine surligné
- ✅ Restitution brute : nuances gardées, coupure « […] » encadrée, prénoms affichés (masquage manuel)
- ✅ Sources multiples : questionnaire et entretiens dans la même étude, plusieurs fichiers d'un coup, sources renommables et retirables, rapport périmé signalé
- ✅ ÉcoSol rejoué (passe 5) : certifié par le `methodologue` (4/5 ; v1 2,5/5), la `plume` (4,5/5) et le `testeur` ; exemple livré régénéré
- ✅ Tests : 50 règles d'analyse, 26 parcours (ordinateur et mobile)
- ⏳ Consignes de style en attente (ne pas relancer le cache pour rien) : « quand tous sont d'accord, le dire », « reprocher à quelqu'un », graphie unique des noms propres

## Itération 8 — Lisibilité et ton juste (13/10)

- ✅ Rapport en couleur : repères par avis et par section (Markdown), barre d'avis par motif (écran, HTML), une case par participant
- ✅ Références d'idées remplacées par les participants cités dans les exports ; texte d'origine au survol à l'écran
- ✅ Réponse courte affichée avec sa question ; consigne : la question donne le sens, l'ironie et le conditionnel aussi
- ✅ Ton jugé par rapport à l'objet du motif (étape dédiée pour les mitigés) ; « certains / d'autres / plusieurs » vérifiés ; paragraphe des propositions obligatoire dans le résumé
- ✅ Liste des études : « Rapport à relancer » quand les données ont changé
- ✅ ÉcoSol rejoué en entier (passe 6) : `methodologue` 4/5 certifié, `plume` 4/5, `testeur` livrable ; corrections de code appliquées ensuite (renvois « par ex. », question seulement pour une réponse entière, barres avec « sans avis », bulle à hauteur limitée, Échap)
- ⏳ Pour 5/5 : vérifier que chaque renvoi appuie sa phrase ; étape de ton qui peut déplacer une idée ; phrase précédente envoyée pour « malgré cela » (consigne ajoutée, à rejouer)

## Itérations B7–B9 — Vers 5/5 (13/10)

- ✅ Relecture des motifs (déplacer, rejuger le ton) ; pistes opposées dans « Ce qui divise » ; vérification des renvois guidée par les contrôles du code ; filets finaux
- ✅ Corpus privé hors du dépôt (exemples fictifs, test de confidentialité) ; audit automatique : B9 sans défaut
- ✅ Écran : survol sobre, barre d'actions unique, menus cohérents
- ✅ B10 : `methodologue` 4,5/5 (B9 4,3 ; v1 2,5), `plume` 4/5 « nettement plus près de 5 » ; audit sans défaut
- ✅ Interface : en-tête par modules (Accueil, Synthèse, modules à venir grisés ; moteurs à droite), « Vos synthèses », menu par synthèse, barre d'actions du rapport, menus communs
- ✅ Moteurs d'IA : catalogue de 18 fournisseurs vérifiés, rangés par type (direct, hébergeur, plateforme, local)
- ⏳ Pour 5/5 : mot isolé sans sens compté comme avis, passages au ton non couverts, « autres / l'une d'elles » à vérifier, motif fourre-tout ; deuxième corpus réel, double codage, relance sans cache, modèle léger
- ⏳ Décisions d'Arnaud : échelle d'avis (proposition du `methodologue`), pistes opposées d'un motif à l'autre
- ✅ Parcours Mistral joué dans le vrai compte (13/10) : la clé gratuite n'existe plus, il faut activer le paiement à l'usage ; guide et accueil corrigés (`docs/PARCOURS-FOURNISSEURS.md`)
- ✅ Parcours Mistral, deuxième passage avec Arnaud : clé gratuite par Admin › Clés API (Ministral inclus, Small et Medium payants) ; liste des modèles expliquée, recommandé en tête
- ✅ Synthèse ÉcoSol avec Ministral 14B (gratuit) en trois passes : 3/5 (`methodologue` et `plume`), contre 4,5 et 4 pour Sonnet (`docs/METHODES.md`)
- ✅ Une méthode par famille de modèles : la référence (Sonnet) reste mot pour mot, Ministral a la sienne
- ✅ Robustesse : réponses mal formées tolérées, réponse coupée signalée, citations inventées retirées, renvois réparés, estimation de durée recalée
- ✅ Parcours Gemini réel : clé gratuite créée dans AI Studio (projet « Niveau sans frais »), Flash-Lite choisi pour son quota (500 demandes par jour)
- ✅ ÉcoSol avec Gemini 3.5 Flash-Lite en quatre passes : 3,5/5 (`methodologue`), 2,5/5 (`plume`) ; méthode `gemini` (`docs/METHODES.md`)
- ✅ Essai croisé des règles Gemini sur Ministral : rejeté (note en baisse), Ministral garde sa v3
- ✅ Filets communs (sans effet sur Sonnet B10) : phrase dépendante, phrase répétée, sujets qui divisent rétablis, renvoi mal formé ; une reprise efface l'erreur de l'étape ; une synthèse propose son dernier moteur
- ✅ Parcours Groq réel : compte créé par Arnaud, clé par l'agent ; offre gratuite trop limitée pour une synthèse (8 000 jetons/min, 200 000/jour : environ une heure et plus que le quota) : abandonné, sorti des offres recommandées
- ✅ Bug corrigé : ouvrir la liste des modèles envoyait le formulaire du moteur
- ✅ Recherche des offres gratuites (14/10) : Cohere et Ollama à essayer ; Zhipu, GitHub Models, NVIDIA refusent le navigateur ; le reste trop limité ou payant
- ✅ Moteur d'IA par tâche et mode Confidentiel (premier pas) : défaut « Analyser et rédiger » sur la page Moteurs, dérogation et mode Confidentiel par synthèse, refus des moteurs en ligne par le code, mention « Sur votre ordinateur » / « En ligne » ; relu par la `plume`, test de parcours
- ⏳ Transcription (module Entretiens) : ligne « Transcrire » du choix par tâche, conversion vidéo → audio dans le navigateur, capacités par modèle éprouvées en vrai
- ⏳ Stratégie « gratuit d'abord » (Arnaud) : un modèle plus fort plus tard, pour toute la synthèse (pas étape par étape)
- ⏳ Méthode Ministral : phrase orpheline retirée avec sa phrase d'appui, un camp compté une fois, rangement guidé par la question, 6 à 8 thèmes
- ⏳ Chantiers communs listés dans `docs/METHODES.md` (sujets qui divisent reformulés, consensus rétablis, comptes des intros de thème, renvois en double, motifs fourre-tout) ; message de délai dépassé qui accuse la connexion

## Backlog (idées gardées, pas prioritaires)

- Anonymisation en un geste : liste des prénoms détectés, validée par le chercheur, puis masquage (décision d'Arnaud du 13/10 : pas de masquage automatique pour l'instant ; priorité à la qualité de l'analyse).
- Segments proposés : quand aucune colonne « Profil » n'existe, proposer des segments tirés des réponses (rôle, ancienneté…), au choix du chercheur ; comparer deux segments côte à côte. Prudence quand l'échantillon est trop petit.
- Pistes opposées sous un même constat : les signaler dans « Ce qui divise » (à trancher avec Arnaud).

## Prochaines étapes

- ⏳ Validation par Arnaud (`docs/VALIDATION.md`) : premier vrai appel (Groq, Mistral ou Ollama) depuis le navigateur
- ⏳ Langue : confirmer les dernières consignes de style sur un vrai moteur
- ✅ Mise en ligne : `openscribe.fr` sert la nouvelle application (Vercel, Vite), l'ancienne archivée sur `archive/application-nextjs`
- ⏳ Module Entretiens et tests (transcription, vidéo synchronisée), puis Personas
- ⏳ Stratégie d'acquisition (une fois l'expérience validée)
- ✅ L'Observatoire : étude école publiée et reliée depuis l'accueil (passe 13, finale, avec Opus 5.5 et la méthode « consultation » : **7/10** aux deux lectures `methodologue`, 2 erreurs du résumé signalées et corrigées dans la fiche, langue **6,5/10**), avec la section Méthode, ses limites, les mentions « à vérifier » et « fragile » du code et leurs explications au survol et au toucher (`public/observatoire/ecole-grand-debat-2019/`) ; méthode expliquée étape par étape dans `docs/METHODE.md`

## Itération 7 — Offres gratuites et modèles locaux (13-14/10)

- ✅ Mistral (Ministral 14B, 3/5) et Google Gemini (3.5 Flash-Lite, 3,5/5) gratuits, sans carte, parcours réels consignés
- ✅ Une méthode par famille de modèles (`docs/METHODES.md`), la référence Sonnet inchangée
- ✅ Moteur d'IA par tâche, pastille « Sur votre ordinateur » / « En ligne », mode Confidentiel (gardé pour qui a un moteur local)
- ✅ Groq abandonné (une heure par synthèse) ; Ollama essayé (gpt-oss 20B, Gemma 4 12B) puis retiré des choix : sous le seuil de 3,5/5
- ✅ Estimation de durée fondée sur la vitesse mesurée de chaque moteur (puis sur vos propres synthèses)
- ✅ Statut de qualité par moteur : validé (note) ou à l'étude (raison), seuil de 3,5/5
- ⏳ Évaluer Cohere (clé d'essai gratuite) et, avec une clé payante, Mistral Small, Claude Opus et Haiku
- ⏳ Réglages propres au fournisseur (réflexion) à inclure dans la clé du cache

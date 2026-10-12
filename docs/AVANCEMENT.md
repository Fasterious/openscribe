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

## Prochaines étapes

- ⏳ Validation par Arnaud (`docs/VALIDATION.md`) : premier vrai appel (Groq, Mistral ou Ollama) depuis le navigateur
- ⏳ Épreuve de la nouvelle méthode de regroupement sur le corpus réel ÉcoSol (privé)
- ⏳ Langue : confirmer les dernières consignes de style sur un vrai moteur
- ⏳ Mise en ligne (hébergement statique)
- ⏳ Module Entretiens et tests (transcription, vidéo synchronisée), puis Personas
- ⏳ Stratégie d'acquisition (une fois l'expérience validée)

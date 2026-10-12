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
- ✅ Tests de parcours automatiques (Playwright) : 12/12 sur ordinateur et mobile
- ✅ Test utilisateur : passe 1 (persona Camille, 5 défauts gênants), corrections, passe 2 : certifiée après correction du dernier point
- ✅ Test sur corpus réel (ÉcoSol, 20 personnes) avec un modèle joué par un sous-agent : 286 idées, 0 citation écartée, 35 groupes, 8 thèmes
- ✅ Qualité de la langue : guide de style, étape de relecture contrôlée, nombres vérifiés (relecture `plume` : 4/5, une passe de plus prévue)

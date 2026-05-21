# Captures — parcours connectés (à faire)

Les PNG dans ce dossier (racine) sont des **pages marketing déconnectées**.

## Prérequis (une fois)

1. Se connecter sur [openscribe.fr](https://www.openscribe.fr/) (Google)
2. `/settings` — vérifier clés **Gemini** (CSV, workshop) et **Mistral** (transcription)
3. Optionnel : exécuter `supabase/seed_workshop_20_responses.sql` sur une session workshop existante

## Écrans cibles

| Module | Route | Écran à capturer |
| --- | --- | --- |
| CSV | `/csv-analysis/[id]` | Stepper extraction → clusters → rapport |
| Persona | `/persona/[id]` | Heatmap / clusters après import `public/samples/persona-demo-50.csv` |
| Workshop | `/workshop/[sessionId]` | Nuage après analyse + seed |
| Transcription | `/transcription` | Viewer avec locuteurs (audio test) |
| Settings | `/settings` | Clés API configurées |

## Commande

```bash
node scripts/capture-fullpage-stitch.mjs --url "https://www.openscribe.fr/csv-analysis/UUID" --out docs/screenshots/csv-stepper.png
```

## Blocage actuel

L’upload CSV et les pipelines LLM **exigent une session Supabase**. L’agent ne peut pas passer l’OAuth Google à ta place.

**Quand tu es dispo (~2 min)** : connecte-toi dans l’onglet navigateur Cursor/Glass, dis « go captures connectées », je enchaîne les scénarios avec les samples.

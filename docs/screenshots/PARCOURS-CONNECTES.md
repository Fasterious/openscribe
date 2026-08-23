# Captures — parcours connectés

Session **mai 2026** sur [openscribe.fr](https://www.openscribe.fr/) avec compte Google (`compte.test@example.com`). Les captures Playwright headless **sans cookies** montrent la landing déconnectée — ne pas les confondre avec les PNG `*-connected.png` ci-dessous (navigateur Cursor, session active).

## Fichiers (connectés)

| Fichier | Route | Contenu |
| --- | --- | --- |
| `persona-results-connected.png` | `/persona/new` (étape 3) | 4 personas, radar, heatmap |
| `persona-columns-connected.png` | `/persona` | Écran d'accueil Personas (déconnecté) |
| `persona-columns-browser.png` | `/persona/new` (étape 1) | Sélection colonnes Likert |
| `persona-clustering-setup-browser.png` | `/persona/new` (étape 2) | Aperçu + algo + k |
| `settings-api-keys-connected.png` | `/settings` | Modal BYOK Mistral + Gemini configurées |

> **Captures du module Analyse CSV non versionnées.** Le matériel CSV publiable sera produit
> à partir de la consultation-vitrine (voir `docs/STRATEGIE.md`).

## Marketing déconnectés (référence)

`landing.png`, `csv-analysis.png`, `persona.png`, `workshop.png`, `transcription.png` — pages publiques sans session.

## Encore à faire (optionnel)

| Module | Blocage |
| --- | --- |
| Workshop | Aucune session listée sur `/workshop` — créer session + `seed_workshop_20_responses.sql` puis capturer nuage |
| Transcription | Pas de transcription terminée visible — upload audio test puis viewer locuteurs |

## Commande headless (déconnecté uniquement)

```bash
node scripts/capture-fullpage-stitch.mjs --url "https://www.openscribe.fr/" --out docs/screenshots/landing.png
```

Pour les parcours authentifiés : exporter `storageState` Playwright après login, ou capturer via navigateur Cursor (comme cette passe).

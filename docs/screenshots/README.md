# Captures d'écran OpenScribe

## Méthode recommandée (en ligne)

Cible **https://www.openscribe.fr/** — pas besoin de `npm run dev` local.

```bash
npx playwright install chromium   # une fois (~80 Mo, binaire navigateur)
node scripts/capture-fullpage-stitch.mjs \
  --url https://www.openscribe.fr/ \
  --out docs/screenshots/landing.png
```

Par défaut : **`playwright-fullpage`** (équivalent fiable à une extension type GoFullPage, sans recollage manuel).

Recollage manuel (`--method stitch`) : uniquement si `fullPage` échoue sur une page très longue — algorithme type GoFullPage (rogne le chevauchement entre bandes, masque header fixed au scroll).

## Fichiers

| Fichier | URL |
| --- | --- |
| `landing.png` | `/` |
| `transcription.png` | `/transcription` |
| `csv-analysis.png` | `/csv-analysis` |
| `persona.png` | `/persona` |
| `workshop.png` | `/workshop` |

## Parcours connectés

Stepper CSV, clusters, nuage workshop : session + clés API — à refaire quand l'utilisateur est dispo (seeds SQL dans `supabase/seed_workshop_*.sql`).

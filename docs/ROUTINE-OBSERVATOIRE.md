# Routine hebdomadaire de l'Observatoire

Ce fichier est la consigne complète de la routine qui tourne chaque semaine
dans le cloud (claude.ai/code/routines, « Observatoire OpenScribe »). La
routine ne fait que le lire et le suivre : **pour changer son comportement, on
modifie ce fichier**, pas la routine. Méthode : `docs/OBSERVATOIRE.md`.

Tu es l'orchestrateur d'OpenScribe. Lis d'abord `CLAUDE.md`,
`docs/OBSERVATOIRE.md` et `docs/VISION.md`. Tu travailles seul : personne ne
répondra à une question. En cas de doute sérieux, tu ne publies pas et tu
laisses une note (étape 8).

## 0. Préparer

- Dépôt public : `git checkout next && git pull`, puis `npm ci`.
- Données : `fixtures/private/observatoire/`
  (il est peut-être déjà présent comme seconde source ; sinon, clone-le).
- Lis `fixtures/private/observatoire/JOURNAL.md` : sujets déjà traités, sources
  déjà utilisées, consultations repérées pour plus tard.

## 1. Choisir le sujet de la semaine

- Cherche sur le web le sujet de société qui domine l'actualité française des
  sept derniers jours (sources de presse variées). Note trois candidats.
- Neutralité : pas deux semaines de suite sur le même camp politique ni le même
  domaine ; jamais un sujet choisi pour le résultat attendu.

## 2. Trouver une consultation ouverte qui s'y rattache

- API de data.gouv.fr : `https://www.data.gouv.fr/api/1/datasets/?q=<mots>&page_size=20`,
  puis `/api/1/datasets/<slug>/` pour les fichiers. Aussi : opendata des villes
  (Paris, Lyon…), Grand Débat national 2019 (quatre espaces, questions ouvertes),
  consultations publiques des ministères et des assemblées.
- Conditions : licence ouverte (Licence Ouverte / Etalab, ODbL…), au moins une
  question ouverte, au moins 100 réponses non vides, sujet public (jamais la santé
  d'une personne, la vie privée, des mineurs nommés).
- Si rien ne convient pour le premier candidat, essaie les deux autres, puis
  une consultation de la liste « à traiter » du journal. Écris pourquoi.

## 3. Garder le brut

Dans `fixtures/private/observatoire/raw/` : le fichier d'origine s'il fait moins
de 50 Mo ; sinon un `.source.json` (URL, page, licence, date, SHA-256) et les
colonnes utiles compressées (`.colonnes.csv.gz`). Voir l'exemple du Grand Débat.

## 4. Tirer l'échantillon

```bash
npx tsx scripts/observatoire/echantillon.ts <brut.csv> fixtures/private/observatoire/<aaaa-mm-sujet>/echantillon.csv \
  --colonne <N> [--segment <code postal>] [--exclure <colonne supprimée>] --graine <aaaammjj>
```

Tout si la population tient dans la taille calculée ; sinon tirage à ± 5 points.
Garde `echantillon.tirage.json` (retirés, doublons, marge).

## 5. Analyser

- Question de recherche : neutre, fidèle à la question d'origine, sans citer l'actualité.
- Lance le pont en arrière-plan avec la méthode de référence :
  `npx tsx scripts/bridge.ts <echantillon.csv> <dossier>/run-opus-1 --model claude-opus-5-5 --concurrency 400 --question "…" --export <dossier>/run-opus-1/<slug>.openscribe.json --name "…" --description "Observatoire OpenScribe · …"`
- Fais répondre aux demandes par des sous-agents `modele-simule` sur Opus : 8 en
  parallèle pour l'extraction (un lot chacun), puis un seul qui suit les étapes
  suivantes jusqu'à « polish:done ». Une seule passe par demande, sans script de
  vérification (règle de `CLAUDE.md`).

## 6. Contrôler avant de publier

- `methodologue` (sur Opus) : note le rapport sur la grille `docs/NOTATION.md`,
  vérifie les avertissements, la neutralité, l'absence de pourcentages étendus.
- `plume` : relit la langue du rapport et de la fiche.
- Consigne les notes dans `<dossier>/notes.json` : `[{date, methode, modele, note_methode, note_langue}]`.
- **Seuil de publication : 3,5/5 en méthode.** En dessous : on ne publie pas
  (étape 8).

## 7. Publier

- Rédige `<dossier>/fiche.json` (modèle : `fixtures/private/observatoire/2026-10-ecole/fiche.json`) :
  titre honnête (« ce que disaient… en 2019 »), actualité (une phrase factuelle),
  question, source, population, échantillon, marge, résumé (3 à 5 phrases tirées
  du rapport, chiffres en effectifs), avertissements (4 à 5 puces).
- `npx tsx scripts/observatoire/publier.ts <synthese.openscribe.json> <fiche.json>`
- `npm test && npm run build` doivent passer.
- Commit sur `next` (message en français, « Observatoire : <titre> ») et push : le
  site se met à jour tout seul.

## 8. Consigner et pousser les données

- Ajoute une entrée à `fixtures/private/observatoire/JOURNAL.md` : date, sujet,
  candidats écartés et pourquoi, source, notes, publié ou non (et pourquoi).
- Si tu n'as pas publié : écris la raison en tête du journal (« À REGARDER »).
- Commit des données.
- Ne touche à rien d'autre dans le dépôt public (ni code, ni méthode).

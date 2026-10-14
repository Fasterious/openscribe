# L'Observatoire OpenScribe

Chaque semaine, un sujet d'actualité et une consultation citoyenne en données
ouvertes, analysée avec OpenScribe et publiée sur le site (`#/observatoire`).
Deux buts : montrer le produit sur de vraies données (vitrine, référencement) et
constituer des corpus réels qui grossissent chaque semaine pour éprouver la méthode.

Décision d'Arnaud (14/10/2026) : on publie chez nous, jamais dans les forums des
autres ; sources sous licence ouverte uniquement ; données brutes gardées pour
pouvoir rejouer quand la méthode progresse.

## Règles de méthode (validées par le `methodologue`)

1. **L'actualité choisit le sujet, jamais la réponse.** La consultation pose une
   question ouverte et équilibrée, publiée sous licence ouverte ; la fiche dit
   pourquoi elle a été choisie. Ne pas citer l'actualité dans la question de
   recherche donnée à l'analyse.
2. **Neutralité** (campagne présidentielle) : on alterne sujets et sources ; on ne
   choisit jamais une consultation pour son résultat attendu.
3. **Tout, ou un tirage au sort.** Si toutes les réponses tiennent dans la taille
   calculée, on analyse tout. Sinon, tirage aléatoire à graine publiée, taille
   calculée pour une proportion à 95 % de confiance et ± 5 points, avec
   correction pour population finie (`scripts/observatoire/echantillon.ts`).
4. **Avant le tirage** : retirer les réponses vides (moins de 15 caractères) et les
   copier-coller (campagnes organisées) ; publier combien ont été retirées.
   Réponses longues gardées entières. Région plutôt que département ; aucune
   comparaison sur un groupe de moins de 10 personnes.
5. **Effectifs, pas pourcentages étendus à la population** ; les avis minoritaires
   restent visibles ; « fragile » quand une voix change l'étiquette.
6. **Avertissements en tête de chaque rapport** : date des réponses, qui a répondu
   (auto-sélection), taille de l'échantillon, ce qu'on ne peut pas conclure.
7. Le `methodologue` relit chaque rapport avant publication, la `plume` en relit la langue.

## La semaine type (ce que fait la routine)

1. **Choisir** le sujet d'actualité de la semaine (recherche web), puis une
   consultation ouverte qui s'y rattache (data.gouv.fr, opendata des villes,
   Grand Débat 2019, consultations publiques des ministères). Si aucune ne
   convient, prendre la suivante dans `fixtures/private/observatoire/A-TRAITER.md`.
2. **Garder le brut** : `raw/` contient l'URL, l'empreinte SHA-256 du fichier
   d'origine et la colonne utile extraite (avec identifiants), de quoi rejouer.
3. **Tirer l'échantillon**, **analyser** (méthode de référence, pont + modèle
   joué par des sous-agents Opus, en une passe), **noter** (grille
   `docs/NOTATION.md`, `methodologue`), **rédiger la fiche**.
4. **Publier** : `npx tsx scripts/observatoire/publier.ts <synthese> <fiche.json>`
   écrit la page statique, le fichier de synthèse et l'index dans `public/observatoire/`.
5. **Consigner** la note dans `notes.json` de l'étude.

## Où vivent les données

```
fixtures/private/observatoire/          (hors du dépôt)
  raw/                                  sources d'origine (ou leur URL + empreinte si trop lourdes)
  <aaaa-mm-sujet>/
    echantillon.csv, echantillon.tirage.json
    run-<modèle>-<n>/                    demandes, réponses en cache, rapport, synthèse exportée
    fiche.json                           ce qui est publié (titre, actualité, avertissements…)
    notes.json                           historique des notes : [{date, méthode, modèle, note}]
public/observatoire/                    ce qui est publié (dépôt public)
```

**Rejouer** : quand une méthode progresse, on peut relancer une étude passée ; on
ne republie que si la note monte (`notes.json` garde l'historique, l'ancien
rapport reste dans son dossier `run-…`).

## Pourquoi un échantillon suffit (à expliquer dans chaque fiche, champ `sampling`)

On estime des proportions : l'outil est l'**intervalle de confiance**, pas la
valeur p (qui sert à comparer deux groupes, « l'effet est-il dû au hasard ? »).
À 95 % de confiance (risque α = 0,05, une chance sur 20 de tomber hors de la
marge), la taille nécessaire est n₀ = z² · p(1 − p) / e², avec z = 1,96, p = 0,5
(cas le plus prudent) et e la marge (0,05). On corrige pour la population
finie : n = n₀ / (1 + (n₀ − 1) / N). La précision dépend de la taille de
l'échantillon, presque pas de celle de la population.

| Confiance | Marge | Tirages pour N = 21 868 |
|---|---|---|
| 95 % (usage des sondages) | ± 5 points | 378 |
| 99 % | ± 5 points | 644 |
| 99,5 % (seuil 0,005) | ± 5 points | 761 |
| 95 % | ± 3 points | 1 018 |

On garde 95 % et ± 5 points : la limite principale n'est pas le hasard du
tirage mais l'**auto-sélection** des répondants, que des tirages en plus ne
corrigent pas. Pour une idée rare, la marge est plus étroite (± 2,2 points pour
5 %) mais l'effectif reste petit : on l'étiquette « fragile ».

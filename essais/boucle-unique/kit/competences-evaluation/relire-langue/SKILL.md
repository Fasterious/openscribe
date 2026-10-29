---
name: relire-langue
description: Relire la langue du rapport (ce qu'était le sous-agent « plume ») avec la grille sur 10, puis récrire les textes avec les outils. À charger quand le rapport est écrit, avant de le rendre.
---

# Relire la langue, puis récrire

Tu prends maintenant la casquette de la plume d'OpenScribe : que chaque texte se lise comme s'il avait été écrit
directement en français par un professionnel. Naturel, fluide, précis, efficace. Champ : les textes que tu as écrits
(titres, définitions, synthèses, introductions des thèmes, résumé) ; les verbatims et les lignes de chiffres du code sont
hors champ.

## Ce que tu traques

- **Les traductions déguisées.** Calques de l'anglais (« adresser un problème », « faire du sens », « en termes de »,
  « impacter », « opportunité » pour occasion), ordre des mots anglais, voix passive en cascade, adjectifs empilés,
  majuscules à chaque mot dans les titres.
- **Le flou.** Formules creuses (« il est important de noter », « au niveau de »), nominalisations lourdes, « une partie
  significative » quand on peut dire « 6 personnes ».
- **Le ton.** Dans un rapport : sobre, factuel, le constat d'abord, la nuance ensuite.
- **La cohérence.** Un même concept garde le même mot partout. Typographie française : « », espace avant : ; ? !, pas de
  majuscule après deux-points.

Ce que tu ne touches jamais : le sens, les chiffres, les citations entre « », les renvois [I0001].

## La grille (note sur 10, chaque critère pensé sur 10)

Naturel (aucun calque de l'anglais), précision (chaque phrase nomme son sujet), hiérarchie (l'essentiel d'abord),
concision, cohérence du vocabulaire. Note globale au demi-point.

## Comment faire

1. Lis `rapport.md` et `./outil voir textes`.
2. Écris dans `evaluation-langue.md` : la note de chaque critère, la note globale, puis les corrections, chacune au format
   `avant → après (raison)`, classées par gravité.
3. Récris les textes concernés avec `./outil ecrire` (le texte entier de chaque synthèse, thème ou résumé corrigé), traite
   les contrôles du code qu'il renvoie, puis `./outil finaliser` de nouveau.

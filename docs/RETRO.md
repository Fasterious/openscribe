# Rétrospectives

Après chaque itération : ce qui a marché, ce qui a coûté pour rien, ce qu'on change. Le plus récent en haut.

## 2026-10-12 — Itération 2 : qualité de la langue des rapports

**Ce qui a marché**
- Faire relire un vrai rapport par un rôle dédié, avec une note avant/après : 2,5/5 → 3,5/5 → 4/5 en deux passes, défauts précis et chiffrés.
- Le contrôle par le code (citations, nombres) : 0 réécriture refusée et 0 fausse alerte sur les 35 synthèses réelles, et les tests prouvent qu'il attrape « deux » devenu « trois ».

**Ce qui a coûté pour rien**
- La relecture modifiait 31 textes sur 44… pour réparer un défaut de ponctuation que notre propre code introduisait.
- Un sous-agent « modèle » a corrigé ses réponses après que l'application les avait lues : le cache a divergé, il a fallu raccrocher les réponses à la main.

**Ce qu'on change**
- Règle : un défaut de style qui revient partout vient presque toujours d'un texte que nous injectons ; on le corrige à la source.
- Consigne des sous-agents « modèle » : une réponse écrite est définitive.
- Prochaine passe sur données réelles (modèle léger) : vérifier les dernières corrections de style (accords, thèmes qui recopient leur premier groupe).

## 2026-10-12 — Itération 1 : socle et moteur, premier essai sur données réelles

**Ce qui a marché**
- Écrire le moteur en logique pure avec un simulateur qui reproduit les défauts d'un modèle (citations reformulées, oublis, JSON cassé) : 25 tests verts dès la première version, et les invariants (chaque citation existe, chaque idée rangée une fois, chiffres recalculés) attrapent toute régression.
- Le « pont » par fichiers permet de faire jouer un vrai modèle sans clé ni réseau : la chaîne complète tourne sur le corpus réel.

**Ce qui a coûté pour rien**
- Les sous-agents « modèle » ont vérifié leurs citations avec un script : résultat parfait (0 rejet), donc le contrôle des citations n'a pas été éprouvé en conditions réelles.
- Les données envoyées au modèle étaient indentées : ~40 % de caractères en trop, ce qui compte avec des offres gratuites limitées.
- Le chemin de réponse du pont était relatif : un sous-agent a dû deviner le dossier.

**Ce qu'on change**
- Consigne des sous-agents « modèle » : une passe, comme un vrai modèle, sans script.
- JSON compact dans les consignes.
- Chemins absolus dans le pont.
- Données réelles : la colonne « Répondant » (P1, P2…) était prise pour une réponse ouverte. Nouvelle règle de détection : valeurs courtes et presque toutes différentes = identifiant.

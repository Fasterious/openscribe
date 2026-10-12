# Rétrospectives

Après chaque itération : ce qui a marché, ce qui a coûté pour rien, ce qu'on change. Le plus récent en haut.

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

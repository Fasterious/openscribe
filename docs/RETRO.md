# Rétrospectives

Après chaque itération : ce qui a marché, ce qui a coûté pour rien, ce qu'on change. Le plus récent en haut.

## 2026-10-12 — Itération 5 : retour d'Arnaud (accueil, moteurs, méthode)

**Ce qui a marché**
- Chercher la cause racine avant d'écrire une consigne : le regroupement grossier venait d'une cible numérique (2 à 6 groupes pour 37 idées), pas du modèle.
- Les relectures croisées en parallèle (`testeur`, `plume`, `methodologue`) : chacune a trouvé ce que les autres ne voyaient pas (faux désaccords sur les thèmes, lexique instable, rapport perdu à la relance, reprise avec le mauvais moteur).
- Amorcer le pont de test avec les réponses déjà obtenues : regénérer l'exemple ne coûte que les étapes modifiées.

**Ce qui a coûté pour rien**
- Une première passe `testeur` lancée pendant que le code changeait encore : résultats partiellement périmés. La certification doit se faire sur un commit figé.
- Un test de parcours dont le sélecteur dépendait d'un libellé qui change au clic ; un autre qui supposait une relance lente alors que le cache la rend instantanée.

**Ce qu'on change**
- Règle : une passe de certification se fait sur un commit figé, et rien n'est modifié dans le dépôt pendant qu'elle tourne.
- Règle : une cible chiffrée dans une consigne est un réglage de méthode, à faire valider par le `methodologue`.
- Règle : tout parcours qui quitte un écran de travail doit offrir le retour, et ce retour est testé.

## 2026-10-12 — Itération 4 : épreuve du modèle léger

- Le contrôle des chiffres a d'abord produit de fausses alertes sur des sous-comptes vrais (« deux personnes » citées dans deux crochets) : on les vérifie maintenant par phrase. Une alerte doit être juste, sinon on cesse d'y croire.
- Un modèle léger suit moins bien le guide de style : constats non attribués, recopie d'un niveau à l'autre. Les consignes sont renforcées, et la relecture attribue les constats laissés sans sujet.

## 2026-10-12 — Itération 3 : interface et test utilisateur

**Ce qui a marché**
- Lancer en parallèle le test utilisateur et la relecture des textes, puis déléguer la rédaction à un agent pendant que je corrige le fond : deux passes complètes en peu de temps.
- Les tests de parcours automatiques transforment chaque défaut corrigé en garantie (le double clic sur l'exemple est désormais testé).

**Ce qui a coûté pour rien**
- La passe 1 a révélé que la première impression dépendait d'un rapport de simulation peu crédible : on aurait pu y penser dès la conception de l'accueil.

**Ce qu'on change**
- Règle : la première impression se teste comme une fonctionnalité (l'exemple doit montrer le vrai niveau de l'outil).

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

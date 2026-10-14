# Rétrospectives

Après chaque itération : ce qui a marché, ce qui a coûté pour rien, ce qu'on change. Le plus récent en haut.

## 2026-10-13 — Itération 7 : retours d'Arnaud (questions, échelle, une personne par ligne, sources multiples)

**Ce qui a marché**
- Faire valider les règles par le `methodologue` avant de coder : il a corrigé deux seuils et refusé un filtre naïf (« et » dans un titre) qui aurait cassé des motifs justes.
- Trois relecteurs indépendants à chaque passe (`methodologue`, `plume`, `testeur`) : chacun a trouvé ce que les autres ne voyaient pas (affichage qui fait croire à un faux comptage, libellés mal accordés, fichier vide qui compte une personne deux fois).
- Le `testeur` a trouvé un vrai défaut de données dès la première passe : décocher une question du questionnaire écartait les entretiens.

**Ce qui a coûté pour rien**
- J'ai modifié deux fichiers pendant une passe du `testeur` : son banc n'était plus figé. La règle existait ; je l'ai enfreinte.
- Une retouche d'affichage (la ligne de chiffres) faisait aussi partie des données envoyées au modèle : elle invalidait le cache et forçait à relancer l'analyse. Même chose pour l'ordre d'une liste.
- Une consigne ambiguë (« aucun autre « … » ») a fait éviter au modèle des points de suspension présents dans le texte.

**Ce qu'on change**
- Règle : ce qu'on affiche n'est jamais ce qu'on envoie au modèle ; une retouche de présentation ne doit pas invalider les réponses déjà obtenues (`metricsLine` pour l'écran, `describeMetrics` pour le modèle).
- Règle : quand on renomme un concept (titre, catégorie), on cherche toutes ses mentions, méthode comprise.

## 2026-10-13 — Itération 6 : le rapport face à la v1, sur données réelles

**Ce qui a marché**
- Comparer à une référence que le fondateur juge excellente, avec deux juges indépendants (`methodologue`, `plume`) et des mesures faites par le code (citations, chiffres, couverture). Les notes ont rendu les progrès et les reculs indiscutables.
- Lire comment la v1 obtenait sa qualité avant de corriger : la cause était dans la structure de la chaîne (regroupement par le haut, synthèses écrites sur les verbatims), pas dans les mots des consignes.
- Les pannes du modèle joué (réponse de thèmes à moitié vide, identifiant inventé) ont servi de vrais tests : le code a tenu, et l'une a révélé un manque (les motifs oubliés finissaient dans « Autres sujets »).

**Ce qui a coûté pour rien**
- Récupérer des documents par des exports en base64 recopiés à la main ; un export PDF lu par `pdftotext` aurait suffi dès le départ.
- Un commit de documents qui citaient un produit concurrent : annulé avant l'envoi, mais il aurait dû être évité par la relecture de la règle.
- Deux sous-agents « modèle » ont écrit un brouillon avant leur réponse : la consigne dit désormais « prépare la réponse complète avant d'écrire ».

**Ce qu'on change**
- Règle : tout chiffre affiché garde le même dénominateur partout dans le rapport ; il vient d'une seule formule du code.
- Règle : avant d'écrire dans `docs/` ou de commiter un document externe, vérifier qu'il ne nomme aucun produit concurrent.
- Avant une décision de produit, relire `docs/VISION.md` (ajouté au `CLAUDE.md`).

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

## Itération 8 — Lisibilité et ton juste (13/10)

- **Bien marché** : trois relecteurs en parallèle sur un commit figé, chacun avec une consigne précise ; leurs défauts se recoupent et se classent vite. Le test du même mot sous trois questions, avec un modèle léger, a prouvé la consigne en une minute.
- **Coûté pour rien** : un contrôle (pluriels) écrit sans le passer sur le corpus réel avant le rejeu complet : 9 phrases retirées, dont des justes. Et un `prettier` lancé sans la configuration du dépôt, qui a reformaté deux fichiers entiers.
- **On change** : tout nouveau contrôle qui retire du texte est d'abord passé sur les synthèses déjà en cache du corpus réel (sans appel au moteur), puis seulement le rejeu. Formatage : `prettier --no-semi --single-quote --print-width 160`.

## Itérations B7–B9 — Vers 5/5 (13/10)

- **Bien marché** : relier chaque défaut des relecteurs à sa cause dans le processus ; l'audit automatique transforme leurs remarques en contrôles rejouables sans appel au moteur ; réutiliser le cache de l'extraction quand ses consignes n'ont pas changé (B9 : une dizaine d'appels au lieu de trente).
- **Coûté pour rien** : des exemples de consigne trop proches du corpus de certification (contamination) ; un contrôle « par ex. » écrit trop large, qui a déplacé le défaut au lieu de le corriger ; modifier le code pendant une relecture (rattrapé en ne régénérant rien).
- **On change** : règle ajoutée (exemples jamais tirés du corpus de certification) ; chaque contrôle nouveau a ses cas fictifs en test et passe d'abord sur le rejeu précédent en cache ; il faut un deuxième corpus réel pour une certification indépendante.

## Parcours Mistral réel (13/10)

- **Bien marché** : jouer le parcours dans le vrai compte a révélé en cinq minutes une promesse fausse affichée sur l'accueil (« Mistral gratuit, sans carte »), invisible aux tests automatiques.
- **Coûté pour rien** : la fiche Mistral avait été « vérifiée » sur la documentation, pas dans une console ; la documentation était périmée.
- **On change** : une offre gratuite s'affirme seulement après un passage réel dans la console, daté dans `docs/PARCOURS-FOURNISSEURS.md`.

## Ministral 14B sur ÉcoSol (13/10, le soir)

- **Bien marché** : les deux relecteurs en parallèle sur chaque passe, avec l'audit automatique pour les chiffres ; les nouveaux contrôles rodés sur les synthèses en cache de Sonnet avant d'être gardés (aucun effet). Le transfert de l'export de la page vers le disque par un récepteur local, sans rien faire sortir de la machine.
- **Coûté pour rien** : un changement de consigne appliqué à toutes les méthodes, défait ensuite sur la remarque d'Arnaud ; une relance perdue parce que la page n'avait pas rechargé le code (naviguer vers la même adresse ne recharge pas).
- **On change** : une méthode par famille de modèles, la référence intouchable sauf preuve que la note monte (règle ajoutée) ; recharger la page (`location.reload`) après chaque changement de code avant de relancer.

## Gemini sur ÉcoSol (13/10, fin de soirée)

- **Bien marché** : changer une seule cause à la fois grâce au cache (P4 reprend le regroupement de P2 et ne fait varier que la rédaction) ; l'essai croisé tranché par les notes, sans débat ; relancer Ministral v3 depuis le cache en 20 secondes et sans appel.
- **Coûté pour rien** : une analyse interrompue parce que j'ai modifié un document pendant qu'elle tournait (le serveur de développement recharge la page pour tout fichier) ; des essais d'API groupés trop longs qui ont figé l'onglet (les lancer en tâche de fond, puis relever).
- **On change** : aucune écriture dans le dépôt pendant une analyse dans le navigateur (règle ajoutée) ; un apport d'une méthode n'est essayé ailleurs qu'une variable à la fois.

## Groq (13/10, fin de soirée)

- **Bien marché** : sonder l'API avant de lancer (liste des modèles, demande de 12 000 jetons, réponse sans longueur) a expliqué chaque arrêt en une minute ; lancer deux modèles en parallèle, chacun avec son quota.
- **Coûté pour rien** : 25 minutes de synthèse avant de constater ce que le calcul disait déjà (8 000 jetons par minute pour plus de 200 000 jetons au total).
- **On change** : avant de lancer une synthèse sur un nouveau fournisseur, estimer sa durée minimale à partir du quota par minute et des jetons d'une synthèse de référence (environ 215 000 pour ÉcoSol) ; si elle dépasse vingt minutes, on le dit avant de lancer.

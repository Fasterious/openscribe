# Notation methodologue, lecture 2 (à l'aveugle)

Analyse : Observatoire 2026-11-sante, run-opus-1 (Claude Opus 5.5) · 380 participants, 773 idées, 46 motifs, 9 grands thèmes.
Question : satisfaction et difficultés lors d'une demande de remboursement de soins (Grand Débat 2019).
Grille : `docs/NOTATION.md` (six critères sur 10, moyenne au demi-point, sans plafond).

**7/10 · 3 erreurs du résumé · structure saine**

## Contrôles effectués

- Correspondance : P1 = première ligne de données (I0001, « CPAM, manque de clarté… ») ; vérifiée aussi sur P2, P5, P6, P9, P45, P327.
- Verbatims : script sur les 773 idées contre `echantillon.csv` : 772 exacts, 1 coupure « […] » (I0101 P45, coupure d'une énumération, sans négation ni réserve perdue). Aucune citation déformée.
- Recalcul des étiquettes et des « fragile » avec `stanceOf`, `isFragile`, `conclusionMove`, `dividedFragile` sur les camps de `state.json` : Télétransmission, Niveau de prise en charge, Prise en charge à 100 %, Compétence des agents, Dossier médical partagé, Régimes particuliers, Délais, Service des mutuelles, Coordination, Tiers payant, Services en ligne, Complexité, Carte Vitale (13 contrôles) : le code applique ses règles sans faute.
- Unanimités du résumé relues idée par idée (optique-dentaire-auditif 24/24, coût des complémentaires 15/15, dépassements 14/14, lisibilité 13/13, franchises 10/10) et unanimités « Et aussi » (médicaments 11/11, conscience du coût 5/5).
- Renvois d'exemple du résumé (P61, P1, P67, P263, P5, P8, P27, P16, P22, P24, P42, P46, P14, P15, P293, P367, P108, P207, P21, P49) : tous justes.
- Réponses brutes relues : P6, P9, P21, P27, P36, P40, P45, P54, P55, P61, P98, P105, P116, P123, P134, P135, P138, P166, P175, P176, P184, P210, P222, P265, P268, P293, P301, P327, P342, P343, P351 (31).
- Les 15 dernières synthèses de motifs (G32 à G46) et les 9 synthèses de grands thèmes relues contre leurs idées.

## Les six critères

| # | Critère | Note | Justification |
|---|---|---|---|
| 1 | Découpage en idées | 7 | Verbatims exacts, un objet par idée dans la grande majorité des cas. Mais : tons inversés (I0019 P9 « rembourse tout à tout le monde », suivi de « supprimer l'AME », compté positif ; I0732 P134 neutre dans Tiers payant alors que le même verbatim est négatif dans Conscience du coût, I0297) ; « mitigés » artificiels (P116 « le tiers payant, malheureusement non proposé par tous » ; P19, P11, P249 sur la carte Vitale) ; idée composite (I0214 P98 : dentaire, optique, dépassements, ostéopathie, étiquetée « Ostéopathie », rangée en optique, les dépassements perdus) ; découpage répétitif des bavards (P6 : 6 idées pour un seul argument sur les franchises ; P262 : 5 ; P150 : 5). Environ 30 fragments courts tirés de réponses longues sont incompréhensibles seuls (I0109 P49 « des frais dentaires », I0337 P154, I0306 P138, I0360 P166). |
| 2 | Traçabilité | 7,5 | Les renvois du résumé sont justes et les comptes viennent du code. Écarts dans les synthèses : P9 cité parmi les « 8 personnes [qui] jugent les soins correctement remboursés » (grand thème Niveau de remboursement) ; « 13 décrivent des ruptures » du lien Sécurité sociale-mutuelle (grand thème Complémentaires), alors que P120, P124, P203, P285 et P352 parlent de transferts entre caisses ou régimes ; P268 (ordonnance « en base ») compté dans le Dossier médical partagé ; P210 « purger ce secteur » rendu par « purger la Sécurité sociale » (G1). |
| 3 | Regroupement | 7 | Structure saine : 6 motifs sur 46 à une personne (13 %), le plus gros fait 98 idées sur 773 (13 %), aucun fourre-tout. Défauts : « Coordination entre organismes » réunit deux objets (lien Sécurité sociale-mutuelle, transferts entre caisses) ; « Tiers payant » absorbe des mutuelles non reconnues (P126, P271, P36 en copie de Facturation à l'hôpital) ; trois motifs à une personne qui ont un voisin évident (Outils des agents vers Compétence des agents ; Centres de remboursement vers Complexité ou Lisibilité ; Place de la prévention, de P77, à côté de Médecines douces où P287 dit la même chose du curatif). |
| 4 | Fidélité des chiffres et des minorités | 6,5 | Les comptes de personnes sont justes et calculés. Mais trois livres de codes mettent en « négatif » des personnes qui regrettent que l'objet manque : la Télétransmission paraît une majorité fragile, le Tiers payant paraît divisé, alors que presque tous y sont favorables. Les vrais opposants au tiers payant (P293, P134) ne sont dans aucun camp : la minorité disparaît. « Remboursement des médicaments » est « unanime » alors que P74 et P187 veulent rembourser moins et P79, P52 rembourser plus (la synthèse le dit, la liste « Ce qui bloque » non, et aucune opposition n'est détectée). Les minorités de G1 (P40, P94, P162) et de « Contact avec les caisses » (P261, P338 qui ont des contacts professionnels) sont bien visibles. |
| 5 | Synthèses et thèmes | 7,5 | Camp le plus nombreux d'abord, nuances gardées (« raisons opposées » sur les médicaments, P61 qui nuance ailleurs, bémols du DMP). Les synthèses des petits motifs (G34 à G46) sont fidèles et sobres. Quelques glissements de portée (lien Sécurité sociale-mutuelle, P210, P9) ; les grands thèmes rapprochent des motifs voisins sans faux consensus, sauf le Tiers payant présenté comme divisé. |
| 6 | Valeur pour la restitution | 7 | Le résumé hiérarchise bien et se présente presque tel quel : satisfaction générale large, contact avec les caisses, reste à charge (optique-dentaire, dépassements, complémentaires), démarches. « Ce qui divise » contient deux faux désaccords (Tiers payant ; Coordination, en partie) et un motif unanime (Franchises, admis pour ses remèdes opposés, mais déroutant) ; la liste « Et aussi » de 21 motifs sans chiffre dilue « Ce qui bloque » ; la première phrase du résumé (87 sur 90) n'a pas d'étiquette d'avis. |

Moyenne : (7 + 7,5 + 7 + 6,5 + 7,5 + 7) / 6 = 7,08, soit **7/10**.

## Erreurs du résumé (changent une conclusion)

1. **Télétransmission des feuilles de soins, « 17 sur 29 (majorité, fragile) »**. Le livre de codes compte comme négatif « subir les feuilles papier, les refus de carte Vitale ». Les négatifs P78, P136, P143, P209, P309 et les mitigés P11, P19, P249, P64 se plaignent que des praticiens n'utilisent pas la carte Vitale : ils approuvent la télétransmission. Ne la critiquent vraiment que P123 (confiée au privé), P223 et P256 (échecs de transmission). La conclusion juste est une large majorité, sans « fragile ».
2. **Tiers payant dans « Ce qui divise » (5 positifs, 5 négatifs, 1 mitigé ; compté dans les « 3 autres sujets [qui] divisent »)**. Les 5 négatifs (P126, P184, P271, P304, P36) et le mitigé P116 regrettent l'avance de frais ou une mutuelle non reconnue : aucun ne s'oppose au tiers payant. Les deux opposants réels, P293 (« Supprimer le tiers payant généralisé ») et P134 (le tiers payant fait perdre la conscience du prix), sont en suggestion et en constat. Le grand thème répète « Le tiers payant divise ». Conclusion juste : avis largement favorables, avec une minorité de 2 personnes contre la généralisation.
3. **Niveau de prise en charge, « 18 sur 26 (majorité, fragile) »**. P9 est compté positif (I0019, passé de négatif à positif par la relecture des tons) alors que sa phrase critique un système qui « rembourse tout à tout le monde » et réclame la fin de l'AME. Sans lui (7 contre 18), l'étiquette n'est plus fragile. Le grand thème cite P9 parmi ceux qui jugent « les soins correctement remboursés ». À noter aussi : 4 des 8 positifs sont des copies d'idées de satisfaction générale (P61, P98, P303, P308).

Aucune citation déformée.

## Défauts hors résumé

- « Remboursement des médicaments » donné comme unanime dans « Ce qui bloque » : en fait deux camps opposés (rembourser plus : P52, P79, P121, P174… ; rembourser moins : P74 sur l'homéopathie, P187 sur les « médicaments inutiles »), ce que le champ `opposed` ne détecte pas.
- Même verbatim, ton différent selon le motif : P134 négatif (I0297) contre neutre (I0732).
- « Conscience du coût des soins » : la définition positive (« se juger bien informé du coût réel ») est vide, si bien que le « 5 sur 5 unanime » est mécanique ; le motif mêle prise de conscience et soupçon d'abus (P194, P308).
- Citations peu autonomes dans les listes : « Ce que proposent » choisit pour le Régime d'Alsace-Moselle la phrase de P327 qui commence par « Cela évitera… », sans son antécédent ; P166 « ceux qui ont voté ça » ; environ 30 fragments de moins de 25 caractères pris dans des réponses longues.
- Dans la synthèse du grand thème Complémentaires, le « lien automatique » Sécurité sociale-mutuelle est attribué à 13 critiques dont 5 parlent d'autre chose.
- Petits glissements : P268 dans le DMP ; P343 (deux examens refusés le même jour) rangé dans Niveau de prise en charge plutôt que dans les règles de remboursement ; P336 (agents hospitaliers et pharmaciens) dans Compétence des agents des caisses.
- Sur-représentation : faible (les 3 plus bavards portent 3 % des idées, le rapport le dit) ; P77 nourrit à lui seul deux signaux isolés (dépendance, prévention).

## Ce qui est solide

- Exactitude des verbatims (772 sur 773 exacts, la coupure est loyale) et correspondance P/ligne.
- Tous les chiffres, étiquettes et « fragile » sont cohérents avec les camps (13 recalculs sans écart).
- Les grandes conclusions tiennent : satisfaction générale très large (87 sur 90, P1 à P377 relus par sondage), contact avec les caisses, reste à charge sur l'optique et le dentaire, dépassements, coût des complémentaires.
- Minorités visibles (P40, P94, P162 contre le système ; P9, P97, P194 sur l'AME et la CMU ; les assurés favorisés par des contacts professionnels).
- « Hors question » transparent (17 idées de 9 personnes), méthode décrite avec ses limites.

## Temps de relecture humaine estimé

2 h 30 à 3 h : vérifier les camps de Télétransmission, Tiers payant et Niveau de prise en charge, réécrire « Ce qui divise » et deux synthèses de grands thèmes, remplacer quelques citations peu autonomes.

## Corrections de processus proposées (par ordre d'importance)

1. **Livre de codes : le manque d'un objet n'est pas une critique de l'objet** (erreurs 1 et 2, mitigés de P116 et P19). Ajouter à la consigne du livre de codes : « Le négatif est un jugement défavorable sur l'objet lui-même. Regretter que l'objet manque, ne soit pas proposé partout ou pas assez compte comme positif sur l'objet (ou va dans un motif "accès à…"). Celui qui veut supprimer ou restreindre l'objet est négatif, même s'il le dit sous forme de proposition. » Donner un exemple hors corpus et dire par quoi remplacer. Contrôle du code : avant d'afficher un motif dans « Ce qui divise », faire relire au moteur les seuls négatifs avec la question « conteste-t-il l'objet ou son absence ? » et recalculer ; journaliser les étiquettes avant et après (règle des étiquettes comparées par script).
2. **Relecture des tons : un changement qui contredit l'étiquette de l'idée ou le verbatim recopié ailleurs est refusé** (erreur 3, P134). Contrôle du code : (a) une même phrase recopiée dans deux motifs garde le même ton, sauf si les deux définitions l'exigent, et sinon l'écart est signalé ; (b) une relecture des tons qui change une étiquette du résumé (étiquette ou « fragile ») est soumise à une seconde lecture du moteur, sans garder l'avis du premier passage (2 des 10 changements de ton de ce passage sont faux, tous deux sur un motif du résumé).
3. **Oppositions entre critiques** (Remboursement des médicaments, P9 dans Niveau de prise en charge). Étendre la détection `opposed` aux idées négatives qui réclament des remèdes contraires (« rembourser plus » contre « rembourser moins »), pas seulement aux suggestions ; un motif unanime avec une opposition détectée passe dans « Ce qui divise », comme les Franchises.
4. **Un motif, un objet, un acteur** (Coordination entre organismes, Tiers payant). Consigne de regroupement : la définition nomme un seul objet ; si elle relie deux paires d'acteurs (caisse-mutuelle, caisse-caisse), on scinde. Contrôle : un motif à une personne dont l'idée répond à la définition d'un motif voisin y est rattaché (Outils des agents, Centres de remboursement, Place de la prévention).
5. **Citations autonomes** (P327, P166, P49, environ 30 fragments). Consigne d'extraction : l'extrait doit se comprendre seul, avec la tête d'une énumération (« Les insatisfactions : … ») ; le code de sélection des citations de « Ce que proposent » écarte celles qui commencent par une reprise (« Cela », « Elles », « leur ») quand une autre citation de la même personne existe.
6. **Découpage des bavards** (P6, P262, P150). Consigne : un même argument redit en plusieurs phrases reste une seule idée ; contrôle : signaler toute personne qui a plus de 3 idées de même ton dans un même motif.

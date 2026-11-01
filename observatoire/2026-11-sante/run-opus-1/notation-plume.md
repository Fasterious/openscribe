# Notation `plume` : « Le remboursement des soins vu par les assurés — Grand débat 2019 » (run-opus-1)

Champ noté : titres des thèmes et des grands thèmes, définitions (« Compte comme positif… »), synthèses, introductions des grands thèmes, résumé. Les verbatims, les lignes de chiffres et les phrases écrites par le code sont hors note (voir « Hors champ langue »).

| Critère | Note /10 | En bref |
|---|---|---|
| Naturel (aucun calque) | 8,5 | Presque aucun calque. Un vrai calque (« favorise le curatif sur le préventif »), des sujets à l'infinitif suivis d'un passif dans le résumé, des sigles courants écrits en toutes lettres qui sonnent administratif. |
| Précision (chaque phrase nomme son sujet) | 7,5 | Les synthèses de thème donnent presque toujours le chiffre et la base. Les introductions des grands thèmes retombent 2 fois dans « toutes les personnes » sans chiffre, et 2 introductions s'ouvrent sur une phrase sans sujet humain. Quelques pronoms ambigus. |
| Hiérarchie (l'essentiel d'abord) | 8 | Le résumé et les synthèses posent le constat chiffré d'abord. Deux introductions de grands thèmes s'ouvrent sur un sommaire (« D'autres remarques visent… ») au lieu du constat. |
| Concision | 7,5 | Les synthèses longues passent en revue chaque cas après un deux-points (5 à 6 éléments). Quelques phrases inutiles (« mentionne sa prise en charge à 100 % sans la juger »). Le 2e paragraphe du résumé enchaîne 6 passifs. |
| Cohérence du vocabulaire | 7,5 | L'échelle d'avis est bien appliquée, chiffre à côté. Écarts : sigles tantôt développés, tantôt non (« MSA » / « mutualité sociale agricole », « ALD » / « affection longue durée », « CMU » et « aide médicale de l'État » dans la même phrase) ; « notamment » irrégulier dans le résumé ; « personnes mitigées » (6 fois) ; « (avis partagés) » sans base une fois. |

**Note globale : 8/10**

Temps de relecture humaine estimé pour un rapport présentable : 30 à 40 minutes (introductions des grands thèmes et 2e paragraphe du résumé surtout).

## Défauts, du plus fréquent au plus rare

### 1. Sigles développés en toutes lettres, en désaccord avec les titres (8 occurrences)

- **Thème « Régimes particuliers (RSI, MSA) », synthèse** : `la mutualité sociale agricole fonctionne mal… 2 personnes se disent satisfaites de la mutualité sociale agricole` → `la MSA fonctionne mal… 2 personnes se disent satisfaites de la MSA` (le titre dit « MSA » ; le lecteur doit faire le lien seul).
- **Grand thème « Droits selon sa situation », introduction** : `supprimer l'aide médicale de l'État ou de réserver la CMU` → `supprimer l'AME ou réserver la CMU` (deux traitements dans la même phrase). Aussi : `affection longue durée` (4 fois, titre « Reconnaissance de l'ALD »), `chèque emploi service universel` (CESU), `couverture maladie universelle complémentaire` (CMU-C), alors que « CMU », « AME » et « MGEN » restent en sigle ailleurs.
- **Source** : `src/core/analysis/prompts.ts`, constante `STYLE.fr`, ligne « Les mots en entier hors des verbatims (« service après-vente », pas « SAV ») ». Le moteur l'applique au hasard. Remplacer par : « Un sigle courant (CMU, ALD, CAF) s'écrit en sigle, comme dans le titre du motif ; un sigle rare se développe une fois. » Ce défaut était déjà relevé sur l'étude École (défaut 29) : il n'a pas été corrigé à la source.

### 2. Personnes « mitigées » et connecteurs d'opposition répétés (6 + 10 occurrences)

- **Thème « Télétransmission », synthèse** : `4 personnes sont mitigées` → `4 personnes ont un avis mitigé` (la consigne le dit : ce sont les avis qui sont positifs ou négatifs, pas les personnes). Idem `Une personne est mitigée` (Rôle des complémentaires, Tiers payant), `Une personne mitigée trouve` (Facturation à l'hôpital), `2 sont mitigées` (Contact avec les caisses, Services en ligne).
- **Tous les thèmes** : `À l'inverse` (8 fois), `En face` (2 fois), `Par ailleurs` (3 fois) → varier ou supprimer quand le chiffre suffit.
- **Source** : `prompts.ts`, `STYLE.fr` (« Ce sont les avis qui sont positifs ou négatifs, pas les personnes ») : ajouter « une personne a un avis mitigé, jamais « est mitigée » », parce que le moteur ne relie pas la règle générale à ce mot. Pour les connecteurs, la règle « Varie les attaques de phrase » ne suffit pas : nommer les trois connecteurs dans la règle et donner leur remplacement (« Seules 4 personnes… », ou rien).

### 3. Énumérations exhaustives après un deux-points (6 synthèses)

- **Thème « Services en ligne », synthèse** : `pas de demande de remboursement sur internet, envoi postal même pour 3 €, consultation des remboursements pénible, choix limité pour écrire par le site, ou un système d'un autre âge` → `notamment l'impossibilité de demander un remboursement en ligne et l'envoi postal obligatoire, même pour 3 €` (5 cas pour 6 personnes : c'est la revue « une personne… une autre » sous une autre forme).
- **Thème « Facturation à l'hôpital », synthèse** : `carte de mutuelle ignorée, décompte absent à la caisse et facture reçue tard sous menace d'huissier pour l'une, frais désormais non remboursables pour l'autre` → `l'une pour une facture confuse, reçue tard sous menace d'huissier, l'autre pour des frais désormais non remboursables`. Même schéma : Complexité administrative, Indemnités journalières, Frais de transport médical, Régimes particuliers.
- **Source** : `prompts.ts`, `summarizePrompt`, règle 5 (« regroupe ce qui va ensemble au lieu de passer chaque personne en revue »). La règle interdit la forme, pas la liste. Ajouter : « Après un deux-points, 3 exemples au plus, les plus partagés. »

### 4. « Toutes les personnes » sans chiffre dans les introductions des grands thèmes (2 introductions, 6 thèmes)

- **Grand thème « Arrêts, maladies longues, dépendance », introduction** : `Indemnités journalières, frais de transport et accidents du travail sont critiqués par toutes les personnes qui en donnent un avis` → `Les 8 personnes qui donnent un avis sur les indemnités journalières les critiquent, comme les 7 qui parlent des frais de transport (unanimes) et les 3 qui parlent des accidents du travail` (pas de chiffre ; et ce sont les accidents eux-mêmes qui semblent « critiqués », non leur prise en charge).
- **Grand thème « Droits selon sa situation », introduction** : `Toutes les personnes qui donnent un avis critiquent la couverture liée à l'étranger, le rattachement des enfants et le régime étudiant` → `Les 6, 5 et 4 personnes qui donnent un avis critiquent, sans exception, la couverture à l'étranger, le rattachement des enfants et le régime étudiant (unanime)`.
- **Source** : `prompts.ts`, `themePrompt`, règle 3. C'est le même défaut que sur l'étude École (règle à retenir de cette notation) : la règle « Quand tu annonces un nombre de personnes… » n'interdit pas « toutes les personnes ». Ajouter : « « toutes les personnes » s'écrit avec son chiffre (« les 8 personnes qui donnent un avis ») », avec un exemple chiffré pris hors du corpus.

### 5. « Notamment » irrégulier dans le résumé (6 phrases sur 12)

- **Résumé, 1er paragraphe** : `Les services en ligne sont appréciés par 18 sur 26 (majorité ; P67)` → `(majorité ; notamment P67)` ; même chose pour `17 sur 29 (… ; P263)`, `15 sur 15 (… ; P27)`, `14 sur 14 (… ; P16)`, `20 sur 24 (… ; P22)`, `13 sur 13 (… ; P67)`, alors que `27 des 36 personnes (… ; notamment P1)` et `Les 24 personnes… (notamment P8)` l'ont.
- **Source** : code, `src/core/analysis/report.ts`, `claimedPeople` : l'expression régulière exige le nom (« personnes ») après « N sur M ». Une forme elliptique « 18 sur 26 » n'est donc pas comptée et « notamment » disparaît. Accepter `\b(\d+) sur (\d+)\b` sans nom, et ajouter un test sur ce cas.

### 6. Le 2e paragraphe du résumé : passifs en cascade et verbes sous-entendus (1 paragraphe, 6 phrases)

- **Résumé** : `Le coût des complémentaires santé est dénoncé par 15 sur 15 (unanime ; P27), les dépassements d'honoraires par 14 sur 14` / `Quant à la lisibilité des remboursements, elle est critiquée par 13 sur 13` → `Les 15 personnes qui donnent un avis sur le coût des complémentaires santé le jugent trop élevé (unanime ; notamment P27), comme les 14 qui parlent des dépassements d'honoraires (unanime ; notamment P16)`.
- **Résumé, 3e paragraphe** : `Montrer aux assurés ce que coûtent leurs soins est l'idée de 4 personnes` / `Mieux rembourser les soins dentaires… est réclamé par 4 personnes` → `4 personnes proposent de montrer aux assurés ce que coûtent leurs soins` / `4 autres demandent de mieux rembourser…` (sujet à l'infinitif, puis passif : tournure traduite).
- **Source** : `prompts.ts`, `globalPrompt`, règle 1 (« Ne mets pas plus d'un chiffre par phrase ») et `STYLE.fr` (« Nombres en chiffres, en tête de phrase aussi ») : le moteur évite de commencer par un chiffre en retournant la phrase au passif. Ajouter à `globalPrompt` un exemple de phrase active qui commence par le chiffre (« 4 personnes proposent… »).

### 7. Ouvertures sans sujet humain ni constat (2 introductions)

- **Grand thème « Organisation du système de santé », introduction** : `D'autres remarques visent l'organisation du système lui-même : son financement, le parcours de soins, la place de la prévention` → `Les 5 personnes qui donnent un avis sur le coût des soins déplorent que les patients l'ignorent, voire en abusent` en première phrase (la phrase actuelle est un sommaire et ne dit rien).
- **Grand thème « Droits selon sa situation », introduction** : `Les situations qui sortent du cas général compliquent l'accès aux droits` → ouvrir par le constat chiffré (défaut 4). Le titre `Droits selon sa situation` sonne aussi faux (« sa » sans antécédent) → `Droits selon la situation` ou `Situations particulières`.
- **Source** : `prompts.ts`, `themePrompt`, règle 3 (« Elle tranche au lieu d'énumérer ») ; `STYLE.fr` dit déjà « Chaque constat a un sujet humain ». Ajouter à la règle 3 : « La première phrase est un constat chiffré, jamais une liste des sujets du thème. »

### Défauts isolés (une occurrence chacun)

8. **Grand thème « Traitement des remboursements », introduction** : `14 personnes saluent des remboursements rapides, souvent en progrès, quand 18 les jugent trop longs` → `14 personnes saluent des remboursements rapides, 5 d'entre elles un progrès récent ; 18 jugent les délais trop longs` (« les » reprend « remboursements rapides » : contresens grammatical).
9. **Thème « Médecines douces », synthèse** : `une logique financière de court terme qui favorise le curatif sur le préventif` → `qui privilégie le curatif au détriment de la prévention` (calque de « favor X over Y »).
10. **Thème « Dossier médical partagé », synthèse** : `mais sa mise en place en déçoit 3 (P…). Elles y voient une « excellente initiative »` → `Les 4 premières y voient une « excellente initiative »` (« Elles » reprend d'abord les 3 déçues ; et les 3 avis négatifs ne sont pas décrits).
11. **Thème « Coordination entre organismes », synthèse** : `En face, 13 personnes (avis partagés) critiquent` → `13 des 25 personnes qui donnent un avis critiquent… (avis partagés)` (seul thème où l'étiquette vient sans sa base).
12. **Thème « Niveau de prise en charge », synthèse** : `D'autres raisons reviennent : un reste à charge trop lourd pour 3 personnes` → `D'autres reproches reviennent :` (ce ne sont pas des raisons, ce sont d'autres formes de la même critique).
13. **Thème « Prise en charge à 100 % », synthèse** : `Une personne mentionne sa prise en charge à 100 % sans la juger (P…)` → supprimer (phrase de méthode, qui ne dit rien au lecteur).
14. **Thème « Lutte contre la fraude », synthèse** : `l'autre de la remettre en cause, sur le modèle de la carte d'identité électronique belge` → `l'autre de la remplacer par une carte d'identité électronique, sur le modèle belge` (« remettre en cause sur le modèle de » ne dit pas ce qui est proposé ; à vérifier sur le verbatim).
15. **Thème « Reconnaissance de l'ALD », synthèse** : `jusqu'à 6 mois au téléphone` → `jusqu'à 6 mois de relances téléphoniques` (se lit d'abord comme 6 mois en ligne).
16. **Thème « Service des mutuelles », synthèse** : `La MGEN revient chez 11 d'entre elles` → `11 d'entre elles citent la MGEN`.
17. **Thème « Fonctionnement d'ensemble », synthèse** : `et 1 personne rappelle` → `et une personne rappelle` (partout ailleurs, « une personne » : 21 fois).
18. **Thème « Couverture à l'étranger », synthèse** : `que la sécurité sociale suive les Français` → `que la Sécurité sociale suive…` (majuscule partout ailleurs).
19. **Thème « Conscience du coût des soins », définition** : `déplorer que les assurés ignorent ou abusent du coût des soins` → `déplorer que les assurés ignorent le coût des soins ou en abusent` (on abuse des soins, pas de leur coût).
20. **Définitions « Frais de transport médical », « Reconnaissance de l'ALD »** : `subir refus, exigences ou lenteurs`, `subir lenteurs, refus ou dossiers à refaire` → `subir des refus, des exigences ou des lenteurs` (style télégraphique ; les autres définitions ont leurs articles).
21. **Grand thème « Arrêts, maladies longues, dépendance », introduction** : `les démarches pour y accéder ou pour être indemnisé pèsent` → `pèsent lourd` (verbe sans complément).
22. **Grand thème « Carte Vitale et services numériques », introduction** : `d'où des demandes d'obligation et de dématérialisation plus poussée` → `3 personnes demandent d'obliger les praticiens à accepter la carte Vitale, 4 d'aller plus loin dans la dématérialisation` (nominalisations, pas de chiffre, et « d'où » pose une cause que les participants n'ont pas formulée).

## Hors champ langue, à transmettre

- **Phrases du code (résumé)**, toujours pas corrigées depuis l'étude École : `Les avis sont partagés sur 3 sujets` et `3 autres sujets divisent aussi` → `3 thèmes` (lexique du projet) ; `parmi les 32 participants qui donnent un avis` dans un résumé qui dit partout « personnes ». Source : `src/core/analysis/pipeline.ts`, lignes 1766, 1787 et 1794.
- **Première phrase du résumé** : `87 personnes portent un jugement positif d'ensemble…, que certaines nuancent ailleurs` reprend mot pour mot le gabarit de `src/core/analysis/methods.ts`, règles 8 et 10. La base (« 87 des 90 ») manque alors que toutes les autres phrases du résumé la donnent, et « portent un jugement positif d'ensemble » est lourd. Corriger l'exemple de la consigne (le moteur suit l'exemple) : `Pour 87 des 90 personnes qui donnent un avis, le remboursement des soins fonctionne bien dans l'ensemble, même si certaines le nuancent ailleurs`. Cette décision de formulation touche la méthode : la soumettre au `methodologue`.
- **Pour le `methodologue`** (fidélité, pas langue) : dans l'introduction « Complémentaires santé », `7 contestent leur place dans le système` ne dit pas si ces 7 font partie des 15 qui critiquent le prix. Dans « Rôle des complémentaires santé », « 7 personnes proposent une fusion… » et « 2 autres » : vérifier que les 7 critiques et les 7 propositions ne se confondent pas dans l'introduction.

## Règle à retenir

Une règle de style formulée en général (« pas les personnes », « varie les attaques », « regroupe ») n'empêche pas le moteur de la contourner sous une autre forme : la consigne doit nommer le mot fautif et son remplacement (« une personne a un avis mitigé », « 3 exemples au plus après un deux-points »). Les défauts qui reviennent ici (sigles, « toutes les personnes », phrases du code) étaient déjà notés sur l'étude École : il faut les corriger dans `prompts.ts`, `report.ts` et `pipeline.ts` avant la prochaine passe, pas les relever une troisième fois.

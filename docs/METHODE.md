# La méthode, étape par étape

Ce document explique ce que fait OpenScribe quand il analyse des réponses : les six grandes étapes que
l'on voit dans l'application, et ce qui se passe à l'intérieur de chacune. C'est la couche d'explication
au-dessus du code. Le code reste la référence exacte (`src/core/analysis/`) ; l'historique des essais et
des notes est dans `docs/METHODES.md`, la grille de notation dans `docs/NOTATION.md`.

À tenir à jour à chaque changement de méthode : une étape ajoutée ou retirée se décrit ici le jour même.

## Le principe

**Le moteur d'IA propose, le code vérifie.** Le moteur lit, découpe, nomme et rédige. Le code vérifie
chaque citation mot pour mot, range chaque idée, compte les personnes et calcule tous les chiffres. Aucun
chiffre du rapport ne vient du moteur.

**On compte des personnes, pas des mentions.** Une personne qui revient dix fois sur le même sujet compte
une fois dans ce motif.

**Une seule méthode, la méthode commune** (décision d'Arnaud, 25/10/2026). Mise au point sur une consultation
publique (l'étude école de l'Observatoire, sous le nom « consultation »), elle sert aussi à toute nouvelle synthèse,
quel que soit le moteur : seul un réglage (taille des lots, exemple de consigne) s'adapte au moteur. Ses contrôles de
rangement, ajoutés à la méthode de référence d'origine, sont signalés plus bas par « consultation ». Les synthèses
enregistrées avec la méthode de référence la gardent.

## 1. Découper en idées

Le moteur lit chaque réponse et la découpe en **idées** : une idée est un avis sur un seul objet, appuyé
sur un extrait exact de la réponse (le **verbatim**). Il donne à chaque idée un libellé court et un ton :
positif, négatif, suggestion, question ou constat.

Le code vérifie que chaque verbatim figure mot pour mot dans la réponse. Une citation approximative est
renvoyée au moteur pour être corrigée ; si elle reste introuvable, l'idée est écartée et comptée dans la
section Méthode. Deux idées qui citent le même passage sont dédoublonnées. Avec la méthode
« consultation », un éloge et une critique qui se recouvrent restent deux avis : « l'accueil est très bien,
mais les horaires sont impossibles » donne une idée positive et une idée négative.

## 2. Regrouper en motifs

C'est l'étape la plus longue, et celle où se jouent la plupart des erreurs.

- **Proposer les motifs.** Le moteur lit les libellés des idées par lots et propose des **motifs** : un motif
  rassemble ce que les participants disent d'un même objet (« Attente en caisse »), jamais un jugement
  (« Critiques »). Les idées restantes sont ensuite rangées dans ces motifs.
- **Consolider.** S'il y a trop de motifs pour le nombre de personnes, le moteur propose des fusions de motifs
  qui traitent le même objet ; un motif d'une seule personne peut être rattaché à un motif plus large.
- **Séparer.** Un titre qui réunit deux objets (« Accueil et horaires ») est soumis à la question « un ou
  deux objets ? ». Avec « consultation », la question vaut aussi pour un titre « X face à Y » et pour un
  motif aux avis partagés d'au moins 8 personnes.
- **Relire les motifs.** Le moteur relit chaque motif : il déplace une idée qui parle d'un autre objet, et
  corrige un ton jugé par rapport au mauvais objet. Il tranche le cas des personnes qui disent du bien et du
  mal d'un même motif : soit c'est le même objet et la personne est vraiment mitigée, soit ce sont deux objets
  et une idée change de motif.
- **Livre de codes** (« consultation »). Avant de juger les idées d'un motif, le moteur écrit sa définition :
  ce qui y compte comme positif, comme négatif, et ce qui ne compte pas comme un avis. Cette définition
  s'affiche sous le titre du motif dans le rapport : chaque rangement devient vérifiable, et contestable.
- **Seconde relecture** (« consultation »). Les motifs qui ont reçu une idée déplacée sont relus une
  seconde fois : au premier tour, chaque lot ne voyait pas les motifs ouverts par les autres lots.
- **Réconciliation** (« consultation »). Toutes les définitions sont relues d'un bloc. Le moteur propose des
  fusions (deux motifs, un même objet) et des règles de partage entre motifs voisins ; jusqu'à 8 paires sont
  relues ensemble avec leur règle. Le code applique les fusions par le titre des motifs.
- **Balayage par définition** (« consultation »). Chaque motif promis au résumé (une vingtaine au plus) est
  confronté, avec sa définition, à tous les avis rangés ailleurs : le moteur y cherche les avis que la
  définition réclame, et corrige les tons qui la contredisent. Le code n'accepte que ces deux gestes, jamais un
  changement de proposition ou de question.
- **Codage en double** (activé par défaut depuis le 25/10, comme pour l'étude école ; le chercheur peut le décocher). Une idée qui répond à la définition de
  deux motifs (la cause chez l'un, l'effet chez l'autre) compte dans les deux, par une copie. Deux motifs au
  plus par idée ; chaque motif compte des personnes, aucune deux fois. Sans l'option, l'idée va dans un seul
  motif, ou change de motif.
- **Hors question** (« consultation »). Une idée sans rapport avec la question posée sort des motifs ; le
  rapport la liste à part.

Le code garantit à chaque tour que chaque idée est rangée une fois (deux avec le codage en double), qu'aucune
copie ne finit dans le motif de son original, et que les motifs sont renumérotés sans perdre une fusion.

## 3. Synthétiser chaque motif

Le code calcule les chiffres de chaque motif : personnes, avis positifs, négatifs, mitigés, propositions,
et l'**échelle d'avis** : unanime, large majorité (80 % et plus), majorité (plus de la moitié), pas de
majorité, avis partagés (deux camps proches, ou autant de mitigés que le camp le plus fort), peu d'avis (moins
de 4). Le chiffre est toujours donné à côté du mot.

Le moteur rédige ensuite une synthèse de deux à quatre phrases par motif, en citant ses idées par leur
identifiant ; le code les transforme en renvois vers les personnes (« P12, P14 »). Le moteur signale aussi
deux propositions qui vont en sens contraire ; le code vérifie qu'elles viennent de deux personnes
différentes et du même motif.

## 4. Dégager les grands thèmes

S'il y a beaucoup de motifs, le moteur les réunit en une dizaine de thèmes et rédige une courte
introduction pour chacun. Un thème rapproche des motifs voisins ; on n'y additionne jamais les avis.

## 5. Écrire le résumé

Le code prépare les listes « Ce qui a marché », « Ce qui bloque », « Ce qui divise », « Ce que proposent
les participants » et « Questions soulevées » : des motifs classés par le code, avec leurs chiffres. Les deux premières
montrent aussi, après les autres, les motifs à 2 ou 3 avis dont un camp l'emporte, avec « peu d'avis » (25/10). Le
moteur rédige le résumé à partir de ces listes et des synthèses : sa première phrase dit qui pense quoi, en
nombre de personnes (le jugement d'ensemble, puis la critique ou l'éloge le plus partagé), jamais un compte global
des critiques. Le code vérifie que chaque nombre du résumé correspond à un chiffre calculé ; sinon la phrase est
signalée « à vérifier » ou retirée.

Dans l'application, chaque ligne des listes donne la phrase qui ouvre la synthèse de son motif, puis un bouton
❝ N qui déroule les verbatims des N participants comptés. Dans le résumé, un bouton qui suit un nombre
(« 46 personnes… ❝ 46 ») déroule tout le camp compté, pas seulement les exemples cités ; sinon, il déroule les
idées citées. Les verbatims viennent en appui de ce qu'on lit, jamais choisis au hasard.

## 6. Relire la langue

Le moteur relit les synthèses, les introductions et le résumé pour qu'ils se lisent naturellement. Le code
refuse toute réécriture qui perd un renvoi ou change un chiffre. Le moteur vérifie ensuite que chaque phrase
s'appuie bien sur les verbatims qu'elle cite, et corrige les renvois ; une phrase dont un nombre ou un compte
n'est pas appuyé est retirée par le code. Quelques règles d'écriture sont appliquées par le code, pas par le
moteur : tout compte de personnes s'écrit en chiffres, en tête de phrase comme ailleurs (« 46 personnes… »,
décision d'Arnaud du 17/10, pour la précision) ; « une personne » reste en lettres.

## Ce que le rapport signale lui-même

- **« fragile »** : une seule voix qui change d'avis changerait la conclusion (« large majorité, fragile »). Pas
  sur un « unanime » : une voix de moins en fait une « large majorité », la conclusion tient.
- **« à vérifier »** (Synthèse seulement : l'Observatoire, publié sans intervention humaine, ne l'affiche pas) : l'étiquette dépend d'avis comptés aussi dans un autre motif ; sans eux, elle serait
  différente. Le rapport dit laquelle, et une ligne sous le résumé rappelle ces étiquettes avant qu'on le
  cite. C'est au lecteur de trancher, en relisant les citations.
- **« minorité constante »** : au moins 2 personnes, au plus un quart des avis, à contre-courant sur le motif.
- **Au survol** (et au clavier), chaque marque de méthode s'explique : les étiquettes d'avis, « fragile »,
  « à vérifier », la minorité et les limites disent ce qu'elles veulent dire, pourquoi la méthode les pose et,
  s'il le faut, quoi faire. Les textes sont dans `src/core/analysis/glossary.ts` ; le rapport exporté les porte
  en attribut `title`. Au toucher, les mêmes explications se lisent dans la section Méthode.
- **La section Méthode** dit ce qui a été fait sur ces données : idées écartées, déplacées, fusions,
  copies, phrases retirées, réponses identiques entre personnes, part des trois personnes les plus prolixes.

## Les limites

Une même idée peut relever de plusieurs motifs selon la façon dont on la lit, se découper autrement, ou se
ranger dans un motif plus large ou plus fin. Deux lecteurs humains ne trancheraient pas toujours de la même
façon. Le moteur tranche ces cas ; la méthode ne vise pas zéro erreur, elle rend chaque choix vérifiable et
montre où le doute est permis. Sur l'étude école (passe 13, finale), deux relectures indépendantes donnent 7/10
à la méthode et trouvent deux phrases fausses dans le résumé, sur des motifs déjà marqués « à vérifier » ; la
langue est notée 6,5/10.

## Fidélité à la méthode d'origine

La méthode des idées atomiques d'Arnaud (`docs/VISION.md`, 11-12/10) est le point de départ. Ce tableau dit,
point par point, ce qui est gardé, ce qui la prolonge, et ce qui s'en écarte. Un écart n'est pas une erreur ;
il doit être visible et daté.

| Méthode d'origine | Aujourd'hui | Statut |
|---|---|---|
| Personne par personne, des idées atomiques : un sujet, un ton, la citation exacte | Étape 1, citation vérifiée mot pour mot par le code | Gardé |
| Cinq catégories : positif, négatif, suggestion, question, constat | Identiques ; seuls positif et négatif sont des avis | Gardé |
| Idées regroupées en motifs, avec titre, comptage de personnes par ton et synthèse appuyée sur les citations | Étapes 2 et 3 | Gardé |
| Le motif est défini par son titre | Chaque motif a aussi une définition écrite (livre de codes) qui fixe ce qui compte comme positif ou négatif | Prolongé (16/10) |
| Une idée va dans un motif | Toujours vrai par défaut. Avec l'option du chercheur (codage en double, désactivée par défaut), une idée peut compter dans deux motifs ; sans l'option, le balayage ne fait que déplacer des idées | Modifié, en option (16/10, décision d'Arnaud) |
| Des motifs aux thèmes, facultatif | Seulement s'il y a beaucoup de motifs | Gardé |
| Mode libre par défaut, grille imposée possible | Identique | Gardé |
| Pas de normalisation obligatoire des libellés | Identique | Gardé |
| Séquençage en étapes, pour les points de contrôle et la traçabilité | Les six étapes, inchangées. Avec « consultation », l'étape 2 (des idées aux motifs, avant les thèmes) relit les motifs plusieurs fois au lieu d'une : livre de codes, seconde relecture, réconciliation, balayage. Tout se fait dans une seule analyse | Gardé ; plus long avec « consultation » |
| Comptages par ton | Échelle d'avis, « fragile », « à vérifier », tous calculés par le code | Prolongé (13/10, 17/10) |

## Une référence pour repenser la méthode

Ce document fixe une méthode de référence, éprouvée par l'humain et la machine sur des corpus réels. Il
servira un jour de point de comparaison : on pourra laisser un moteur imaginer librement une autre façon de
comprendre les consensus, les dissensus et les avis d'une population, puis la mesurer contre celle-ci, avec la
même grille, sur les mêmes corpus (l'école, ÉcoSol). Elle gagnera, ou la référence restera.

## Où se trouve quoi dans le code

| Étape | Fichier |
|---|---|
| Enchaînement des étapes, contrôles | `src/core/analysis/pipeline.ts` |
| Consignes envoyées au moteur | `src/core/analysis/prompts.ts` |
| Règles propres à chaque méthode | `src/core/analysis/methods.ts` |
| Chiffres et échelle d'avis | `src/core/analysis/metrics.ts` |
| Listes du résumé, « à vérifier », « fragile » | `src/core/analysis/highlights.ts` |
| Explications au survol des marques de méthode | `src/core/analysis/glossary.ts` |
| Rapport et section Méthode | `src/core/analysis/report.ts` |

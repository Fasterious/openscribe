---
name: rediger
description: Rédiger les synthèses des motifs, les grands thèmes et le résumé, avec des renvois exacts, puis vérifier les renvois et relire la langue. À charger avant le premier appel à « outil ecrire ». Le guide de style est dans style.md, à côté.
---

# Rédiger le rapport

Le rapport est lu par le grand public. Les chiffres sont calculés par le code : `outil voir motif G3` donne la ligne de
chiffres d'un motif (ses « facts »), `outil voir listes` les listes classées par le code pour le résumé. Tu ne calcules aucun
autre chiffre. Lis aussi `style.md` (dans ce dossier) avant d'écrire la première synthèse.

## 1. Synthèse de chaque motif

Pour chaque motif, une synthèse de 2 à 4 phrases, fidèle aux citations du motif.

1. Appuie-toi EXCLUSIVEMENT sur les citations du motif. N'interprète pas au-delà. Pèse les personnes, pas le nombre de
   citations : une personne qui s'exprime longuement ne compte pas plus qu'une autre.
2. Les chiffres sont déjà calculés dans la ligne du motif : reprends-les tels quels, n'en calcule pas d'autres.
3. Parle de personnes (« 6 personnes »), pas de « verbatims ».
4. Fais apparaître les désaccords et les avis minoritaires quand il y en a, y compris entre propositions qui vont en sens
   contraire (« 2 pistes s'opposent : … »).
5. Dis l'essentiel en trois ou quatre phrases : regroupe ce qui va ensemble au lieu de passer chaque personne en revue. Donne
   le nombre exact de personnes derrière chaque affirmation (« d'autres » pour une seule personne est faux).
6. Après chaque affirmation, cite entre crochets les identifiants des idées qui la fondent, par exemple [I0004, I0017]. Le
   crochet ne cite que des idées qui disent ce que dit la phrase.
7. N'écris « avis nuancé » à propos d'une personne que si elle dit vraiment du bien et du mal du même objet. Chaque camp
   compté (positifs, négatifs, mitigés) apparaît dans la synthèse. Le constat se dit au même degré que les chiffres : 7
   critiques sur 10, c'est « la livraison est jugée trop lente », pas « inégale ». Ne sous-entends jamais un verbe quand
   l'objet seul dirait le contraire du reproche (« une autre, une application rarement mise à jour », pas « une autre, la
   mise à jour de l'application »).
8. "opposed" : si deux propositions ("suggestion") de deux personnes différentes vont en sens contraire sur ce motif
   (« rendre l'adhésion gratuite » contre « augmenter l'adhésion pour financer plus de services »), donne leurs identifiants
   et ce sur quoi elles s'opposent : [{"a":"I0012","b":"I0040","about":"le prix de l'adhésion"}], "about" étant un groupe
   nominal (« le classement des élèves »), jamais une phrase ni un verbe. Deux propositions différentes ne sont pas opposées :
   il faut qu'on ne puisse pas faire les deux. Sinon, liste vide.
9. Ne montre pas tes comptes : pas de « dont une des précédentes », « dont deux déjà citées », « parmi elles ». Chaque
   affirmation donne son propre nombre de personnes ; le lecteur retrouve les personnes dans les renvois.
10. Pour les personnes d'un motif, écris un nombre : jamais « les participants », « la plupart », « des personnes »,
    « beaucoup », ni un sujet collectif sans nombre (« ceux qui… », « les familles », « les témoignages ») ; « toutes les
    personnes » s'écrit avec son nombre (« les 9 personnes qui donnent un avis »). La base se dit toujours « qui donnent un
    avis », jamais « qui en parlent ». La première phrase dit ce qui est jugé et comment ; elle peut donner le nombre du camp
    principal, avec le mot de l'échelle entre parenthèses juste après le chiffre (« les horaires de la piscine sont critiqués
    par 17 des 19 personnes qui donnent un avis (large majorité) ») ; elle ne généralise jamais sans nombre (« Ceux qui en
    parlent la jugent bonne » est faux dès qu'une personne pense autrement). Le mot de l'échelle n'entre jamais sans son
    nombre. Chaque camp d'avis se dit avec le nombre de ses personnes et ses raisons principales : un exemple ne remplace pas
    le compte. Nombres toujours en chiffres, en tête de phrase aussi (« 2 personnes estiment », « 2 pistes s'opposent ») ;
    pas deux phrases de suite qui commencent par un chiffre. Une critique porte sur un objet : on ne « reproche » pas un objet
    (« 7 personnes critiquent les délais », pas « les délais sont reprochés ») ; pas de « côté éloges » ni « côté
    propositions ». N'ouvre pas deux synthèses par la même tournure. Au plus un point-virgule par phrase. Une personne qui dit
    du bien et du mal du même objet est « mitigée », jamais « partagée » (« avis partagés » désigne un motif, pas une
    personne).
11. Un motif d'une seule personne se dit en une phrase, avec un seul crochet.
12. La définition du motif dit ce qui compte comme favorable, défavorable ou hors camp : la synthèse n'appelle éloge,
    satisfaction ou critique que ce que cette définition désigne ainsi, et décrit une idée hors camp sans la ranger dans un camp.

## 2. Grands thèmes

Rassemble les motifs en grands thèmes (`outil voir motifs` donne le nombre attendu).

1. Chaque motif appartient à EXACTEMENT un thème.
2. Un thème rapproche des motifs dont les sujets sont voisins : ils concernent la même partie du service ou la même
   expérience. Les deux faces d'un même objet vont dans le même thème. Les propositions restent avec l'objet qu'elles visent.
   Ne réunis pas des motifs parce qu'ils sont petits ou de même ton, et évite le thème fourre-tout. Si le titre a besoin de
   « et » pour relier deux sujets sans rapport, fais deux thèmes. Titre court (2 à 6 mots) qui nomme ce que les motifs ont
   en commun.
3. Pour chaque thème, une synthèse de 3 ou 4 phrases construite à partir des synthèses de ses motifs, sans rien ajouter. Elle
   tranche au lieu d'énumérer : ce qui a marché, ce qui a freiné, ce que les participants demandent. Si deux motifs ou deux
   propositions vont en sens contraire, dis-le. Varie les tournures d'un thème à l'autre. Cite au plus trois exemples et ne
   passe pas en revue tous les motifs. Un seul crochet par phrase, repris des synthèses des motifs, qui peut contenir
   plusieurs identifiants ; n'en invente pas. Quand tu annonces un nombre de personnes, le crochet contient une idée de chacune
   d'elles ; sinon, écris « une personne » ou ne donne pas de nombre. N'oppose deux motifs (« à l'inverse », « en revanche »)
   que s'ils jugent le même objet de façon contraire. Une même personne peut figurer dans plusieurs motifs : ne la compte pas
   deux fois. Ne recopie pas la première phrase d'un motif.
4. N'écris jamais « les participants » ni « la plupart des participants » pour les personnes d'un motif ; écris le nombre de
   personnes, jamais « la plupart », ni un mot de l'échelle sans son nombre, ni un sujet collectif sans nombre (« les
   familles », « les témoignages », « ceux qui… »), qui ferait un faux consensus.
5. La synthèse du thème relie ses motifs : ce qu'ils ont en commun, ce qui les distingue. Elle ne recopie aucune phrase d'une
   synthèse de motif, même reformulée de près : le lecteur les lit juste en dessous. Aucun lien de cause que les participants
   n'ont pas formulé.

## 3. Résumé

Le résumé exécutif, en trois paragraphes courts séparés par une ligne vide : ce qui a marché ; ce qui a freiné, bloqué ou
divisé ; ce que demandent les participants et les questions qu'ils se posent. Le troisième paragraphe ne manque jamais quand
il y a des propositions : il commence par les premières, les plus partagées. 6 à 9 phrases en tout. Appuie-toi sur
`outil voir listes`, établi par le code, et sur les synthèses des thèmes pour le sens. Raconte : le lecteur doit comprendre
en une minute ce que les participants retiennent.

1. Un chiffre qualifie un motif entier, tel qu'il figure dans les listes (« 4 des 5 participants qui donnent un avis »),
   jamais un détail cité par une seule personne. N'attache à ce chiffre aucune précision que tous ne partagent pas : « 6 des
   7 participants critiquent les délais de livraison », pas « 6 des 7 disent que leur colis est arrivé abîmé ». Pas d'autre
   chiffre, pas d'addition entre motifs. Ne mets pas plus d'un chiffre par phrase.
2. Chaque affirmation tirée d'une liste cite la référence de sa ligne (« ref », donnée par `outil voir listes`), entre
   crochets, et aucune autre : [I0042].
3. Les participants ont répondu à des questions qui orientent : l'absence de critique n'est pas un accord. Ne parle ni
   d'unanimité, ni de « tout le monde ».
4. N'écris rien sur les sujets de « Ce qui divise » : le code ajoute lui-même, à la fin du deuxième paragraphe, la phrase qui
   les nomme tous.
5. Quand un sujet ne repose que sur une ou deux personnes, dis-le. Pour une question ou une proposition, rapporte ce que dit
   le verbatim, pas le titre du motif où elle est rangée.
6. Aucune remarque de méthode. N'ajoute rien qui ne figure pas dans les données ; aucun lien de cause que les participants
   n'ont pas formulé. Résume, ne recopie pas les phrases des synthèses.
7. Chaque ligne de « Ce qui a marché » et « Ce qui bloque » se dit avec son nombre de personnes, le mot de l'échelle d'avis
   entre parenthèses juste après le chiffre, sans incise (« les horaires de la piscine sont critiqués par 17 des 19 personnes
   qui donnent un avis (large majorité) », « le stationnement, par 12 sur 15 (large majorité, fragile) »). La base se dit une
   fois par paragraphe, à sa première ligne, toujours « qui donnent un avis » ; ensuite le nombre suffit (« 12 sur 15 »,
   « les 14 »). N'écris jamais « une large majorité » sans son nombre, ni « tout le monde ». Varie les attaques d'une phrase
   à l'autre : l'objet en sujet, le verbe, le nombre ; pas deux phrases de suite sur le même moule. Deux lignes voisines
   peuvent partager une phrase, chacune avec son objet nommé, son nombre et son mot (la limite d'un chiffre par phrase de la
   règle 1 ne s'applique pas à elles ; le reste de la règle 1 s'applique) : le résumé peut alors compter jusqu'à 12 phrases.
8. Un motif d'appréciation d'ensemble (« Expérience globale », « Bilan ») ne recueille que des jugements généraux, parfois de
   personnes qui décrivent ailleurs des difficultés : ne le présente pas comme l'avis de la plupart, ni par le mot de
   l'échelle ; dis « N personnes portent un jugement positif d'ensemble, que certaines nuancent ailleurs », jamais « aucune
   difficulté ». S'il réunit le plus de personnes, il ouvre le résumé.
9. Pour une proposition, nomme ce que proposent toutes les personnes comptées (l'exemple n'est que le verbatim de l'une
   d'elles), sans détail que porte une seule personne. Une raison ou une précision n'accompagne le chiffre d'un motif que si
   chaque personne comptée la donne. Une phrase d'annonce (« L'accès au service concentre les critiques : ») ne couvre que
   les motifs qu'elle annonce.
10. La première phrase du résumé dit, en nombre de personnes, ce que les participants pensent de l'objet de la question : le
    jugement d'ensemble (règle 8) s'il existe, puis la critique ou l'éloge le plus partagé (« 31 personnes portent un
    jugement positif d'ensemble sur la médiathèque, que certaines nuancent ailleurs ; la critique la plus partagée vise les
    horaires : 29 des 35 personnes qui donnent un avis (large majorité) »). Pas de compte global des critiques ou des
    satisfactions. Ne conclus pas que l'avis est positif ou négatif dans l'ensemble. Tous les chiffres viennent des lignes
    des listes. Le mot de l'échelle porte sur le ton du motif, jamais sur un détail que tous ne disent pas. Une ligne marquée
    « fragile » garde ce mot dans la parenthèse (« (large majorité, fragile) »).

## 4. Vérifier les renvois

Avant de finaliser, relis chaque phrase écrite : les idées citées disent-elles bien ce que dit la phrase (le bon sujet, la
bonne personne, le bon nombre de personnes, le bon ton) ? Corrige le renvoi ou la phrase ; retire une phrase qu'aucune idée
ne fonde. Une phrase qui met une personne dans un camp contraire à la définition du motif est fausse et se récrit. Une phrase
du résumé qui reprend un chiffre de motif ne cite qu'un exemple : c'est normal ; vérifie seulement que la précision ajoutée
au chiffre vaut pour ce motif entier.

## 5. Relire la langue

Relis les synthèses, les thèmes et le résumé pour qu'ils se lisent comme écrits directement en français par un professionnel.
Ne change pas le sens, garde tous les chiffres et tous les crochets accrochés à la même affirmation. Pour attribuer un
constat, ne remplace jamais un nombre ou un mot de l'échelle déjà écrit, et n'écris pas « des personnes » : reprends le sujet
déjà nommé (« ces 6 personnes », « ceux qui parlent des horaires »).

## Avec l'outil

```json
{"syntheses":[{"motif":"G3","texte":"…[I0004, I0017]…","opposed":[]}],
 "themes":[{"titre":"…","motifs":["G1","G4"],"texte":"…"}],
 "resume":"…\n\n…\n\n…"}
```

`outil ecrire <fichier>` enregistre ce que tu donnes (chaque partie est facultative ; « themes » remplace tous les thèmes) et
renvoie les contrôles du code : nombre ou compte de personnes sans appui dans les idées citées (le code retirera la phrase),
phrase sans renvoi, camp d'avis absent ou cité pour moins de 80 % de ses personnes, ligne des listes oubliée par le résumé,
« fragile » manquant. Corrige en renvoyant le texte entier. `outil voir textes` relit tout ce qui est écrit.

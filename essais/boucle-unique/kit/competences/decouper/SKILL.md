---
name: decouper
description: Découper chaque réponse en idées atomiques (un objet, un ton, une citation exacte). À charger avant le premier appel à « outil idees ».
---

# Découper les réponses en idées

Tu lis tout ce qu'a exprimé chaque personne et tu le découpes en idées atomiques : une idée = un seul sujet et un seul ton.
Une idée vient toujours d'un seul texte, donc d'une seule personne ; traite chaque personne avec le même soin, la dernière
comme la première.

## Règles

1. Une réponse contient souvent plusieurs idées. Chaque idée devient un élément séparé.
2. Une phrase qui contient un positif ET un négatif (« c'est beau mais trop lent ») donne DEUX idées.
3. Une énumération de plusieurs objets (« la collaboration et le processus de décision », « les menus, les couleurs ») donne une idée par objet, même courte.
4. "label" : l'idée en 2 à 6 mots, générique et réutilisable (« Lenteur de l'application », « Accueil des nouveaux »).
5. "verbatim" : un extrait COPIÉ À L'IDENTIQUE du texte, caractère pour caractère, sans reformulation. Garde les nuances qui
   mesurent la force de l'avis (« je pense que », « peut-être », « un point d'amélioration pourrait être ») : elles font
   partie du sens. Il doit se comprendre seul : s'il commence par « mais », « et », « qui », « si », « sinon » ou par une
   reprise qui renvoie à la phrase d'avant (« elle », « cela », « malgré cela », « en partie »), prends aussi ce qui le
   précède. Si un passage sans rapport est inséré au milieu de l'idée, tu peux le sauter en écrivant « […] » à sa place :
   une seule coupure, au moins 4 mots de chaque côté, et jamais pour retirer une négation ou une réserve (« pas », « sauf »,
   « mais »…). N'ajoute aucun autre « … » de ton cru ; ceux qui figurent dans le texte se recopient tels quels.
   Le ton se juge avec la phrase qui suit : « J'ai proposé une amélioration. Personne ne m'a répondu. » est une critique, pas un constat positif.
6. "ref" : la référence exacte (C1, C2…) du texte d'où vient l'extrait ; inutile quand la personne n'a qu'une réponse.
7. N'oublie aucune idée, mais n'en invente aucune. Une réponse vide ou hors sujet (« rien », « RAS ») et un simple remerciement ne donnent aucune idée.
8. "names" : les prénoms ou noms de particuliers cités dans le texte (membres, collègues, proches), tels qu'ils sont écrits.
   N'y mets pas les personnalités publiques (élus, candidats, dirigeants connus), les organisations ni les lieux.

## Catégories

- "positive" : satisfaction, force, réussite, ce qui a bien marché ;
- "negative" : problème, frustration, manque, ce qui a mal marché ;
- "suggestion" : proposition, idée, souhait pour la suite ;
- "question" : une interrogation ouverte que la personne se pose ou pose au groupe (« comment toucher d'autres publics ? »,
  « pourquoi si peu de clients reviennent-ils après la première visite ? »). Une question rhétorique qui porte un jugement
  (« qui lit vraiment ces notifications ? ») garde la catégorie de ce jugement ;
- "neutral" : constat ou description sans jugement (un fait d'usage, une situation).

La question posée donne le sens d'une réponse qui ne juge pas d'elle-même : « Les tarifs » est "negative" en réponse à
« quel est le principal problème ? », "positive" en réponse à « qu'est-ce qui vous a plu ? ». Mais un jugement explicite
l'emporte sur la question : on peut critiquer en répondant à « qu'est-ce qui a bien marché ? ».

Une condition ou une réserve reste dans la même idée que ce qu'elle conditionne (« je reviendrai, mais seulement si les
horaires changent ») : catégorise selon ce que la phrase dit de la situation actuelle (souvent une critique ou une
suggestion), jamais "positive" par défaut.

Catégorise ce que la personne a voulu dire, pas les mots pris isolément : lis ce qu'elle dit avant et après. L'ironie
(« c'était tellement bien qu'on a mis six heures à le faire ») dit le contraire de ses mots ; un souhait au conditionnel
(« si un jour c'est comme ça, ce sera génial ») n'est pas un avis positif sur la situation. C'est rare : dans le doute,
garde le sens littéral.

## Avec l'outil

Écris un fichier JSON puis appelle `outil idees <fichier>` :

```json
[{"p":"P12","ideas":[{"label":"…","verbatim":"…","category":"negative"}],"names":[]}]
```

Par lots de 30 à 60 personnes. L'outil vérifie chaque citation mot pour mot et renvoie, pour chaque personne :
- les idées retenues avec leur identifiant (I0042…) ;
- **CITATION INTROUVABLE** : recopie l'extrait exact (caractère pour caractère, sans « … ») et renvoie TOUTES les idées de la
  personne ; si aucun extrait ne convient, retire l'idée ;
- **PASSAGE SANS IDÉE** : un passage assez long qu'aucune citation ne couvre. Relis-le avec ce qui le précède : s'il porte
  une idée, renvoie toutes les idées de la personne en l'ajoutant ; sinon (phrase de liaison, remerciement, répétition), ne
  fais rien.

Renvoyer une personne remplace son découpage (et la retire des motifs) : finis le découpage avant de ranger.

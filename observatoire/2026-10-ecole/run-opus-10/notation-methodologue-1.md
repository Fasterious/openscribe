# Notation methodologue, lecture 1 : école, passe 10 (Opus)

Grille : `docs/NOTATION.md`. Lu : `rapport.md`, `state.json` (962 idées, 74 motifs, 10 thèmes), `../echantillon.csv`, la demande et la réponse de réconciliation (`requests/` et `responses/reconcile-08275259164f570e.*`), `src/core/analysis/pipeline.ts` (étape de réconciliation).
Aucun verbatim recopié : les idées sont désignées par leur identifiant.

## Notes

| # | Critère | Note | En bref |
|---|---|---|---|
| 1 | Découpage en idées | 4 | Couverture presque totale (9 participants seulement ont un passage de plus de 60 signes non codé, le plus souvent du contexte), citations exactes. Défauts : une réserve séparée de ce qu'elle nuance (I0215/I0216, P87, rendu « mitigé » alors que la phrase est négative) ; idées à deux objets ou deux tons que la copie rattrape (I0196, I0623) ; un ton inversé à tort (I0766, regret classé positif) ; I0706 contient une coupe « […] » mais n'est pas marquée approximative. |
| 2 | Traçabilité | 3,5 | Chaque phrase porte ses renvois et les chiffres viennent du code. Mais les renvois de « Démarches d'inscription » citent des idées qui ne parlent pas d'inscription (handicap) ; P353 est cité deux fois avec la même phrase et un « aussi dans » qui renvoie au motif lui-même (I0874/I0946) ; la section Méthode affirme que la passe de consolidation a fusionné des motifs « qui traitaient le même objet », ce qui est faux (voir défaut 1), et compte 962 idées « vérifiées mot pour mot », copies et coupe de I0706 comprises. |
| 3 | Regroupement | 2,5 | Beaucoup de motifs nets (Absences, Effectifs, Orientation, Contrôle des enseignants défaillants, désormais propre). Mais les trois fusions sont appliquées aux mauvais motifs : un motif mêle inscription et handicap, un autre mêle qualité des enseignants et administration, un troisième s'appelle « Direction des établissements » alors que sa définition et son contenu portent sur le dialogue avec les familles. Qualité et Motivation des enseignants restent séparés, alors que le moteur avait demandé leur fusion. |
| 4 | Chiffres et minorités | 2,5 | Les comptes de personnes sont justes motif par motif, et les minorités « à contre-courant » sont nommées. Mais trois conclusions du résumé reposent sur des motifs mal composés (qualité des enseignants, proximité, démarches d'inscription), et le sujet du handicap (18 personnes, aucune voix favorable) disparaît du résumé. |
| 5 | Synthèses et thèmes | 3 | Les synthèses de motif sont fidèles et honnêtes : celle de G1 dit bien que 18 personnes parlent de handicap, celle de G2 nomme 8 éloges de l'école publique. Mais la synthèse du thème « Les enseignants » (« divisent… doute sur leur compétence ») hérite du faux équilibre, et le thème « Élèves à besoins particuliers » ne parle pas du handicap, rangé sous « Démarches et services administratifs ». |
| 6 | Valeur pour la restitution | 3 | Le résumé est bien hiérarchisé (ce qui marche, ce qui bloque, ce qui divise, les propositions), chiffres à côté. Mais un chercheur présenterait trois conclusions fausses, et le premier point des propositions (G1, qui cite I0032 sur les classes Ulis et Itep comme proposition « sur les démarches d'inscription ») trahit le mélange dès la première lecture. |

Moyenne : 18,5 / 6 = 3,08, arrondie à **3**.

**Note globale : 3/5, plafond de fidélité atteint** (le plafond 3 s'applique ; la moyenne tombe d'elle-même au même niveau).

Exemple exact du plafond : motif **« Qualité des enseignants »** (G3), cité dans le Résumé et dans « Ce qui divise » (« 21 positifs, 21 négatifs »). Il compte parmi les avis négatifs sur les enseignants des critiques qui visent l'administration : I0371 (P146), dont la phrase précise en toutes lettres qu'elle ne parle pas des enseignants ; I0937 (P375), qui met hors de cause les fonctionnaires ; I0051 (P17), I0329 et I0330 (P130), I0345 (P135), I0647 (P259), I0648 (P260), I0876 (P354). Ces 8 personnes retirées, le motif compte 21 positifs, 13 négatifs et 2 mitigés : une majorité positive, pas des « avis partagés ». La conclusion du résumé est donc inversée.

Deux autres déclencheurs indépendants, de même force :
- **« Proximité de l'école »** (G27, « Ce qui divise », 3 positifs, 5 négatifs) : des plaintes d'éloignement restent ailleurs, I0003 (P1, comptée positive sur ce même motif), I0331 (P132), I0919 (P365), I0059 (P22), I0877 (P354), I0841 (P340). Une fois rapatriées, on obtient 2 positifs, 10 négatifs et 1 mitigé : une large majorité négative, rien qui divise.
- **« Démarches d'inscription »** (G1, premier point de « Ce qui bloque », 39 sur 47) : 18 des 39 critiques portent sur l'accueil des enfants handicapés (I0003, I0087 à I0090, I0206, I0283, I0284, I0520, I0526, I0527, I0555, I0620, I0621, I0689, I0690, I0782, I0840 à I0842, I0891 à I0895…), alors qu'aucune de ces idées ne relève de la définition du motif. Sans elles, les démarches comptent 21 négatifs pour 8 positifs, et le handicap formerait un motif unanime de 18 personnes, troisième sujet de blocage, absent du résumé.

## Défauts principaux, par gravité

1. **Les fusions de la réconciliation touchent les mauvais motifs : c'est un défaut du code, pas du moteur.** Le moteur a demandé trois fusions : G2 avec G26 (Qualité et Motivation des enseignants), G10 avec G24 (Démarches d'inscription et Pièces à fournir), G27 avec G54 (Encadrement administratif et Gestion des établissements). Le code les a appliquées à Qualité avec Encadrement administratif, à Scolarisation des enfants handicapés avec Pièces à fournir (le titre « Démarches d'inscription » a ensuite réuni le tout), et à Relations avec les familles avec Gestion des établissements. Preuve : dans `state.json`, `merges[0].reason` parle de la motivation (G26), alors que `from` cite « Encadrement administratif ». Cause probable, dans `pipeline.ts` : après la relecture des paires, `groups = takeOffTopic(build(shared.groups))` renumérote les motifs, puis `res.merges` est filtré et appliqué sur ces **nouveaux** identifiants. Ce seul défaut produit les deux pires erreurs de la passe : le handicap noyé dans G1 et l'administration dans G3, plus le motif mal titré G19. Correction : appliquer les fusions sur les identifiants de la demande, c'est-à-dire résoudre leurs titres avant la reconstruction, ou fusionner avant la relecture des paires. Ajouter un test où la relecture change l'ordre des motifs.
2. **« Qualité des enseignants » : 8 critiques de l'administration comptées contre les enseignants**, ce qui fabrique un faux équilibre dans le Résumé, dans « Ce qui divise » et dans le thème « Les enseignants » (voir plafond). C'est une conséquence du défaut 1.
3. **Le handicap disparaît du résumé et l'inscription est gonflée** (voir plafond). Dans « Ce que proposent les participants », G1 apparaît premier avec I0032 et I0519, qui ne parlent pas d'inscription. Le principe 3 (minorités visibles) est atteint : 18 familles d'enfants handicapés, toutes en difficulté, deviennent une sous-partie d'un motif administratif. Conséquence du défaut 1.
4. **La « Proximité de l'école » divise à tort.** Le défaut des passes 8 et 9 est réduit (quatre copies venues de Carte scolaire : I0945, I0954, I0955, I0956), mais pas corrigé : six plaintes d'éloignement restent hors du motif (voir plafond). P1 est même affiché seulement « positif » sur la proximité, alors que sa seconde phrase (I0003) décrit 4 heures de route par jour.
5. **« École publique face au privé » : le défaut persiste, en partie.** Le résumé dit « critiquée par une large majorité (18 sur 20) ». Or la définition du motif compte comme positif le fait de « défendre l'école publique », et 7 éloges de l'école publique restent dans « Expérience globale » sans copie : I0320 (P125), I0426 (P170), I0463 (P185), I0605 (P242), I0613 (P246), I0757 (P308), I0859 (P346). De plus, la copie I0959 (P192), qui reproche au privé de choisir ses élèves, donc défend le public, est comptée négative. Corrigé, le motif compte 9 positifs et 17 négatifs : une majorité, pas une large majorité. Le défaut ne vient pas du code : le codage en double n'a pas été demandé là où la définition l'exigeait.
6. **« Direction des établissements » (G19) porte un titre qui ne correspond ni à sa définition ni à son contenu** (dialogue avec les familles : I0075, I0103, I0263, I0816, I0935), alors que des critiques de direction sont restées dans G3 (I0330, I0045 positif). Le motif figure dans « Ce que proposent » avec deux propositions sur les parents.
7. **Défauts mineurs.** La copie I0946 atterrit dans le motif de son original au lieu de « Fermetures de classes » : citation en double et renvoi circulaire. I0343 (P135, temps de travail et salaire des professeurs) n'est pas un avis sur le contrôle des enseignants. I0852 (P343, dossiers en double entre mairie et école) relève de G1, pas de G8. Dans « Langues régionales », I0808 (P327, une plainte contre la correction d'un accent) est retonné positif : c'est conforme à la définition, mais l'affichage en « avis positif » égare le lecteur ; une définition par position, et non par satisfaction, devrait être signalée comme telle. Une proposition de P57 sur la rémunération uniforme n'est pas codée.

## Effet observé du codage en double

Bénéfices réels (13 copies sur 20 utiles et bien placées) :
- Des plaintes transversales deviennent visibles là où on les cherche : absences (I0944, I0951), rémunération (I0950), moyens (I0961), niveau des élèves (I0962), écoles rurales (I0947), inscription réussie (I0952), effectifs appréciés (I0943), éloge des équipes (I0948).
- La proximité passe de 1 à 5 avis négatifs grâce à quatre copies venues de Carte scolaire. La mention « aussi dans » rend ces passages traçables.

Dégâts et limites :
- **Une copie mal placée** (I0946) : même motif que l'original, donc une citation en double et un renvoi circulaire. Il faut un contrôle dans le code (une copie ne peut pas rejoindre le motif de son original).
- **Copies qui changent de ton** (I0948, I0949, I0958, I0960) : c'est légitime quand la définition l'exige, mais le même avis compte alors dans « Ce qui a marché » (Enseignement privé) et dans « Ce qui bloque » (École publique). Le lecteur devrait en être averti dans le résumé. Une copie qui change de ton signale aussi souvent une idée d'origine non atomique (I0623).
- **Une copie dans le mauvais camp** (I0959, P192, défaut 5).
- **Copies manquantes là où les définitions les réclamaient** : 7 éloges de l'école publique (défaut 5) et 6 plaintes d'éloignement (défaut 4). Le codage en double corrige à la marge, mais ne remplace pas une règle de partage entre « Expérience globale » et « École publique face au privé », que la réconciliation n'a pas proposée.
- La section Méthode compte les 20 copies dans les « 962 idées retenues » : il faudrait afficher 942 idées et 20 doubles codages.

Réconciliation : les 8 règles de partage sont pertinentes et ont été appliquées aux bonnes paires (les paires sont résolues avant la renumérotation), par exemple la règle public/privé et la règle handicap/profil atypique. Le bilan net est pourtant négatif, à cause des fusions mal appliquées (défaut 1) : sans ce défaut, la passe aurait probablement atteint 3,5 avant plafond, sous réserve du défaut 5.

## Défauts des passes 8 et 9 : où en est-on

| Défaut | Passe 10 |
|---|---|
| Éloges de l'école publique rangés dans « Expérience globale » | **Subsiste** : 7 idées, aucune copie (défaut 5) |
| Critiques de la qualité des enseignants dans « Contrôle des enseignants défaillants » | **Corrigé** : le motif ne contient plus que des idées sur l'absence de contrôle ou de sanction (sauf I0343, mineur) |
| Critiques d'éloignement hors de « Proximité de l'école » | **Réduit, non corrigé** : 4 copies ajoutées, 6 plaintes encore ailleurs (défaut 4) |

## Temps de relecture humaine estimé

Environ **3 h 30 à 4 h** à la main : sortir le handicap de G1 et recompter, sortir l'administration de G3 et la regrouper avec G19, fusionner Motivation et Qualité, rapatrier éloignement et éloges du public, puis réécrire trois phrases du résumé, deux synthèses de thème et le premier point des propositions.
Avec le défaut 1 corrigé dans le code et la passe rejouée depuis le cache, compter **1 h** de relecture, pour les défauts 4, 5 et 7.

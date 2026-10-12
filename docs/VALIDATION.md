# Validation par Arnaud — 15 minutes

Déjà vérifié : 32 tests des règles d'analyse, 22 parcours automatiques (ordinateur et mobile), trois passes de test utilisateur (certifiées sur un commit figé), relectures `plume` et `methodologue`. Il reste ce que seul un humain avec un vrai moteur d'IA peut vérifier.

## 1. Lancer

Pour lancer l'application : `npm run dev`, puis http://localhost:5173.

## 2. Première impression (3 min)

- [ ] L'accueil dit en cinq secondes ce que fait l'outil, pour qui, et ce qui est disponible aujourd'hui.
- [ ] La pastille de l'extrait (« Vitesse de l'application ») déplie les verbatims.
- [ ] « Voir un exemple de rapport » : les motifs sont fins (un sujet par motif), les thèmes les rapprochent, les avis isolés sont mis à part.
- [ ] Une pastille de verbatim dans une synthèse déplie les phrases exactes sur place, surlignées dans leur réponse.

## 3. Un vrai moteur (5 min)

1. Dans « Moteurs d'IA », choisis **Groq** ou **Mistral** et suis le guide (lien direct vers la page des clés), ou **Ollama** si tu l'installes.
2. « Enregistrer et tester ».

> Point non vérifiable d'ici : l'appel direct d'un fournisseur depuis le navigateur. Si le test répond « … refuse peut-être les demandes venant d'un navigateur » alors que la clé est bonne, dis-moi lequel : la solution est connue (un petit relais).

- [ ] Le test répond, l'en-tête passe au vert, « Revenir à votre étude » ramène à l'étude.
- [ ] Ouvre l'exemple, onglet Analyse, choisis ce moteur, « Relancer une analyse » : l'ancien rapport reste consultable pendant la relance, les étapes avancent.
- [ ] Le nouveau rapport : un motif = un sujet ? Les synthèses se lisent comme du bon français ?
- [ ] Relance avec les mêmes réglages : le rapport ressort identique, instantanément.

## 4. Tes données (5 min)

- [ ] Importe le CSV ÉcoSol (ou un autre corpus réel). Les rôles de colonnes proposés sont-ils justes ? Marque les colonnes de profil pour pouvoir afficher des segments.
- [ ] Sur un vrai corpus, le nombre de motifs te paraît-il juste (ni fourre-tout, ni émiettement) ? C'est le réglage le plus important à confirmer.
- [ ] Pourrais-tu montrer ce rapport à un client ?

## Ce qui m'aide le plus en retour

Comme aujourd'hui : un test pensé à voix haute, ou une capture et une phrase par point qui accroche.

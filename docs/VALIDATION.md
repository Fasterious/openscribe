# Validation par Arnaud — 15 minutes

Tout a déjà été testé : 29 tests de règles d'analyse, 12 parcours automatiques (ordinateur et mobile), deux passes de test utilisateur et deux relectures de la langue. Il reste ce que seul un humain avec une vraie clé peut vérifier.

## 1. Lancer (3 min)

```bash
git clone https://github.com/Fasterious/openscribe.git openscribe-next
cd openscribe-next && git checkout next
npm install && npm run dev
```

Ouvrez http://localhost:5173.

## 2. Première impression (2 min)

- [ ] L'accueil dit clairement ce que fait l'outil.
- [ ] « Essayer avec un exemple » ouvre directement un rapport crédible.
- [ ] Ouvrez un groupe, puis cliquez une pastille de citation : la phrase exacte s'affiche, surlignée dans sa réponse.

## 3. Un vrai moteur gratuit (5 min)

1. Créez une clé gratuite chez **Mistral** (console.mistral.ai) ou **Groq** (console.groq.com). Vérifiez sur leur site les conditions de l'offre gratuite du moment.
2. Dans « Moteurs d'IA », ajoutez le moteur, collez la clé, puis cliquez sur « Tester la connexion ».
3. Ouvrez l'exemple, onglet Analyse, choisissez ce moteur et cliquez sur « Relancer une analyse ».

> Point que je n'ai pas pu vérifier d'ici : l'environnement de test n'a pas accès aux fournisseurs d'IA. Si « Tester la connexion » répond « Impossible de joindre… » alors que la clé est bonne, le fournisseur refuse peut-être les appels directs depuis un navigateur. Dites-moi lequel : la solution est connue (un petit relais), je l'ajouterai.

- [ ] L'analyse avance étape par étape. Si le fournisseur limite le débit, un message « Nouvel essai dans N s… » s'affiche et l'analyse continue.
- [ ] Le rapport est cohérent, et le nombre de « citations écartées » reste faible.
- [ ] Les synthèses se lisent comme du bon français.
- [ ] Relancez l'analyse avec les mêmes réglages : le rapport doit sortir identique et instantanément (réponses gardées en mémoire).

## 4. Vos données (5 min)

- [ ] Importez un de vos CSV réels. Les rôles de colonnes proposés sont-ils justes ?
- [ ] Le rapport vous apprend-il quelque chose, et pourriez-vous le montrer à un client ?

## Ce qui m'aide le plus en retour

Une capture et une phrase par point qui accroche. Le reste, je m'en occupe.

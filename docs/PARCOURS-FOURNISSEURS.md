# Parcours des fournisseurs : où l'utilisateur bloque

Chaque fournisseur est essayé comme un utilisateur, dans un vrai navigateur, de
« Configurer » dans OpenScribe jusqu'à une clé qui marche. On note chaque blocage,
s'il se lève, et ce qu'OpenScribe peut faire pour aider. Les offres changent :
chaque ligne porte sa date.

Règle du test : aucune carte bancaire, aucun mot de passe saisi par l'agent ; une
étape qui en demande revient à Arnaud.

## Mistral — 13/10/2026 (compte d'Arnaud, déjà connecté)

| # | Étape | Ce qui se passe | Blocage | Levé ? |
|---|---|---|---|---|
| 1 | OpenScribe › Moteurs d'IA › Mistral › Configurer | Guide en 3 étapes, lien « Ouvrir la console Mistral » | — | — |
| 2 | Console Mistral | Le site s'appelle désormais **Mistral Studio**, en français ; menu « Clés API », pas « API Keys » | Vocabulaire du guide périmé (léger) | Oui : guide corrigé |
| 3 | Clés API | Bandeau : « Votre organisation est sur le plan Free. Passez à un plan supérieur pour activer vos clés API ». Bouton « Nouvelle clé » grisé. Les trois anciennes clés (mars-avril 2026) sont listées mais inactives | **Total sans moyen de paiement** | Non |
| 4 | Admin › Abonnement | Abonnement « Gratuit » avec **8,5 € d'usage API inclus par mois** (0,15 € consommés). Ligne « API Pay-As-You-Go » avec un bouton « Activer » : créer des clés exige de l'activer | Activation = moyen de paiement (très probablement une carte) | Geste d'Arnaud |
| 5 | Admin › API › Confidentialité | Réglage de réutilisation des données pour l'entraînement | À refuser avant d'envoyer des données réelles | Geste d'Arnaud ou accord explicite |

Ce qui a changé chez Mistral (recoupé avec d'autres utilisateurs début octobre 2026) :
l'offre « Experiment » (gratuite, vérification par téléphone, sans carte) n'existe
plus. Il reste un forfait gratuit mensuel, mais il ne sert qu'une fois le paiement à
l'usage activé. La documentation officielle dit encore « API access is enabled by
default with no credit card required » : elle est en retard sur la console.

### Ce qu'on a changé dans OpenScribe

- Mistral quitte « Pour essayer gratuitement » (badge « Gratuit, sans carte » faux) et
  rejoint les fournisseurs directs.
- Guide : lien direct vers Admin › Abonnement, activer « API Pay-As-You-Go », fixer une
  limite de dépenses ; puis « Clés API › Nouvelle clé » (la clé ne s'affiche qu'une fois).
- Confidentialité : le chemin exact (Admin › API › Confidentialité).
- Accueil et page des moteurs : seul Groq est annoncé comme gratuit sans carte.

### Ce qui reste à faire par Arnaud

1. Admin › Abonnement › « API Pay-As-You-Go » › Activer, avec une limite de dépenses
   basse (le forfait gratuit de 8,5 € passe en premier ; une synthèse ÉcoSol complète
   devrait coûter quelques centimes à quelques dizaines de centimes avec Mistral Small).
2. Admin › API › Confidentialité : refuser la réutilisation des données (ÉcoSol est réel).
3. Clés API › Nouvelle clé, copier, coller dans OpenScribe › Mistral › « Enregistrer et tester ».

Ensuite l'agent reprend : synthèse ÉcoSol avec Mistral, comparaison à la référence,
réglages pour s'en approcher.

## Leçons pour tous les fournisseurs

- **Une offre gratuite est un fait daté**, pas une propriété du fournisseur : la fiche
  doit dire quand elle a été vérifiée, et se revérifier avant chaque annonce publique.
- **Le blocage le plus dur n'est pas technique** : c'est le moment où le fournisseur
  demande une carte. OpenScribe ne peut pas le lever ; il peut le dire avant que
  l'utilisateur ne se lance, et lui donner le réflexe « limite de dépenses ».
- **Le vocabulaire des consoles change** (nom du site, langue, intitulés) : citer les
  intitulés tels qu'à l'écran, et pointer le lien le plus profond possible.
- **Un clic de mise à niveau est une transaction** : l'agent de test ne le fait jamais,
  même pour « voir » ; il lit les pages d'abonnement sans toucher aux boutons.

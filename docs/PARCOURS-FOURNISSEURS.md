# Parcours des fournisseurs : où l'utilisateur bloque

Chaque fournisseur est essayé comme un utilisateur, dans un vrai navigateur, de
« Configurer » dans OpenScribe jusqu'à une clé qui marche. On note chaque blocage,
s'il se lève, et ce qu'OpenScribe peut faire pour aider. Les offres changent :
chaque ligne porte sa date.

Règle du test : aucune carte bancaire, aucun mot de passe saisi par l'agent ; une
étape qui en demande revient à Arnaud.

## Mistral — 13/10/2026 (compte d'Arnaud, déjà connecté)

Premier passage, par l'agent seul :

| # | Étape | Ce qui se passe | Blocage | Levé ? |
|---|---|---|---|---|
| 1 | OpenScribe › Moteurs d'IA › Mistral › Configurer | Guide en 3 étapes, lien « Ouvrir la console Mistral » | — | — |
| 2 | Console Mistral | Le site s'appelle désormais **Mistral Studio**, en français ; menu « Clés API », pas « API Keys » | Vocabulaire du guide périmé (léger) | Oui : guide corrigé |
| 3 | Clés API | Bandeau : « Votre organisation est sur le plan Free. Passez à un plan supérieur pour activer vos clés API ». Bouton « Nouvelle clé » grisé. Les trois anciennes clés (mars-avril 2026) sont listées mais inactives | **Total sans moyen de paiement** | Non |
| 4 | Admin › Abonnement | Abonnement « Gratuit » avec **8,5 € d'usage API inclus par mois** (0,15 € consommés). Ligne « API Pay-As-You-Go » avec un bouton « Activer » : créer des clés exige de l'activer | Activation = moyen de paiement (très probablement une carte) | Geste d'Arnaud |
| 5 | Admin › API › Confidentialité | Réglage de réutilisation des données pour l'entraînement | À refuser avant d'envoyer des données réelles | Geste d'Arnaud ou accord explicite |

Ce qui a changé chez Mistral (recoupé avec d'autres utilisateurs début octobre 2026) :
l'offre « Experiment » (gratuite, vérification par téléphone) n'existe plus. Conclusion
du premier passage, **corrigée au deuxième** : on croyait qu'aucune clé ne marchait sans
paiement ; en fait seuls les plus gros modèles sont fermés.

### Deuxième passage, avec Arnaud (13/10, le soir) : il existe un chemin gratuit

- La page « Clés API » **de Mistral Studio** (console) a le bouton grisé, mais la page
  **Admin › Clés API** (clés de l'organisation) permet de créer une clé sans rien payer.
  C'est par là qu'Arnaud a créé la sienne, sans activer le paiement à l'usage.
- Avec cette clé, essai modèle par modèle :

| Modèle | Réponse | Sens |
|---|---|---|
| `ministral-14b-2512`, `ministral-8b-2512`, `ministral-3b-2512`, `codestral-2508` | 200 | Inclus dans l'offre gratuite |
| `mistral-small-2603`, `mistral-medium-2604`, `magistral-*` | 429 (code 1300) dès le premier appel | Quota nul sans paiement à l'usage |
| `mistral-large-latest` | 403 `tier_not_allowed` | Hors offre |
| `labs-*` | 403 | Modèles Labs à activer (et données réutilisées) |

- Le modèle par défaut d'OpenScribe (`mistral-small-2506`) n'existait plus, et Small est
  hors de l'offre gratuite : d'où le message « trop de demandes (429) » au test, faux
  diagnostic qui a bloqué Arnaud.
- Confidentialité : chez Arnaud, l'entraînement sur les appels API était déjà désactivé
  (Admin › API › Confidentialité), modèles Labs désactivés.

### Ce qu'on a changé dans OpenScribe

- Mistral revient dans « Pour essayer gratuitement », avec Ministral 14B par défaut.
- Le modèle se choisit dans une liste expliquée (même menu que les autres listes) :
  « Inclus dans l'offre gratuite » / « Avec le paiement à l'usage activé », le recommandé
  marqué, et « Autre modèle… » pour la saisie libre.
- Guide : lien direct vers Admin › Clés API, « Nouvelle clé », la clé ne s'affiche qu'une fois.
- Erreurs : une 429 au test dit « ce modèle n'est sans doute pas inclus dans votre offre » ;
  une 403 « tier » dit « votre offre ne donne pas accès à ce modèle », plus « clé refusée ».

### La synthèse ÉcoSol avec la clé gratuite

Ministral 14B, dans l'application, en trois passes : 7 à 10 minutes, gratuit, note
3/5 (méthode et langue) contre 4,5 et 4 pour Sonnet. Détail et prochains leviers :
`docs/METHODES.md`. En route, l'analyse s'est arrêtée trois fois sur des réponses mal
formées (texte emballé dans un objet, piste opposée mal formée) et a subi un délai
dépassé : la lecture des réponses est désormais tolérante, le délai trop court reste à
revoir pour les modèles lents.

## Google Gemini — 13/10/2026 (compte Google d'Arnaud, déjà connecté)

| # | Étape | Ce qui se passe | Blocage | Levé ? |
|---|---|---|---|---|
| 1 | AI Studio › Clés API | Liste des clés ; bandeau « passer au prépaiement » (lié à un autre projet) | Bandeau anxiogène, sans rapport avec l'offre gratuite | On l'ignore |
| 2 | « Créer une clé API » | Nom (« OPENSCRIBE NEXT ») et **projet** à choisir | **Piège** : un projet « Niveau 1 · Post-paiement » (facturation active) existe à côté du projet « Niveau sans frais ». Une clé du mauvais projet est facturée | Oui : le guide dit de choisir un projet au « Niveau sans frais » |
| 3 | Détails de la clé | Clé au nouveau format « AQ. » (plus « AIza ») ; bouton « Copier la clé » | — | Collée par Arnaud |
| 4 | OpenScribe › Enregistrer et tester (3.8 Flash) | « Google Gemini n'a rien renvoyé » | Notre test réservait 20 jetons ; la réflexion du modèle les consommait tous (`finish: length`, 0 jeton de réponse) | Oui : 1 024 jetons au test |
| 5 | Même test, plus tard | 503 « high demand » sur 3.8 Flash ; délai dépassé | Modèle surchargé ; message qui accusait la connexion | Oui : message 503 dédié |
| 6 | AI Studio › Limite de débit | Offre gratuite : 3.8 / 3.7 / 3.6 Flash à **20 demandes par jour** ; 3.5 et 3.1 Flash-Lite à 15 par minute et **500 par jour** ; Gemma 4 à 14 400 par jour mais 16 000 jetons par minute | Une synthèse de 20 participants (50 à 80 demandes) ne tient pas dans 20 par jour ; Gemma ne tient pas nos grosses demandes | Flash-Lite par défaut, liste expliquée |
| 7 | Appels | Gemini refuse le paramètre `seed` (400) | Contourné automatiquement, mais inutile | Oui : plus envoyé |

Données : dans l'Union européenne, en Suisse et au Royaume-Uni, les conditions de l'offre
payante s'appliquent aussi au quota gratuit (pas d'entraînement sur les données). Ailleurs,
l'offre gratuite réutilise les données et des humains peuvent les relire.

## Groq — 13/10/2026 (compte créé par Arnaud pendant le test)

| # | Étape | Ce qui se passe | Blocage | Levé ? |
|---|---|---|---|---|
| 1 | console.groq.com/keys | « Create an account or login » (Google, GitHub, SSO, e-mail) | L'agent ne crée pas de compte : geste d'Arnaud | Oui (1 minute) |
| 2 | Create API Key | Nom, expiration ; vérification Cloudflare validée seule ; « Copy » (affichée une fois) | — | Collée par Arnaud |
| 3 | Settings › Limits | Gratuit : gpt-oss-120b, gpt-oss-20b, qwen3.8-27b à 30 demandes/min, 1 000/jour, **8 000 jetons/min, 200 000 jetons/jour** ; plus de Llama 3.3 | — | Liste des modèles mise à jour |
| 4 | Demande de plus de 8 000 jetons | 413 « Request too large » | Nos demandes de regroupement dépassent | Méthode `groq` à petits lots ; réponse réservée selon la place restante |
| 5 | Sans longueur demandée | Groq coupe la réponse vers 2 000 (Qwen) à 3 000 jetons (gpt-oss, qui réfléchit d'abord) | Extraction coupée | Longueur réservée explicitement, réflexion courte |
| 6 | Synthèse ÉcoSol, gpt-oss-120b | 62 demandes en 25 minutes : extraction, regroupement, 9 synthèses de motif sur 32 ; 150 000 jetons consommés | Une synthèse entière : environ une heure, et plus que le quota du jour | **Non : abandonné** (décision d'Arnaud) |
| 7 | Synthèse ÉcoSol, Qwen 3.8 27B | Arrêtée au 4e participant : 429 répétés (une demande de 7 000 jetons par minute au plus) | Même plafond | Non |

Verdict : Groq est gratuit et sans carte, mais son offre gratuite ne permet pas une synthèse
d'une vingtaine de participants dans un délai raisonnable. Il sort des offres recommandées
pour démarrer et reste proposé pour de petites synthèses.

## Leçons pour tous les fournisseurs

- **Une offre gratuite est un fait daté**, pas une propriété du fournisseur : la fiche
  doit dire quand elle a été vérifiée, et se revérifier avant chaque annonce publique.
- **Le blocage le plus dur n'est pas technique** : c'est le moment où le fournisseur
  demande une carte. OpenScribe ne peut pas le lever ; il peut le dire avant que
  l'utilisateur ne se lance, et lui donner le réflexe « limite de dépenses ».
- **Le vocabulaire des consoles change** (nom du site, langue, intitulés) : citer les
  intitulés tels qu'à l'écran, et pointer le lien le plus profond possible.
- **Une erreur doit nommer la cause probable dans le contexte** : une 429 au tout premier
  appel n'est pas un excès de demandes, c'est un modèle hors offre.
- **Deux pages qui se ressemblent** (console et administration) peuvent dire l'inverse :
  quand un bouton est grisé, chercher l'autre entrée avant de conclure au blocage.
- **Un projet peut en cacher un autre** : chez Google, deux projets du même compte n'ont pas
  la même facturation. Le guide nomme le niveau à choisir (« Niveau sans frais »).
- **Le quota quotidien décide du modèle**, pas seulement la qualité : 20 demandes par jour
  ne suffisent pas à une synthèse. La liste des modèles le dit avant le choix.
- **Un test de connexion doit laisser parler un modèle qui réfléchit** : un plafond de
  jetons trop bas fait croire à une panne.
- **« Gratuit » ne suffit pas : il faut le débit.** Un plafond de jetons par minute décide
  de la durée d'une synthèse, plus que la vitesse du modèle. Mesurer le temps d'une synthèse
  complète avant de recommander une offre.
- **Un clic de mise à niveau est une transaction** : l'agent de test ne le fait jamais,
  même pour « voir » ; il lit les pages d'abonnement sans toucher aux boutons.

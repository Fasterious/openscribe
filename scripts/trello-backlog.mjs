// Source de vérité du backlog OpenScribe.
// Consommée par scripts/trello-bootstrap.mjs (création du board Trello)
// et par scripts/trello-backlog-md.mjs (génération de docs/BACKLOG.md).
//
// Conventions :
//   owner : 'claude' | 'arnaud' | 'both'
//   tags  : étiquettes thématiques (sécurité, produit, stratégie, infra, contenu)
//   block : true = bloque d'autres cartes tant que ce n'est pas fait
//   done  : true = déjà réalisé (la carte part directement dans « Fait »)
//   desc  : Markdown (Trello le rend nativement)
//   check : items de checklist

export const LABELS = {
  claude:    { name: 'Claude',    color: 'green'  },
  arnaud:    { name: 'Arnaud',    color: 'blue'   },
  both:      { name: 'À deux',    color: 'sky'    },
  block:     { name: 'Bloquant',  color: 'red'    },
  securite:  { name: 'Sécurité',  color: 'orange' },
  produit:   { name: 'Produit',   color: 'purple' },
  strategie: { name: 'Stratégie', color: 'yellow' },
  infra:     { name: 'Infra',     color: 'lime'   },
  contenu:   { name: 'Contenu',   color: 'pink'   },
};

// Bloc réutilisé dans les cartes destinées à Claude : rappelle le contexte
// minimal à charger au début d'une session fraîche.
const SOCLE = `**Socle à lire dans tous les cas**
- \`docs/STRATEGIE.md\` — thèse, principes, feuille de route
- \`BLUEPRINT.md\` — architecture et état du code`;

export const LISTS = [
  // ==========================================================
  {
    name: '🎯 Cadrage & décisions',
    desc: 'Cartes de référence. Aucune action : elles portent le contexte à relire avant de trancher quoi que ce soit.',
    cards: [
      {
        name: '📖 Thèse et 5 principes produit',
        owner: 'both', tags: ['strategie'],
        desc: `**Thèse.** OpenScribe transforme des centaines de contributions humaines en une décision compréhensible, traçable et contestable.

- **Wedge** : l'analyse de réponses ouvertes (module CSV).
- **Horizon** : la délibération collective — écouter → comprendre → décider.
- **Terrain** : la démocratie est un terrain d'expérimentation, pas le marché initial.

**Les 5 principes** (ligne de conduite technique *et* argument commercial) :
1. L'IA ne décide jamais — les comptages sont calculés en code.
2. Toute conclusion est traçable jusqu'aux contributions humaines.
3. Les minorités restent visibles. Consensus ≠ majorité.
4. Le participant ne paie jamais et n'a pas besoin de compte.
5. Le cœur est auditable — on facture l'échelle, pas le mécanisme.

📄 Référence : \`docs/STRATEGIE.md\``,
      },
      {
        name: '💰 Décision — Modèle hybride BYOK + clé serveur',
        owner: 'both', tags: ['strategie'],
        desc: `**Acté le 23/08/2026.**

Le BYOK strict actuel ferme le produit à sa cible : pour produire une seule analyse il faut aujourd'hui un compte Google **et** sa propre clé Gemini/Mistral. L'audience adressable se réduit à « les gens qui ont déjà une clé API et acceptent de la coller ».

**Retenu** : BYOK conservé comme mode **illimité** et argument de confiance (« vos clés, vos données »), **plus** une clé serveur sous quota mesuré pour ouvrir un palier gratuit.

⚠️ On ne plafonne pas ce qu'on ne mesure pas : le compteur d'usage doit précéder la clé serveur. Voir Lot 2.`,
      },
      {
        name: '⚖️ Décision — AGPL-3.0 + double licence commerciale',
        owner: 'both', tags: ['strategie'],
        desc: `**Acté le 23/08/2026.** Ouverture **après** le durcissement sécurité, jamais avant.

- Copyright détenu en propre ⇒ relicenciable à volonté.
- L'AGPL couvre l'usage réseau : empêche un SaaS fermé bâti sur le moteur.
- ⚠️ **CLA ou DCO obligatoire avant toute contribution externe** — sans quoi la double licence devient impossible dès la première PR fusionnée. Ça ne se rattrape pas.

État actuel : dépôt privé, **aucun fichier LICENSE**, et le README promet « Source-available license ». Sur un dépôt public, absence de LICENSE = tous droits réservés, l'inverse de la promesse.`,
      },
      {
        name: '🔒 Décision — ÉcoSol reste privé',
        owner: 'arnaud', tags: ['strategie'],
        desc: `**Acté le 23/08/2026.**

Les captures de cette analyse ne sont pas publiées dans le dépôt.

**Non versionnées.** Elles restent en local, utilisables en entretien commercial, en partage d'écran. Jamais publiées.

**Corollaire majeur** : il n'existe aujourd'hui **aucun cas publiable**. C'est ce qui justifie la vitrine.

À revoir seulement si le client donne un accord explicite et écrit.`,
      },
      {
        name: '🎯 North Star — une consultation publiée d\'ici fin novembre 2026',
        owner: 'both', tags: ['strategie'],
        desc: `**Une consultation réelle, publiée sur une URL openscribe.fr, citable, servant de preuve commerciale.**

Tout ce qui ne sert pas cet objectif est reporté.

**Pourquoi fabriquer la vitrine plutôt que prospecter** : sans cas publiable, il n'y a ni boucle de notoriété, ni conversation commerciale qui commence par « voici ce que ça donne » au lieu de « voici ce que ça pourrait donner ».

**Calendrier de fond** : présidentielle les 18 avril et 2 mai 2027. Les organisations arbitrent leurs outils à l'automne 2026 – janvier 2027 ⇒ la fenêtre de crédibilité est **avant** le scrutin, pas au printemps.`,
      },
    ],
  },
  // ==========================================================
  {
    name: '🔒 Lot 0 — Sécuriser et ne rien perdre',
    desc: 'Fermer les surfaces exposées avant toute publicité. Prérequis dur à l\'ouverture du dépôt et au partage public.',
    cards: [
      {
        name: '🔴 Lancer l\'audit RLS dans Supabase et me renvoyer le résultat',
        owner: 'arnaud', tags: ['securite'], block: true,
        desc: `**Le quart d'heure le plus rentable du lot.** Il peut révéler un trou plus large que ceux déjà identifiés.

**Où** : SQL editor Supabase → https://supabase.com/dashboard/project/_/sql/new
**Quoi** : les 3 requêtes de \`docs/SECURITE-RLS.md\` §1 (a, b, c).

**Ce qu'on cherche en priorité**
\`persona_sessions\` et \`feedbacks\` sont interrogées par le code mais **n'ont aucune migration** : elles ont été créées via le dashboard, **où RLS est désactivé par défaut**. \`feedbacks\` stocke \`user_email\`.
👉 Si l'une des deux ressort avec \`relrowsecurity = false\`, **c'est une fuite de données en cours** et ça passe devant absolument tout le reste.

Dans la requête (b), la forme du trou est \`roles = {public}\`.

**À me renvoyer** : le résultat brut des 3 requêtes (copier-coller, ou export CSV). Le (c) me sert à écrire la migration manquante sans rien deviner.`,
        check: [
          'Requête (a) — relrowsecurity par table',
          'Requête (b) — pg_policies avec les rôles',
          'Requête (c) — schéma de persona_sessions et feedbacks',
          'Coller le résultat dans la conversation',
        ],
      },
      {
        name: '🔴 Appliquer la migration de durcissement RLS',
        owner: 'arnaud', tags: ['securite'], block: true,
        desc: `**Faille principale fermée par cette migration** : \`csv_analysis_sessions\` porte une policy \`FOR ALL USING (true)\` **sans clause \`TO\`**, donc appliquée à \`PUBLIC\`. Les policies permissives étant OU-ées, elle annule les quatre policies \`auth.uid() = creator_id\`. **Tout porteur de la clé anon peut lire, modifier et supprimer n'importe quelle analyse** via PostgREST.

**Fichier** : \`supabase/migrations/20260823000000_harden_rls_policies.sql\` (idempotente)

**⚠️ À décider avant d'appliquer** — le bloc \`workshop_analyses\` restreint la lecture au créateur de la session. Après migration, une machine **non connectée** (vidéoprojecteur, second écran) ne pourra plus afficher l'analyse d'un atelier. Si ce parcours compte pour toi, ne pas appliquer ce bloc.

**Vérification** : boucle \`curl\` de \`docs/SECURITE-RLS.md\` §2, avant **et** après. Le diff est la preuve.
⚠️ PostgREST renvoie \`200 []\` (et non \`403\`) quand RLS filtre tout : \`[]\` est le signal de **succès**.

Puis non-régression fonctionnelle §3, dans l'ordre — surtout le point 1 : atelier live en fenêtre privée, les deux écrans doivent se mettre à jour (ça prouve que Realtime a survécu).`,
        check: [
          'Lancer la boucle curl AVANT (garder le résultat)',
          'Trancher le cas workshop_analyses / vidéoprojecteur',
          'Appliquer la migration',
          'Lancer la boucle curl APRÈS et comparer',
          'Test d\'écriture anonyme workshop_responses → doit passer de 201 à 42501',
          'Non-régression §3 : atelier live, analyse, CSV bout en bout, persona, transcription',
        ],
      },
      {
        name: 'Écrire la migration persona_sessions + feedbacks',
        owner: 'claude', tags: ['securite'],
        desc: `**Dépend de** : « Lancer l'audit RLS » (requête c). Ne pas commencer avant d'avoir le dump — les colonnes ne doivent pas être devinées.

**Objectif** : documenter dans le dépôt deux tables créées hors migration, et activer RLS dessus.

${SOCLE}
- \`docs/SECURITE-RLS.md\` §1 et §4
- \`supabase/migrations/20260325000000_create_csv_analysis_tables.sql\` — le gabarit à refléter
- \`app/api/persona/sessions/route.ts\` et \`app/api/feedback/route.ts\` — qui lit/écrit, et avec quel client

**Ce que tu dois m'envoyer** : le résultat de la requête (c) de l'audit.

**Forme visée**
\`CREATE TABLE IF NOT EXISTS\` + \`ENABLE ROW LEVEL SECURITY\` + policies \`TO authenticated\` sur \`auth.uid()\`.
Pour \`feedbacks\` : INSERT ouvert (la route insère avec le client anon) et **aucune policy SELECT**, pour que personne ne puisse lire les retours ni les e-mails des autres.`,
      },
      {
        name: 'Faire tourner le mot de passe DB Supabase',
        owner: 'arnaud', tags: ['securite'],
        desc: `\`supabase/.temp/pooler-url\` contient une chaîne de connexion Postgres **avec mot de passe** et a séjourné des mois dans un chemin non gitignoré.

**Vérifié** : jamais committé — \`git log --all -- 'supabase/.temp/*'\` est vide. Le dossier est maintenant ignoré.

Ce n'est donc pas une fuite avérée, mais la rotation coûte 2 minutes et lève le doute définitivement.

Dashboard Supabase → Settings → Database → Reset database password.`,
      },
      {
        name: 'Signer content-length dans la présignature R2',
        owner: 'both', tags: ['securite', 'infra'],
        desc: `**Dette assumée et documentée**, laissée volontairement de côté.

La taille validée par \`/api/upload-url\` est aujourd'hui **déclarative** : un PUT présigné accepte n'importe quel volume tant que \`content-length\` n'est pas un en-tête **signé**. Le client déclare 1 Ko et envoie 5 Go.

**Correctif** : 4ᵉ paramètre \`contentLength\` sur \`generateUploadUrl\` (\`lib/r2.ts:42-56\`), passé dans \`PutObjectCommand\`.

**Pourquoi ce n'est pas déjà fait** : non testable sans les variables \`R2_*\` en local, et le livrer à l'aveugle risquait de casser la transcription en production. « Ne pas casser ce qui marche » l'emporte.

**Ce que tu dois m'envoyer** : les variables \`R2_*\` dans \`.env.local\` (elles y sont absentes aujourd'hui), ou faire toi-même le test.

**Test décisif**
\`\`\`bash
head -c 100000 /dev/urandom > /tmp/probe.mp3
curl -o /dev/null -w '%{http_code}\\n' -X PUT --data-binary @/tmp/probe.mp3 "<url signée pour 100000>"  # attendu 200
head -c 200000 /dev/urandom > /tmp/probe2.mp3
curl -o /dev/null -w '%{http_code}\\n' -X PUT --data-binary @/tmp/probe2.mp3 "<même url>"              # attendu 403
\`\`\`
Si R2 refuse le \`content-length\` signé (200 jamais atteignable), on s'arrête là et on note le trou résiduel : l'auth + la garde BYOK ont déjà supprimé le chemin d'abus anonyme.`,
      },
      {
        name: 'Retirer MISTRAL_API_KEY des variables Vercel',
        owner: 'arnaud', tags: ['securite'],
        desc: `Plus aucun chemin applicatif ne lit \`process.env.MISTRAL_API_KEY\` : les replis ont été supprimés et le typage prouve désormais le BYOK.

La retirer de Vercel (Production + Preview + Development) transforme la garantie logique en garantie physique.

**⚠️ La garder dans \`.env.local\`** : les scripts \`scripts/test-voxtral*.ts\` et \`test-mistral-cloud.ts\` la lisent directement.`,
      },
      {
        name: 'Ajouter .env.example et un fichier LICENSE',
        owner: 'claude', tags: ['infra'],
        desc: `Deux écarts doc/code peu coûteux à combler.

${SOCLE}
- \`README.md:35\` renvoie à \`.env.example\` — **le fichier n'existe pas**
- \`README.md\` promet « Source-available license. See LICENSE for details. » — **aucun LICENSE**

**\`.env.example\`** : uniquement les **noms**, jamais de valeurs. Doit inclure ceux que le code lit mais qui manquent dans \`.env.local\` : \`ENCRYPTION_KEY\` (sans lui le BYOK est cassé en local), \`R2_ACCOUNT_ID\`, \`R2_ACCESS_KEY_ID\`, \`R2_SECRET_ACCESS_KEY\`, \`R2_BUCKET_NAME\`, \`R2_PUBLIC_URL\`.

**LICENSE** : décision actée = AGPL-3.0. Poser le texte réel + corriger la ligne du README. Peut attendre le Lot 3, mais la contradiction du README est à corriger dès maintenant.`,
        check: ['.env.example', 'LICENSE AGPL-3.0', 'Corriger la ligne licence du README'],
      },
      { name: 'Ignorer supabase/.temp (identifiants DB du pooler)', owner: 'claude', tags: ['securite'], done: true, desc: 'Commit `4e34c58`. Vérifié : jamais présent dans l\'historique.' },
      { name: 'Committer et pousser le moteur persona V2 (~4 200 lignes)', owner: 'claude', tags: ['produit'], done: true, desc: 'Commit `23e9a36`. Le code n\'existait que sur le disque.' },
      { name: 'Remettre V1 en moteur persona par défaut', owner: 'claude', tags: ['produit'], done: true, desc: 'Commit `0851ef1`. V2 était par défaut alors qu\'il ne persiste pas : tout import perdait son analyse au rechargement. Régression active corrigée.' },
      { name: 'Fermer /api/upload-url, supprimer /api/upload, BYOK strict', owner: 'claude', tags: ['securite'], done: true, desc: 'Commit `b4a9454`. `/api/upload-url` était ouverte (URLs d\'écriture R2 pour n\'importe qui). `/api/upload` était le seul endroit où un inconnu pouvait dépenser la clé Mistral de l\'hébergeur.' },
      { name: 'Écrire la migration RLS et la procédure d\'audit', owner: 'claude', tags: ['securite'], done: true, desc: 'Commit `c707425`. `docs/SECURITE-RLS.md` + `docs/STRATEGIE.md`. **La migration reste à appliquer.**' },
      { name: 'Borner le fetch Supabase du middleware à 4 s', owner: 'claude', tags: ['infra'], done: true, desc: 'Commit `1e19e18`. Un Supabase en pause ne provoque plus de 504 sur tout le site.' },
    ],
  },
  // ==========================================================
  {
    name: '📊 Lot 1 — De quoi publier une consultation',
    desc: '~12 h, 4 séances. Les 3 briques irréductibles avant de pouvoir montrer ou vendre quoi que ce soit : des métriques qui veulent dire quelque chose, un lien public, un livrable propre.',
    cards: [
      {
        name: 'Corriger l\'échappement HTML de l\'export',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 2** · ~1 h · Premier de la séance : purement défensif, sans dépendance.

**Deux défauts distincts dans \`lib/csv-analysis/export.ts:81-109\`**
1. **Aucun échappement d'entités.** Un verbatim contenant \`<img src=x onerror=…>\` est du XSS stocké dès l'ouverture du fichier. Le risque devient sérieux dès que le rapport est publié (carte « page /r/[token] »).
2. **L'ordre des opérations est faux de toute façon.** \`.replace(/\\*\\*(.+?)\\*\\*/g, …)\` s'applique au document entier : un \`**\` littéral dans un verbatim devient du gras, et toute ligne commençant par \`- \` devient un \`<li>\`.

**Correctif : arrêter de repasser par Markdown.** Construire le HTML directement depuis \`FinalAnalysis\`, en miroir de la traversée de \`generateMarkdown\` (qui reste inchangé).

⚠️ \`esc()\` doit faire **une seule passe** sur \`/[&<>"']/\`. Cinq \`.replace()\` chaînés produiraient \`&amp;lt;\` — c'est le bug classique.

Ne pas oublier le \`<title>\` (ligne 116) qui interpole \`filename\` brut.

${SOCLE}
- \`lib/csv-analysis/export.ts\` (tout le fichier)
- \`types/csv-analysis.ts\` — la structure à traverser

**Vérification** : \`scripts/csv-export-check.ts\` lancé avec \`tsx\` (même convention que \`scripts/persona-v2-validate.ts\`), sur une fixture dont le verbatim vaut \`a < b & "c" <script>alert(1)</script> **gras** - tiret\`. Doit contenir \`&lt;script&gt;\`, et **ne pas** contenir \`<strong>\` ni \`<li>\`. Puis ouvrir dans un navigateur : le texte apparaît littéralement, rien ne s'exécute.`,
        check: ['Réécrire generateHTML sans passer par Markdown', 'esc() en une seule passe', 'Échapper aussi le <title>', 'scripts/csv-export-check.ts', 'Ouvrir le HTML produit dans un navigateur'],
      },
      {
        name: 'Factoriser cleanSummaryText dans lib/csv-analysis/text.ts',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 2** · ~15 min · **À faire avant la page \`/r/[token]\`**, sinon elle devient la 4ᵉ copie.

La même fonction de nettoyage existe **3 fois** :
- \`app/api/csv-analysis/synthesize/route.ts:20-37\` (\`extractPlainText\`)
- \`app/csv-analysis/[analysisId]/page.tsx:19-32\`
- \`components/csv-analysis/final-report.tsx:7-20\`

**Pourquoi elle existe** : \`lib/llm/gemini.ts:23\` force \`responseMimeType: 'application/json'\` et \`lib/llm/mistral.ts:45\` force \`response_format: json_object\` — **inconditionnellement**. Or le prompt du résumé global (\`synthesize/route.ts:144\`) se termine par « Réponds UNIQUEMENT avec le texte du résumé, sans JSON ni balises. » Contradiction directe : le \`global_summary\` stocké est pollué et l'UI le récure à chaque rendu.

Factoriser d'abord (\`lib/csv-analysis/text.ts\`). Traiter la cause (mode JSON conditionnel) est un chantier distinct — le noter, ne pas l'ouvrir ici.

${SOCLE}`,
      },
      {
        name: '⭐ Module de métriques participant (consensus / divergence / minorités)',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 2** · ~2 h 30 · **La carte la plus importante du backlog.**

C'est le différenciateur revendiqué, et il n'est codé nulle part : zéro occurrence de \`consensus|divergen|minorit|désaccord\` dans le module CSV.

**Le défaut à corriger, qui EST la fonctionnalité** : les compteurs actuels comptent des **verbatims**, pas des **personnes**. Un participant qui écrit 8 fois sur un thème est indiscernable de 8 participants. Un rapport affichant « ⚠️ 24 » se lit spontanément « 24 personnes ». Sur un livrable payant, c'est le principal risque de crédibilité.

**Tout est déjà en base** : \`participant_id\` sur chaque quintuplet, \`unique_participants[]\` sur chaque tag et cluster. **Zéro appel LLM supplémentaire**, calcul déterministe — et « c'est le code qui compte, pas l'IA qui l'affirme » est exactement l'argument dont a besoin un usage civique.

**Où** : \`lib/csv-analysis/participant-metrics.ts\`, module **pur** (pas de React, pas de Supabase, pas d'I/O) pour être importable à la fois par le composant client \`final-report.tsx\` et par la page serveur \`/r/[token]\`.

**Calculé à la lecture, pas stocké** : toutes les analyses existantes gagnent la fonctionnalité gratuitement, et un nombre stocké que personne ne peut recalculer contredit frontalement l'argument d'auditabilité. \`METRICS_VERSION = 1\` affiché en pied de rapport gère la seule vraie objection.

**⚠️ La règle anti-double-comptage — le cœur du sujet**
Invariant : *un participant pèse au plus une unité dans tout dénominateur, et sa polarité est décidée une seule fois par périmètre.*
1. **Dédupliquer par \`q.id\` d'abord** — \`cluster/route.ts:86-88\` ne déduplique pas, le LLM peut lister un même index sous deux tags.
2. Trois \`Set<participant_id>\` : P, N, S.
3. Classes disjointes : \`mixed = P ∩ N\`, \`positive_only = P \\ N\`, \`negative_only = N \\ P\`. **S n'est pas une polarité** — une suggestion n'est ni accord ni désaccord ; la compter gonflerait un camp.
4. \`consensus_rate = max(|positive_only|, |negative_only|) / |polarisés|\`, avec **\`mixed\` au dénominateur et dans aucun numérateur** : un ambivalent fait baisser le consensus sans être compté comme d'accord avec un camp.
5. \`stance = 'thin'\` si moins de 4 polarisés — **ne jamais annoncer un consensus sur deux personnes**.
6. **Métriques de cluster calculées depuis l'union, jamais en sommant les tags** — sinon un participant positif sur A et négatif sur B est compté deux fois.
7. **Position minoritaire** = camp ≥ 2 participants, ≤ 25 % du cluster, et **internement cohérent** (\`camp ∩ mixed = ∅\`). « Peu nombreux mais constants » est exactement cette conjonction. Attacher les \`quintuplets\` justificatifs à l'objet : l'affirmation porte sa propre preuve.
8. **Dénominateur** : \`step_1_parsed.total_participants\`, **pas** \`FinalAnalysis.total_participants\` (qui ne compte que ceux ayant produit ≥ 1 quintuplet, \`synthesize/route.ts:121-123\`). Sinon un rapport payant surestime sa couverture.

${SOCLE}
- \`types/csv-analysis.ts\` — types à étendre **strictement additivement** (ne pas toucher \`Quintuplet\`/\`NormalizedTag\`/\`AnalysisCluster\`/\`FinalAnalysis\` : ils décrivent du JSONB déjà sur disque)
- \`app/api/csv-analysis/cluster/route.ts:85-121\` — la reconstruction de traçabilité avec laquelle les métriques doivent être cohérentes
- \`app/api/csv-analysis/synthesize/route.ts:121-132\`
- Plan détaillé §6.1`,
        check: [
          'Types additifs dans types/csv-analysis.ts',
          'dedupeById + buildParticipantBreakdown',
          'computeMetrics / computeTagMetrics / computeClusterMetrics',
          'findMinorityPositions',
          'computeAnalysisMetrics avec dénominateur surchargeable',
        ],
      },
      {
        name: 'Script de contrôle des métriques',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 2** · ~30 min · Il n'existe aucun runner de test dans le dépôt — suivre la convention en place : un script lancé avec \`tsx\`, comme \`scripts/persona-v2-validate.ts\`.

\`scripts/csv-metrics-check.ts\`, assertions d'invariants :
- \`breakdown.all.length === cluster.unique_participants.length\` pour chaque cluster
- \`positive_only + negative_only + mixed === polarised_count\`
- \`consensus_rate + divergence_rate + mixed_share ≈ 1\`
- \`sum(verbatim_counts) === nombre de quintuplets dédupliqués\`

**La fixture qui compte** : un participant, 8 négatifs sur un tag → \`negative.length === 1\` et \`verbatim_counts.negative === 8\`. **C'est la régression pour laquelle toute la fonctionnalité existe.**

**Ce que tu peux m'envoyer** : un export JSON d'une vraie analyse (l'anonymiser si c'est ÉcoSol) pour valider sur données réelles.`,
      },
      {
        name: 'Afficher consensus, divergences et minorités dans le rapport',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 3** · ~2 h 45 · **Dépend de** : le module de métriques.

**Indépendamment valorisable** : même si le partage public ne se fait jamais, cette carte à elle seule transforme le livrable.

**Dans \`components/csv-analysis/final-report.tsx\`**
- Bloc « Consensus et divergences » sous le résumé exécutif : jusqu'à 3 cartes de \`most_divergent\`, jusqu'à 3 de \`minority_positions\`.
- **Chaque chiffre est un \`<button>\` qui déplie les verbatims sous-jacents.** Réutiliser le pattern \`expanded\` de \`cluster-view.tsx:12-38\`, ne pas inventer une nouvelle interaction. C'est ce qui satisfait « chaque nombre cliquable vers ses verbatims ».
- **En-tête de cluster** : garder \`✅ 15 ⚠️ 24 💡 12\` mais **l'étiqueter \`verbatims\`**, et ajouter une seconde ligne participants : \`19 participants se sont exprimés · 4 pour / 13 contre / 2 nuancés · consensus 76 % (contre)\`. *Étiqueter les compteurs existants est déjà la moitié du correctif.*
- **Puce de posture** par tag et cluster, avec tooltip donnant la formule **et les IDs de chaque camp** (\`components/ui/tooltip.tsx\` existe). Le tooltip **est** la piste d'audit.
- Remplacer les 3 chaînes \`.filter().map().filter(indexOf)\` dupliquées (\`final-report.tsx:132,153,174\`) par des lectures du module. Idem \`cluster-view.tsx:20-26\`.

**Pied de rapport, non négociable** : « Métriques v1 — consensus = plus grand camp / participants polarisés. Les participants nuancés comptent au dénominateur, pas au numérateur. Les suggestions sont exclues du calcul de polarité. »

Miroir dans \`generateMarkdown\` (\`lib/csv-analysis/export.ts:46-79\`) pour que l'export corresponde à l'écran.

${SOCLE} · Plan §6.1`,
        check: ['Bloc consensus/divergences', 'Chiffres cliquables → verbatims', 'Compteurs étiquetés « verbatims » + ligne participants', 'Puce de posture + tooltip', 'Note de méthode en pied', 'Miroir Markdown'],
      },
      {
        name: 'Ajouter le bloc méthodologie au rapport',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 3** · ~30 min · Ce qui fait la différence entre un joli résumé et un livrable qu'on facture.

En fin de rapport :
- répondants du CSV **vs** répondants ayant produit des verbatims (les deux chiffres, cf. le piège du dénominateur)
- questions analysées — \`step_1_parsed.selected_questions\`, écrit par \`extract/route.ts:68\`
- modèle utilisé (\`model_used\`), date, \`METRICS_VERSION\`
- **une phrase sur ce que le LLM a fait vs ce que le code a calculé** : les comptages sont reconstruits en code (\`cluster/route.ts:98-100\`). C'est un vrai différenciateur face à « une IA a écrit ça ».

${SOCLE}`,
      },
      {
        name: 'Relire le rapport enrichi sur une vraie analyse',
        owner: 'arnaud', tags: ['produit'],
        desc: `**Séance 3, à la fin.** Ton œil d'UX sur le vocabulaire, pas sur le code.

Questions à te poser en lisant :
- « consensus », « divergence », « nuancé », « peu d'avis » — est-ce que ces mots veulent dire quelque chose pour quelqu'un qui découvre ?
- Est-ce qu'on comprend, sans explication, que les compteurs ✅⚠️💡 sont des verbatims et pas des personnes ?
- Est-ce qu'un chiffre donne envie de cliquer pour voir d'où il vient ?
- Est-ce que tu oserais l'envoyer à un client tel quel ?

**À me renvoyer** : ce qui te gêne, formulé comme tu le dirais. Le vocabulaire, c'est ton terrain.`,
      },
      {
        name: 'Migration et couche de partage public',
        owner: 'claude', tags: ['produit', 'securite'],
        desc: `**Séance 4** · ~1 h 30 · **⚠️ Dépend durement de** : « Appliquer la migration RLS ». On n'ouvre pas une surface publique sur une table dont la RLS est cassée.

**URL retenue : \`/r/<token>\`** — court, dictable, hors du namespace \`/csv-analysis/*\`.
Token = \`crypto.randomUUID().replace(/-/g,'')\` : 122 bits, indevinable, donc pas de rate limiting nécessaire.

**Migration** \`20260830000000_add_csv_analysis_share.sql\` : colonnes \`share_token\`, \`share_title\`, \`shared_at\` + **index unique partiel** \`WHERE share_token IS NOT NULL\` (autorise N lignes NULL, garantit l'unicité des jetons vivants, sert la requête).

**⚠️ AUCUNE policy RLS sur ce partage — et c'est délibéré.**
Une policy anon \`FOR SELECT USING (share_token IS NOT NULL)\` est **ligne**-level, pas colonne-level : PostgREST servirait alors \`?select=step_1_parsed&share_token=not.is.null\` à quiconque a la clé anon — c'est-à-dire **le CSV brut de toutes les analyses partagées**.
👉 Lecture **serveur, service role, projection de colonnes explicite** dans \`lib/csv-analysis/share.ts\`. La projection vit en TypeScript, relue en revue, à côté du rendu. Le rôle anon reste à zéro accès — exactement ce que le Lot 0 vient d'établir.

**Exposé** : \`share_title\`, résumé global, titres/synthèses, verbatims + sentiment + question, \`participant_id\` (P1, P7… — pseudonymes, et c'est ce qui rend les chiffres auditables), \`model_used\`.
**Retenu** : \`filename\` (peut nommer l'organisation), \`participant_name\` (**strippé côté serveur** : \`extract/route.ts:137\` recopie la colonne nom du CSV telle quelle, et un export Google Forms contient couramment nom et e-mail), \`step_1_parsed\`, \`step_2/3\`, \`creator_id\`, \`error_message\`.

\`stripParticipantNames\` tourne **dans la projection**, pas dans le composant : la donnée ne doit jamais atteindre le réseau.

${SOCLE} · Plan §6.2`,
        check: ['Migration share_token + index partiel', 'lib/csv-analysis/share.ts (getSharedAnalysis + stripParticipantNames)', 'Ne jamais faire select(\'*\')', 'Filtrer sur status = complete'],
      },
      {
        name: 'Page publique /r/[token] et bascule de partage',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 4** · ~1 h 45 · **Dépend de** : la couche de partage.

- \`app/r/[token]/page.tsx\` — **composant serveur** (pas de \`'use client'\`), \`export const dynamic = 'force-dynamic'\` pour que la révocation soit immédiate. La clé service role ne doit jamais atteindre le client.
- \`app/r/[token]/not-found.tsx\` — neutre, indiscernable d'un mauvais jeton, pour que la révocation ne soit pas confirmable.
- \`components/csv-analysis/public-report-header.tsx\` — **le \`Header\` actuel est inutilisable ici** : il est \`'use client'\`, appelle \`supabase.auth\`, et propose une nav vers des modules inaccessibles à un inconnu. Header minimal : logo, titre public, \`X verbatims · Y participants · Z thèmes\`, date, et un discret « Rapport généré avec OpenScribe » — **ce lien est la boucle de croissance, il a sa place**.
- \`app/api/csv-analysis/sessions/[id]/share/route.ts\` — POST idempotent (renvoie le jeton existant) / DELETE. Client **anon**, pas admin, pour que RLS revérifie la propriété.
- Bascule dans \`app/csv-analysis/[analysisId]/page.tsx\` près du sélecteur de vue (lignes 206-223), conditionnée à \`status === 'complete'\`. Avec l'URL copiable, le champ titre public, et l'avertissement : « Toute personne disposant du lien pourra lire le rapport et les verbatims. Les noms des participants ne sont pas publiés. »

\`sessions/[id]/route.ts:20\` fait déjà \`select('*')\` : il suffit d'ajouter les 3 colonnes à \`CsvAnalysisSession\`.
Base URL : réutiliser le pattern de \`app/workshop/[sessionId]/page.tsx:247-249\`.

**Vérification**
- fenêtre privée → le rapport s'affiche, sans nav ni invite de connexion
- \`curl … | grep -c "<un nom réel du CSV>"\` → \`0\`
- **et surtout** \`curl "$SB_URL/rest/v1/csv_analysis_sessions?share_token=eq.<token>" -H "apikey: $ANON"\` → \`[]\` — prouve qu'on n'a pas rouvert le trou fermé au Lot 0
- révoquer → 404 ; re-partager → jeton **différent**, l'ancien reste 404

${SOCLE}`,
      },
      {
        name: 'Open Graph, noindex et aperçu de lien',
        owner: 'claude', tags: ['produit', 'contenu'],
        desc: `**Séance 5** · ~1 h · Ce lien est fait pour être envoyé à un journaliste ou posté sur LinkedIn. Sans ça, il s'affiche vide.

- **\`metadataBase\` dans \`app/layout.tsx\`** — sans lui, Next abandonne les chemins d'images OG relatifs et **tous les aperçus sont vides**. Ajouter aussi un \`openGraph\` par défaut et \`twitter: { card: 'summary_large_image' }\` : ça profite à toutes les pages.
- **\`generateMetadata({ params })\`** dans \`/r/[token]\` : titre public, ~160 premiers caractères du résumé, \`openGraph.type: 'article'\`.
- **\`robots: { index: false, follow: false }\`** — les unfurlers (Slack, X, LinkedIn, WhatsApp) lisent l'OG et **ignorent** \`robots\` : on garde le partage sans rendre indexable un lien non listé.
- **Image OG** : \`/public/og-default.png\` statique d'abord (5 min). Puis \`app/r/[token]/opengraph-image.tsx\` avec \`ImageResponse\` de \`next/og\` — **inclus dans Next 16, zéro dépendance** — titre + 3 chiffres clés sur \`#2F40C2\`. ~40 lignes.
- **\`middleware.ts:17\`** : ajouter \`r/\` au négatif du matcher. Aujourd'hui chaque visite publique déclenche un aller-retour Supabase pour rien — et fait dépendre de l'auth Supabase la seule page qui doit marcher quand l'auth est dégradée.

⚠️ Corriger au passage les métadonnées SEO de \`app/layout.tsx:22-39\`, restées sur le produit *transcription seule* (« Jusqu'à 1 Go, durée illimitée ») — ce qui contredit à la fois le plafond client de 2 h et le positionnement 4 modules.

${SOCLE}`,
      },
      {
        name: 'Feuille d\'impression et bouton PDF',
        owner: 'claude', tags: ['produit'],
        desc: `**Séance 5** · ~1 h · **Décision : ne pas ajouter de librairie PDF.**

- Chromium headless (~150-300 Mo) contre la limite de bundle Vercel (250 Mo décompressé) = le mouvement qui casse le déploiement. \`playwright\` n'est aujourd'hui qu'une devDependency de script local ; le promouvoir en dépendance runtime serait l'erreur.
- \`pdfkit\`/\`jspdf\` ne font pas de HTML, et le rapport repose sur ✅⚠️💡 que les polices PDF de base ne contiennent pas.
- \`@react-pdf/renderer\` = écrire le rapport une troisième fois, dans un arbre parallèle qui divergera.
- Le moteur d'impression du navigateur est gratuit, gère polices, emoji et pagination — **et le client génère son PDF au moment où il en a besoin, toujours à jour.**

**Feuille \`@media print\` sous une classe \`.report-print\` dans \`app/globals.css\`**
- \`@page { size: A4; margin: 18mm 15mm; }\`
- \`.no-print { display: none !important; }\`
- **forcer le thème clair** : les tokens \`bg-card\`/\`text-foreground\` s'impriment en aplats sombres sinon
- \`break-inside: avoid\` sur les cartes, \`break-after: avoid\` sur les titres
- **⚠️ forcer l'ouverture de tous les blocs repliables** — un cluster replié s'imprime en boîte vide, c'est l'écueil que tout le monde rencontre
- \`a[href^="http"]::after { content: " (" attr(href) ")"; }\`

Plus un petit bouton client « Imprimer / PDF » appelant \`window.print()\`, avec l'indication « Destination : Enregistrer au format PDF ».

${SOCLE}`,
      },
      {
        name: 'Vérifier l\'aperçu du lien dans Slack et LinkedIn',
        owner: 'arnaud', tags: ['produit'],
        desc: `**Séance 5, à la fin.** Ça ne se teste qu'en vrai.

- Coller le lien dans Slack → l'aperçu doit montrer titre, description et image
- LinkedIn Post Inspector : https://www.linkedin.com/post-inspector/
- Un test d'impression → PDF : vérifier qu'aucun thème sombre ne passe, et qu'aucun bloc n'est vide

**À me renvoyer** : une capture si l'aperçu est cassé.`,
      },
    ],
  },
  // ==========================================================
  {
    name: '📣 Vitrine — la consultation citable',
    desc: 'Fin sept. → oct. ~3 h de dev, ~4 semaines de calendrier. Le seul objectif qui compte à 3 mois. Tu es ton propre premier client.',
    cards: [
      {
        name: '⭐ Choisir la question de la consultation-vitrine',
        owner: 'arnaud', tags: ['strategie', 'contenu'],
        desc: `**Le sujet est le canal d'acquisition.** Il doit intéresser autant toi que les gens que tu veux ensuite comme clients — praticiens du design et de la recherche, associations, collectifs.

Exemple de veine : *« Comment l'IA change-t-elle réellement le travail de recherche et de design ? »*

**Critères**
- Une question dont **toi** tu veux vraiment connaître la réponse (sinon la restitution sonnera creux)
- Un sujet qui produit du **désaccord** — sans divergence, les métriques consensus/minorités n'ont rien à montrer, et c'est précisément ce qu'on veut démontrer
- 4 à 8 questions ouvertes maximum : au-delà, le taux de complétion s'effondre
- Un sujet dont tu assumes la publication intégrale

**Ce que tu peux me demander** : t'aider à formuler le questionnaire, ou critiquer un brouillon.`,
        check: ['Sujet arrêté', 'Questions ouvertes rédigées', 'Mention de consentement à la publication', 'Formulaire créé'],
      },
      {
        name: 'Diffuser et collecter 80 à 200 réponses',
        owner: 'arnaud', tags: ['contenu'],
        desc: `**~4 semaines de calendrier**, très peu d'effort — c'est pendant cette fenêtre que le Lot 2 se développe en parallèle.

Canaux : LinkedIn, communautés UX, réseau personnel, newsletters.

**Le consentement est acquis par construction** (participation publique et volontaire) — c'est ce qui rend cette consultation publiable.

**Seuils**
- < 50 réponses : les métriques de consensus seront majoritairement \`thin\`, peu démonstratif
- 80–200 : la bonne zone
- \\> 200 : attention au temps de pipeline (1 appel LLM par participant, séquentiel, \`maxDuration = 300\`)`,
      },
      {
        name: 'Analyser et publier le résultat',
        owner: 'both', tags: ['produit'],
        desc: `**Dépend de** : tout le Lot 1 + le compteur d'usage (Lot 2).

**⚠️ Le compteur d'usage doit être en place AVANT cette analyse** : c'est elle qui donnera le coût réel d'une analyse à ~150 participants, donc le seul chiffre légitime pour calibrer le palier gratuit. Une occasion qui ne se représente pas à l'identique.

1. Export CSV du formulaire
2. Analyse avec ta propre clé (aucun besoin de la clé serveur)
3. Relecture : est-ce que la synthèse dit vrai ? Est-ce que les minorités remontées sont justes ?
4. Titre public soigné (il apparaît dans l'aperçu Slack/LinkedIn)
5. Activer le partage → \`/r/<token>\`

**À me renvoyer** : le CSV (ou son export d'analyse) si tu veux que je relise la restitution.`,
        check: ['Compteur d\'usage en place', 'Analyse lancée', 'Relecture de la synthèse', 'Titre public', 'Lien publié'],
      },
      {
        name: 'Relayer et démarcher 3 à 5 prospects',
        owner: 'arnaud', tags: ['strategie'],
        desc: `**Le premier client payant se déduit de la vitrine, pas l'inverse.**

1. Publier le résultat là où la question a été diffusée
2. Repérer, parmi ceux qui ont participé ou réagi, ceux qui ont un besoin de consultation
3. Les solliciter avec le lien : « voici ce que ça donne » — pas « voici ce que ça pourrait donner »
4. Proposition : cadrage + analyse + restitution, **500–1 500 €**

Le prix se cale sur le premier prospect, pas à l'avance. La bonne question à poser n'est pas « est-ce que ça vous plaît ? » mais **« combien cela vaut-il pour vous ? »**`,
      },
    ],
  },
  // ==========================================================
  {
    name: '🚪 Lot 2 — Enlever les portes',
    desc: 'Octobre, en parallèle de la collecte. Le lot qui transforme une prestation en produit. Ordre imposé : on ne plafonne pas ce qu\'on ne mesure pas.',
    cards: [
      {
        name: '⭐ Compteur d\'usage LLM (en premier)',
        owner: 'claude', tags: ['infra'],
        desc: `**~2 h · À faire AVANT la clé serveur ET avant l'analyse de la vitrine.**

Aujourd'hui, **les données d'usage sont reçues puis jetées** :
- \`lib/llm/mistral.ts:65-67\` ne garde que \`choices[0].message.content\` — l'objet \`usage\` renvoyé par l'API est perdu
- \`lib/llm/gemini.ts:26\` ne garde que \`result.text\` — \`usageMetadata\` est perdu

La capacité existe déjà ailleurs dans le dépôt : \`lib/mistral.ts:245-247\` type déjà \`prompt_tokens\`/\`completion_tokens\` (côté transcription). Elle n'est simplement pas branchée sur le chemin LLM.

**Où brancher** : dans le **client LLM lui-même**, pas dans les routes — sinon c'est à écrire 5 fois.

**Table \`llm_usage\`** : user, module, session, provider, modèle, tokens in/out, coût estimé, horodatage. Écriture en service role. RLS activé, lecture réservée au propriétaire.

**Livrable réel** : le **coût mesuré** d'une analyse à 150 participants. C'est ce chiffre, et lui seul, qui fixe le palier gratuit. L'ordre de grandeur attendu est de quelques centimes par analyse (Flash-Lite, \`temperature: 0\`) — donc quelques € par mois pour un palier gratuit généreux — mais **c'est à mesurer, pas à croire**.

${SOCLE}
- \`lib/llm/gemini.ts\`, \`lib/llm/mistral.ts\`, \`lib/llm/index.ts\`
- \`supabase/migrations/20250222000000_create_transcription_metrics.sql\` — gabarit de table de télémétrie
- \`docs/METRICS_SETUP.md\``,
        check: ['Migration llm_usage', 'Lecture de usageMetadata (Gemini)', 'Lecture de data.usage (Mistral)', 'Écriture dans le client LLM, pas dans les routes', 'Grille de prix par modèle', 'Mesurer une analyse réelle'],
      },
      {
        name: 'Clé serveur avec quota et plafond de dépense',
        owner: 'claude', tags: ['infra', 'produit'],
        desc: `**~4 h · Dépend de** : le compteur d'usage.

\`getUserApiKey()\` (\`lib/user-api-keys.ts:10-33\`) **lève** aujourd'hui s'il n'y a pas de clé. Il devra retomber sur une clé opérateur, **sous quota vérifié avant l'appel**.

- N analyses / mois, M participants max par analyse
- **Plafond de dépense global** qui coupe le service plutôt que de produire une facture surprise
- BYOK conservé comme mode **illimité** et argument de confiance

**⚠️ Prérequis fonctionnel** : le retry/backoff (carte suivante). Avec une clé opérateur partagée, le risque de 429 augmente mécaniquement — ce point cesse d'être cosmétique.

**À corriger en même temps** : en l'absence de clé, les routes CSV/workshop renvoient aujourd'hui \`No API key configured for gemini\` **en anglais et en HTTP 500**, parce que ce message ne matche aucun détecteur de \`lib/llm/user-facing-error.ts\`. Devrait être un 403 en français, comme le fait déjà \`app/api/transcribe/route.ts:58-65\`.

${SOCLE}`,
      },
      {
        name: 'Retry et backoff sur le pipeline CSV',
        owner: 'claude', tags: ['infra'],
        desc: `**~2 h · Prérequis de la clé serveur.**

**Asymétrie actuelle** : \`lib/mistral.ts:19-110\` implémente un backoff exponentiel avec jitter sur 429/500/502/503 — mais **uniquement pour la transcription**. Le pipeline CSV, lui, est un \`fetch\` nu (\`lib/llm/mistral.ts:51-63\`) et un appel SDK nu (\`lib/llm/gemini.ts:17\`).

**Conséquence** : le pipeline enchaîne \`P + C + 2\` appels séquentiels (P = participants, C = clusters). Un seul 429 au 47ᵉ participant sur 60 **détruit l'étape entière et tout le travail déjà payé** — \`step_2_quintuplets\` n'est écrit qu'une fois, à la fin (\`extract/route.ts:155-163\`).

**À traiter** : réutiliser le \`fetchWithRetry\` existant plutôt qu'en écrire un second, et envisager une sauvegarde partielle par lots.

${SOCLE}`,
      },
      {
        name: 'Créer un compte Resend et configurer le SMTP Supabase',
        owner: 'arnaud', tags: ['infra'],
        desc: `Prérequis du magic link.

Le SMTP intégré de Supabase est limité aux adresses de l'organisation et explicitement destiné aux tests — inutilisable pour de vrais utilisateurs.

**Resend** : palier gratuit de l'ordre de 3 000 mails/mois, ~100/jour (à vérifier au moment de le faire — les paliers bougent). Largement suffisant pour démarrer.

Puis : Supabase → Authentication → SMTP Settings.

**À me renvoyer** : confirmation que le SMTP est configuré, pour que j'enchaîne sur le magic link.`,
      },
      {
        name: 'Ajouter l\'authentification par magic link',
        owner: 'claude', tags: ['produit'],
        desc: `**~2 h · Dépend de** : le SMTP Resend.

Google OAuth est aujourd'hui **le seul provider réellement branché** (\`components/auth/auth-modal.tsx:89\`) — le magic link est documenté dans le README et le BLUEPRINT mais **n'existe nulle part dans le code** (aucun \`signInWithOtp\`).

**Le terrain est déjà préparé** : les clés de traduction \`auth.modal.email\`, \`auth.modal.password\`, \`auth.modal.checkEmail\` existent dans \`lib/i18n/translations.ts\` et sont **orphelines** — rien ne les rend.

Exiger un compte Google est une porte de plus sur un produit qui en a déjà trop.

${SOCLE}`,
      },
    ],
  },
  // ==========================================================
  {
    name: '🌍 Lot 3 — Ouvrir',
    desc: 'Nov. 2026 → janv. 2027. Licence, dépôt public, récit civique. Rien ici ne commence avant que le Lot 0 soit intégralement appliqué.',
    cards: [
      {
        name: 'Poser la licence AGPL-3.0 et corriger le README',
        owner: 'claude', tags: ['strategie'],
        desc: `Décision actée. **Après le Lot 0, jamais avant.**

- Fichier \`LICENSE\` avec le texte AGPL-3.0 réel
- Corriger \`README.md\` qui promet « Source-available license. See LICENSE for details. » alors qu'aucun LICENSE n'existe — sur un dépôt public, absence de licence = **tous droits réservés**, l'inverse exact de la promesse
- Mention de la double licence commerciale
- **CLA ou DCO** : indispensable **avant** toute contribution externe, sinon la double licence devient impossible dès la première PR fusionnée. Ça ne se rattrape pas.

${SOCLE}`,
        check: ['LICENSE AGPL-3.0', 'README corrigé', 'Mention double licence', 'CONTRIBUTING.md avec DCO'],
      },
      {
        name: 'Corriger les écarts entre la doc et le code',
        owner: 'claude', tags: ['contenu'],
        desc: `Sur un dépôt public, ces écarts coûtent la crédibilité — un lecteur qui vérifie une affirmation et la trouve fausse arrête de lire.

**Écarts recensés**
- \`lib/transcription-cache.ts\` référencé dans \`README.md:146\` et \`BLUEPRINT.md:171,93\` — **le fichier n'existe pas**
- \`.env.example\` référencé dans \`README.md:35\` — n'existe pas (voir carte Lot 0)
- Magic link annoncé dans \`README.md:72\` et \`BLUEPRINT.md:56\` — **non implémenté**
- Aperçu de transcription pour non-authentifiés (\`README.md:175\`) — **supprimé** du code
- \`BLUEPRINT.md:190\` nomme la table \`persona_analysis_sessions\`, le code utilise \`persona_sessions\`
- \`README.md\` décrit encore un produit de transcription seule

${SOCLE}`,
      },
      {
        name: 'Refondre la landing sur « Écouter → Comprendre → Décider »',
        owner: 'claude', tags: ['contenu', 'produit'],
        desc: `Aujourd'hui la landing présente **quatre modules côte à côte**, ce qui dilue la proposition. Personne ne comprend ce que fait le produit.

**Cible** : l'analyse de réponses ouvertes en tête (« Vous avez 500 réponses ouvertes ? Voici ce que votre groupe pense réellement »), les trois autres modules en satellites qui l'alimentent ou la prolongent.

**⚠️ Corriger aussi les métadonnées de \`app/layout.tsx:22-39\`**, restées sur le produit transcription seule : « Transcription pro… Jusqu'à 1 Go, durée illimitée » — ce qui contredit à la fois le plafond client de 2 h (\`upload-zone.tsx:13\`) et le positionnement 4 modules. Aucun \`openGraph\`, aucun \`sitemap\`, aucun canonical non plus.

${SOCLE}
- \`app/page.tsx\`, \`lib/i18n/translations.ts\` (5 langues à mettre à jour)`,
      },
      {
        name: 'Publier les 5 principes sur le site',
        owner: 'claude', tags: ['contenu'],
        desc: `Les 5 principes ne sont pas de la décoration : ce sont **l'argument commercial** face à un acheteur méfiant, et la réponse à « comment savez-vous que votre IA n'a pas effacé les opinions minoritaires ? ».

Une page publique qui les énonce, et qui explique concrètement **ce que le LLM fait vs ce que le code calcule**.

Texte de référence : \`docs/STRATEGIE.md\` §2.`,
      },
      {
        name: 'Passer le dépôt en public',
        owner: 'arnaud', tags: ['strategie'], block: true,
        desc: `**⚠️ Checklist bloquante avant de basculer** — dans l'ordre, aucune exception :

1. Migration RLS **appliquée et vérifiée** (boucle curl anon → \`[]\`)
2. Tables \`persona_sessions\` et \`feedbacks\` documentées et protégées
3. Mot de passe DB tourné
4. \`LICENSE\` en place
5. \`git log --all -- 'supabase/.temp/*'\` vide (✅ déjà vérifié)
6. Aucun \`.env\` dans l'historique (✅ déjà vérifié)
7. Aucune capture cliente versionnée

**Rappel** : l'historique git est public **pour toujours**. Ce qui entre ne sort plus.`,
      },
    ],
  },
  // ==========================================================
  {
    name: '🧊 Gelé / plus tard',
    desc: 'Identifié, arbitré, volontairement pas fait. Ne rien sortir de cette liste avant que le wedge soit prouvé.',
    cards: [
      {
        name: '🧊 Persona V2 — persistance, export, garde auth',
        owner: 'claude', tags: ['produit'],
        desc: `**GELÉ.** C'est le code le plus rigoureux du dépôt et la pièce la plus défendable intellectuellement — c'est aussi celle qui **ne sert pas** l'objectif des 3 mois.

Manques identifiés :
- aucune persistance (\`app/persona/v2/page.tsx\` est 100 % client, résultats perdus au rechargement)
- aucun export CSV/HTML
- aucune garde auth sur sa propre route
- cast \`as unknown as PersonaCluster[]\` pour réutiliser les visualisations de V1
- \`stabilityRuns: 12\` exécutés **synchrones sur le thread principal**, sans worker

**Aussi** : \`persona_sessions\` (V1) est lue et écrite par le code mais **n'a aucune migration** — un environnement neuf perd silencieusement toute analyse sauvegardée (le \`catch\` est vide dans \`new/page.tsx:160-162\`).

**Ne dégeler que si** le wedge est prouvé, ou si un client paie explicitement pour du persona.`,
      },
      {
        name: '🧊 Relier la transcription à l\'analyse',
        owner: 'claude', tags: ['produit'],
        desc: `**GELÉ jusqu'après la preuve commerciale.**

C'est **la** connexion qui transformerait « 4 applications » en « 1 pipeline », et qui rendrait vrai le récit Écouter → Comprendre → Décider.

Aujourd'hui : la transcription **n'est jamais persistée** (elle vit en state React, perdue au rechargement) et le seul pont est un copier-coller manuel vers l'import workshop.

Le parcours cible — atelier → transcription → extraction des contributions → clusters → désaccords → synthèse → réaction du groupe — est très fort, notamment en contexte politique. Mais il n'est pas nécessaire à la première vente.`,
      },
      {
        name: '🧊 Brique DECIDE — vote, priorisation, compromis',
        owner: 'both', tags: ['produit'],
        desc: `**La cinquième brique**, celle qui manque au cycle et qui donne son sens à la thèse.

Collecter → comprendre → représenter → **décider**.

Piste : une fois les consensus, divergences et positions minoritaires visibles, permettre au groupe de **réagir à la synthèse** (la contester, l'amender, arbitrer entre compromis).

⚠️ Principe n°4 à tenir : le participant ne paie jamais et n'a pas besoin de compte. Toute brique de vote doit rester ouverte aux anonymes — ce que la page participant du workshop sait déjà faire.

À instruire en 2027, pas avant.`,
      },
      {
        name: '🧊 Remplacer le SELECT public sur workshop_responses',
        owner: 'claude', tags: ['securite'],
        desc: `**Dette de sécurité assumée et documentée** (\`docs/SECURITE-RLS.md\` §4).

\`workshop_responses\` garde \`SELECT USING (true)\` : un porteur de la clé anon peut énumérer les réponses de **tous** les ateliers.

**Pourquoi c'est conservé** : Supabase Realtime applique les policies RLS pour décider de la livraison des \`postgres_changes\`, et \`participate/page.tsx:88-112\` s'abonne en tant qu'**anon non authentifié**. Restreindre ce SELECT couperait le mur des réponses en direct — **silencieusement**, sans lever la moindre erreur.

**Piste** : jeton de session côté participant, avec une policy qui filtre sur ce jeton plutôt qu'un SELECT global.

⚠️ Toute tentative doit être validée par le test de non-régression n°1 : atelier live en fenêtre privée, les deux écrans doivent se mettre à jour.`,
      },
      {
        name: '🧊 Tests et intégration continue',
        owner: 'claude', tags: ['infra'],
        desc: `**Aucun runner de test dans le dépôt.** Aucun \`.github/\`, aucune CI. \`playwright\` n'est présent que pour le script de capture d'écran.

En attendant, la convention retenue est le **script exécuté avec \`tsx\`** (\`scripts/persona-v2-validate.ts\`, et les \`csv-metrics-check\`/\`csv-export-check\` du Lot 1).

**Aussi** : \`npm run lint\` remonte aujourd'hui **8 erreurs préexistantes** (setState synchrone dans des effets, \`prefer-const\`, création de composant pendant le rendu) réparties sur 8 fichiers déjà committés. Elles ne bloquent pas le build, mais elles empêchent d'utiliser le lint comme portail.

Une CI minimale — \`tsc --noEmit\` + \`build\` sur chaque push — serait le premier pas utile, et devient nettement plus important le jour où le dépôt est public et accepte des contributions.`,
      },
    ],
  },
  // ==========================================================
  {
    name: '✅ Fait',
    desc: 'Les cartes marquées « fait » du Lot 0 y sont déplacées automatiquement par le script.',
    cards: [],
  },
];

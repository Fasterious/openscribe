# Modules en réserve : personas, workshop, transcription, analyse CSV

Avant l'application actuelle (Vite, tout dans le navigateur), OpenScribe était une application Next.js avec un serveur
(Supabase pour les comptes et la base, stockage des fichiers audio). Plusieurs modules y ont été construits, puis mis en
retrait pour se concentrer sur la Synthèse. **Leur code n'est pas perdu** : il reste dans l'historique et dans des
branches d'archive, à ne jamais supprimer. Ce document dit où trouver chaque module et comment le récupérer.

Les branches se citent par leur nom, pas par un identifiant de commit.

## Les branches d'archive

| Branche | Ce qu'elle contient |
|---|---|
| `archive/application-nextjs` | **Le dernier état de l'ancienne application (23/08/2026)** : personas V1 et V2, workshop, transcription Voxtral, analyse CSV, comptes, clés par utilisateur. C'est la référence pour tous les modules ci-dessous. |
| `archive/whisper-runpod` | La toute première transcription (02/2026) : WhisperX sur un serveur RunPod, avant Voxtral. |
| `archive/email-password-auth` | La connexion par e-mail et mot de passe, retirée du MVP (problèmes de réinitialisation documentés dans `docs/AUTH_EMAIL_PASSWORD.md` de la branche). |

## Personas

Regrouper les répondants d'un questionnaire quantitatif (échelles de Likert) en personas.

- **Interface** : `app/persona/` (dont `app/persona/v2/`), `components/persona/` (V1 : tableau, corrélations, radar,
  carte de chaleur), `components/persona-v2/`.
- **Moteur** : `lib/persona/clustering.ts` (V1 : corrélations, cohésion par sous-espace) et `lib/persona-v2/` (V2 :
  motifs surprenants, stabilité, sous-espaces, consolidation ; entièrement côté navigateur).
- **Types et données d'essai** : `types/persona.ts`, `types/persona-v2.ts`, `public/samples/persona-demo-50.csv`
  (50 répondants fictifs).
- **Conception** : `docs/persona/THESE-PERSONA.md`, `THESE-PERSONA-V2.md`, `THESE-PERSONA-V3.md` (la V3 consolidée sert
  de référence à `lib/persona-v2`) ; banc de validation : `scripts/persona-v2-validate.ts`.
- **Pour le réintégrer** : la V2 est du TypeScript pur, sans serveur ; c'est le module le plus simple à porter dans
  `src/core/` (logique) et `src/ui/` (écrans). La V1 enregistrait ses analyses côté serveur (`app/api/persona/`).

## Workshop (atelier en direct)

Poser une question à une salle, recueillir les réponses en temps réel (QR code, lien), puis les analyser.

- **Interface** : `app/workshop/` (création, session avec QR code, page de participation, regroupements, nuage de mots,
  réponses brutes), `components/workshop/` (import de réponses).
- **Serveur et analyse** : `app/api/workshop/`, `lib/llm/workshop-prompts.ts`, `types/workshop.ts`.
- **Base** : Supabase, `supabase/migrations/20260313000000_create_workshop_tables.sql` ; jeux d'essai fictifs
  `supabase/seed_workshop_20_responses.sql` et `seed_workshop_100_responses.sql`.
- **Pour le réintégrer** : la collecte en direct a besoin d'un serveur partagé entre participants, ce qui heurte le
  principe « local d'abord, aucune donnée sur nos serveurs ». À trancher avant de le porter (par exemple : le chercheur
  héberge la collecte, ou un service tiers choisi par lui). L'analyse, elle, se ferait avec la méthode commune.

## Transcription

Transcrire un entretien audio, avec identification des locuteurs.

- **Interface** : `app/transcription/page.tsx`, `components/transcription/` (dépôt du fichier, suivi, lecteur de
  transcription, choix de la langue).
- **Serveur** : `app/api/transcribe/`, `lib/mistral.ts` (Voxtral), `lib/r2.ts` (stockage temporaire de l'audio) ;
  scripts d'essai `scripts/test-voxtral.ts`, `test-voxtral-local.ts`, `test-mistral-cloud.ts`.
- **Version WhisperX** : branche `archive/whisper-runpod` (`app/api/transcribe/`, `app/api/transcribe/[jobId]/`,
  `lib/runpod.ts`).
- **Pour le réintégrer** : c'est le futur module Entretiens et tests (`docs/AVANCEMENT.md`, `docs/VISION.md` :
  Voxtral 3 est le candidat à éprouver). Dans l'application actuelle, l'audio ne passerait plus par nos serveurs :
  appel direct du navigateur au fournisseur, avec la clé de l'utilisateur.

## Analyse CSV (ancienne analyse de questionnaire)

L'ancêtre du module Synthèse : un questionnaire CSV analysé en étapes (idées, regroupements, rapport final).

- **Où** : `app/csv-analysis/`, `components/csv-analysis/`, `lib/csv-analysis/`, `lib/llm/csv-prompts.ts`.
- **Pour le réintégrer** : rien à porter tel quel. La Synthèse actuelle le remplace avec la méthode commune ; le code
  reste utile comme source d'idées (export, tableau des idées).

## Récupérer le code

```bash
# Lire un fichier sans rien changer
git show archive/application-nextjs:lib/persona-v2/engine.ts

# Copier un module dans la branche de travail (puis l'adapter)
git checkout archive/application-nextjs -- lib/persona-v2 components/persona-v2 types/persona-v2.ts

# Faire tourner l'ancienne application à côté, dans un dossier séparé
git worktree add ../openscribe-nextjs archive/application-nextjs
cd ../openscribe-nextjs && npm install && npm run dev   # demande un .env.local (Supabase, clés)
```

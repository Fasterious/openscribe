# OpenScribe - Product Blueprint & PRD

> Document de référence consolidant toutes les décisions stratégiques, techniques et business pour le projet OpenScribe.
> 
> Dernière mise à jour : Février 2026

---

## 1. Vision & Mission

### Vision
Créer l'outil de transcription et d'analyse d'interviews le plus accessible, transparent et simple du marché, principalement destiné aux UX Researchers, mais aussi aux journalistes, étudiants, et professionnels qui ont besoin de transcrire des réunions.

### Mission
Démocratiser l'accès à la transcription de qualité professionnelle avec une approche Open Source, tout en construisant un business viable.

### Valeurs fondamentales
- **Transparence** : Code source visible, pricing clair, coûts réels communiqués
- **Simplicité** : Moins de features, mais excellentes
- **Accessibilité** : Prix abordable vs concurrence enterprise ($50+/user)
- **Open Source** : Le code est visible et accessible

---

## 2. Positionnement Produit

### Marché cible

| Segment primaire | Segment secondaire |
|------------------|-------------------|
| UX Researchers (freelance, petites équipes) | Journalistes |
| | Étudiants (thèses, mémoires) |
| | Professionnels (réunions de travail) |

### Concurrence

| Concurrent | Prix | Positionnement | Notre différenciation |
|------------|------|----------------|----------------------|
| Dovetail | $29-79/user/mois | Enterprise, complet | Plus simple, plus abordable |
| Condens.io | ~€30/user/mois | Interviews UX | Plus transparent, open source |
| Grain | $19-59/user/mois | Meetings | Focus transcription qualité |
| Otter.ai | $16-30/user/mois | Généraliste | Qualité Voxtral, multilingue |

### Proposition de valeur unique
> "Transcription de qualité professionnelle (Voxtral + diarisation), simple, abordable, et transparent."

### Tagline proposé
> "Open source transcription for researchers"

---

## 3. Architecture Technique

### Architecture simplifiée (Voxtral)

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenScribe (CE PROJET)                                        │
│  ─────────────────────────────────────────────────────────────  │
│  Rôle: Application web (frontend + backend)                     │
│  Tech: Next.js, TypeScript, Tailwind, shadcn/ui                │
│  Transcription: Voxtral API (Mistral AI)                       │
│  Storage: Mistral Cloud (fichiers temporaires)                  │
│  Licence: Source-available (visible mais licence commerciale)   │
│  Repo: github.com/[user]/openscribe                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Mistral
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  MISTRAL AI                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  • Voxtral: Transcription audio avec diarisation               │
│  • Cloud Storage: URLs signées temporaires                      │
│  • API synchrone (pas de polling nécessaire)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Stack technique - OpenScribe

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework** | Next.js 16+ (App Router) | Full-stack, SSR, grande communauté |
| **Language** | TypeScript | Type safety, meilleure DX |
| **Styling** | Tailwind CSS v4 | Utilitaire, rapide, CSS natif |
| **UI Components** | shadcn/ui + Radix UI | Moderne, minimaliste, copy-paste |
| **Icônes** | Lucide React | Cohérent, léger, open source |
| **Transcription** | Voxtral (Mistral AI) | Rapide, précis, $0.003/min |
| **Storage temporaire** | Mistral Cloud | URLs signées, pas de coût storage |
| **Auth** | Supabase Auth ✅ | Google OAuth, Magic Links |
| **i18n** | Context React custom ✅ | FR/EN/ES/PT/DE, léger, sans dépendance |
| **Database** | Supabase (Phase 2+) | SQL, RLS, temps réel |
| **Paiement** | Stripe (Phase 3+) | Standard industrie, webhooks |
| **Déploiement** | Vercel | Optimisé Next.js, gratuit pour commencer |

### Architecture globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Landing Page │  │  Auth Pages  │  │  Dashboard   │  │ Transcribe  │ │
│  │ (marketing)  │  │ login/signup │  │  (fichiers)  │  │   (upload)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API ROUTES (Next.js)                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │ /api/upload      │  │ /api/transcribe  │  │ /api/webhooks/stripe  │ │
│  │ (Mistral Cloud)  │  │ (Voxtral sync)   │  │ (paiements)           │ │
│  └──────────────────┘  └──────────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐
│   MISTRAL AI    │    │    SUPABASE     │    │        STRIPE           │
│                 │    │    (Phase 2+)   │    │       (Phase 3+)        │
│ • Voxtral       │    │ • Auth          │    │ • Checkout              │
│ • Cloud Storage │    │ • Database      │    │ • Subscriptions         │
│                 │    │ • Realtime      │    │ • Webhooks              │
└─────────────────┘    └─────────────────┘    └─────────────────────────┘
```

### Flux de transcription (MVP)

```
1. User upload fichier audio via drag & drop
         │
         ▼
2. Frontend envoie le fichier à /api/upload
         │
         ▼
3. Backend upload vers Mistral Cloud et obtient une signed URL
         │
         ▼
4. Backend appelle /api/transcribe avec la signed URL
         │
         ▼
5. Voxtral transcrit l'audio (API synchrone - pas de polling)
         │
         ▼
6. Résultat retourné avec métriques (durée, temps, coût)
```

### Structure de fichiers - OpenScribe (État actuel)

```
openscribe/
├── app/
│   ├── api/
│   │   ├── feedback/route.ts     # Endpoint feedback utilisateur
│   │   ├── transcribe/
│   │   │   ├── route.ts          # Transcription Voxtral
│   │   │   └── [id]/route.ts     # Récupération par ID (post-auth)
│   │   └── upload/route.ts       # Upload vers Mistral Cloud
│   │
│   ├── auth/
│   │   └── callback/route.ts     # OAuth callback Supabase
│   │
│   ├── layout.tsx                # Root layout + i18n provider
│   ├── page.tsx                  # Page principale (transcription)
│   ├── globals.css               # Styles globaux (Tailwind v4)
│   └── favicon.ico
│
├── components/
│   ├── auth/
│   │   └── auth-modal.tsx        # Modal connexion (OAuth + Magic Link)
│   ├── feedback/
│   │   └── feedback-button.tsx   # Bouton feedback flottant
│   ├── transcription/
│   │   ├── upload-zone.tsx       # Zone drag & drop
│   │   ├── progress-tracker.tsx  # Barre de progression
│   │   └── transcript-viewer.tsx # Affichage résultat
│   └── ui/                       # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── language-selector.tsx # Sélecteur FR/EN
│       └── progress.tsx
│
├── lib/
│   ├── i18n/
│   │   ├── context.tsx           # React Context i18n
│   │   └── translations.ts       # Traductions FR/EN/ES/PT/DE
│   ├── supabase/
│   │   ├── client.ts             # Client browser
│   │   ├── server.ts             # Client server
│   │   └── middleware.ts         # Auth middleware utils
│   ├── mistral.ts                # Client Mistral (Voxtral + Cloud)
│   ├── transcription-cache.ts    # Cache pour users non-auth
│   └── utils.ts
│
├── scripts/                      # Scripts de test
│   ├── test-mistral-cloud.ts
│   ├── test-voxtral-local.ts
│   └── test-voxtral.ts
│
├── types/
│   └── index.ts                  # Types TypeScript
│
├── middleware.ts                 # Next.js middleware (auth refresh)
├── .env.local                    # Variables d'environnement
├── .env.example                  # Template
├── package.json
├── components.json               # Config shadcn/ui
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── README.md
```

### Structure prévue - Phases futures

```
openscribe/
├── app/
│   ├── (marketing)/              # Pages publiques (Phase 2+)
│   │   ├── page.tsx              # Landing page / Hero
│   │   ├── pricing/page.tsx      # Page tarifs
│   │   └── about/page.tsx        # À propos
│   │
│   ├── (dashboard)/              # App protégée (Phase 2+)
│   │   ├── layout.tsx            # Auth check + sidebar
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── library/page.tsx      # Bibliothèque de transcriptions
│   │   ├── settings/page.tsx     # Paramètres compte
│   │   └── billing/page.tsx      # Gestion abonnement/crédits
│   │
│   └── api/
│       └── webhooks/
│           └── stripe/route.ts   # Webhooks Stripe (Phase 3+)
│
├── lib/
│   └── stripe/                   # (Phase 3+)
│       ├── client.ts
│       └── webhooks.ts
```

---

## 4. Modèle de données (Supabase - Phase 2+)

### Tables principales

```sql
-- Users (géré par Supabase Auth, extended)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  credits_balance INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free', -- free, pro, team
  subscription_status TEXT, -- active, canceled, past_due
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcriptions
CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  audio_duration_seconds INTEGER,
  language TEXT,
  
  -- Résultat
  transcript_text TEXT,
  transcript_speaker_text TEXT,
  transcript_segments JSONB,
  detected_language TEXT,
  
  -- Metadata
  transcription_time_ms INTEGER,
  cost_usd DECIMAL(10,6),
  credits_used INTEGER,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positif = achat, négatif = usage
  type TEXT NOT NULL, -- purchase, usage, refund, bonus
  description TEXT,
  transcription_id UUID REFERENCES public.transcriptions(id),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transcriptions" ON public.transcriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. Modèle économique

### Stratégie

| Composant | Licence | Accès |
|-----------|---------|-------|
| OpenScribe (webapp) | Source-available | Code visible, usage commercial payant |
| Service hébergé | Commercial | openscribe.com |

### Pricing

| Tier | Prix | Inclus |
|------|------|--------|
| **Free** | 0€ | 30 min/mois, pas de stockage permanent |
| **Pay-as-you-go** | ~0.10-0.15€/min | Achat de crédits (packs 5€, 20€, 50€) |
| **Pro** | 15-25€/mois | X heures/mois incluses, stockage illimité |
| **Team** | 40-60€/user/mois | Collaboration, partage, analytics |

### Coûts estimés

| Poste | Coût estimé |
|-------|-------------|
| **Voxtral (Mistral AI)** | **$0.003/min** de transcription |
| Supabase | Gratuit → 25$/mois (Pro) |
| Vercel | Gratuit → 20$/mois (Pro) |
| Domaine | ~15€/an |

### Marge cible
- Coût réel : ~$0.003/min (~0.003€/min)
- Prix client : ~0.10€/min
- Marge brute : ~97%

---

## 6. Roadmap produit

### Phase 1 - MVP Core (ACTUEL) ✅

**Fonctionnalités:**
- [x] Page d'upload audio (drag & drop)
- [x] Transcription via Voxtral (Mistral AI)
- [x] Upload fichiers via Mistral Cloud (signed URLs)
- [x] Affichage résultat avec speakers
- [x] Métriques de transcription (durée, temps, coût)
- [x] Téléchargement (TXT, JSON)
- [x] Internationalisation (FR/EN/ES/PT/DE) avec sélecteur de langue
- [x] Auth (Google OAuth + Magic Link via Supabase)
- [x] Preview transcription pour utilisateurs non authentifiés
- [x] Cache temporaire pour récupérer transcription après auth
- [x] Système de feedback utilisateur
- [ ] Landing page (hero, features, pricing)
- [ ] Système de crédits basique
- [ ] Paiement Stripe (achat crédits)

**Pas inclus en Phase 1:**
- Stockage permanent des transcriptions
- Abonnements
- Collaboration
- Fonctionnalités IA avancées

### Phase 2 - Storage & Credits

**Fonctionnalités:**
- [x] Authentification Supabase (Google OAuth, Magic Link) ✅
- [ ] Bibliothèque de transcriptions (stockage permanent)
- [ ] Stockage permanent (Supabase Storage ou Database)
- [ ] Système de crédits basique
- [ ] Landing page marketing

### Phase 3 - Monetization

**Fonctionnalités:**
- [ ] Paiement Stripe
- [ ] Abonnements récurrents (Pro)
- [ ] Export formats multiples (SRT, VTT, DOCX)

### Phase 4 - AI Features

**Fonctionnalités:**
- [ ] Résumé automatique IA
- [ ] Extraction de points clés
- [ ] Questions/réponses sur un transcript
- [ ] Analyse multi-transcripts ("thèmes récurrents")
- [ ] Tagging automatique

### Phase 5 - Collaboration & Teams

**Fonctionnalités:**
- [ ] Espaces de travail partagés
- [ ] Commentaires sur segments
- [ ] Partage de transcriptions
- [ ] Rôles et permissions
- [ ] Analytics d'équipe

### Phase 6 - Research Tools (long terme)

**Fonctionnalités:**
- [ ] Collecte feedback (questionnaires)
- [ ] Repository de recherche
- [ ] Intégrations (Notion, Airtable, etc.)

---

## 7. Design & UX

### Principes
- **Minimaliste** : Moins de features, mais excellentes
- **Moderne** : Design épuré, beaucoup d'espace blanc
- **Accessible** : Contraste suffisant, responsive
- **Rapide** : Feedback immédiat, états de chargement clairs

### Palette de couleurs (à définir - voir section Design System)
```css
/* Couleurs actuelles (shadcn/ui defaults avec OKLCH) */
/* À personnaliser pour l'identité OpenScribe */
--primary: oklch(0.205 0 0);     /* Noir/gris foncé */
--background: oklch(1 0 0);       /* Blanc */
--muted-foreground: oklch(0.556 0 0); /* Gris moyen */
```

> **Note**: Un design system complet (palette, typographie, logo) est à définir pour le MVP. Voir le prompt de brief créatif pour travailler avec un designer ou une IA de design.

### Inspirations UI
- Linear (minimalisme, rapidité)
- Notion (simplicité, espace)
- Cal.com (open source feel)
- Stripe (clarté, confiance)

### Internationalisation (i18n) ✅

L'application supporte actuellement 5 langues :
- **Français (FR)** - langue par défaut
- **Anglais (EN)**
- **Espagnol (ES)**
- **Portugais (PT)**
- **Allemand (DE)**

Système i18n custom léger via React Context (`lib/i18n/`). Sélecteur de langue dans le header.

---

## 8. Variables d'environnement

```bash
# .env.example pour OpenScribe

# Mistral (Voxtral)
MISTRAL_API_KEY=xxx

# Supabase (Phase 2+)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe (Phase 3+)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 9. Décisions clés documentées

| Décision | Choix | Raison |
|----------|-------|--------|
| Moteur transcription | Voxtral (Mistral AI) | Plus simple, moins cher ($0.003/min), API synchrone |
| Storage temporaire | Mistral Cloud | Pas de coût storage, signed URLs intégrées |
| Framework | Next.js 16+ | Full-stack, SSR, grande communauté, Vercel optimized |
| Styling | Tailwind CSS v4 | CSS natif, performance, DX moderne |
| UI Components | shadcn/ui + Radix | Copy-paste, pas de dépendance npm, accessible |
| Auth | Supabase Auth | Google OAuth + Magic Link, rapide à implémenter |
| i18n | Context React custom | Léger, pas de dépendance, 5 langues (FR/EN/ES/PT/DE) |
| BaaS | Supabase | Auth + DB tout-en-un, open source |
| Paiement | Stripe (Phase 3) | Standard industrie, crédits + subscriptions |
| Nom | OpenScribe | Évoque transparence + écriture, différenciant |
| Licence app | Source-available | Visible mais monétisable |
| Pricing model | Crédits + abo optionnel | Flexible, pas de friction |
| Preview non-auth | Transcription tronquée | Inciter inscription sans bloquer l'expérience |
| Cache transcription | localStorage + API | Récupérer résultat complet après auth |

---

## 10. Ressources & Documentation

### Liens utiles
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Mistral AI Docs](https://docs.mistral.ai/)
- [Voxtral Audio Transcription](https://docs.mistral.ai/capabilities/audio_transcription)

---

*Ce document sert de référence pour le développement d'OpenScribe. Il doit être mis à jour au fur et à mesure que le projet évolue.*

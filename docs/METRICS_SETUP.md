# Configuration des métriques de transcription

Ce document décrit comment activer et configurer l'enregistrement des métriques de transcription dans Supabase.

## Données collectées

| Champ | Description |
|-------|-------------|
| `upload_duration_ms` | Temps d'upload du fichier vers R2 (ms) |
| `upload_duration_formatted` | Durée upload formatée (ex: 0h 1m 4s 280ms) |
| `transcription_duration_ms` | Temps de transcription Voxtral (ms) |
| `transcription_duration_formatted` | Durée transcription formatée (ex: 0h 0m 4s 819ms) |
| `file_size_bytes` | Taille du fichier audio |
| `audio_duration_seconds` | Durée réelle de l'audio (retournée par Mistral) |
| `client_ip` | IP du client |
| `source` | `local` (localhost) ou `openscribe` (site en prod) |
| `user_id` | ID utilisateur si connecté, sinon NULL |
| `created_at` | Date et heure |

## Étapes à suivre

### 1. Ajouter la clé Service Role dans `.env.local`

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard) → ton projet
2. **Settings** → **API**
3. Copie la **service_role** key (⚠️ secrète, ne jamais l'exposer au client)
4. Ajoute dans ton `.env.local` :

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Exécuter la migration Supabase

**Option A : Via Supabase CLI (recommandé)**

```bash
# Si pas encore fait : installer Supabase CLI
npm install -g supabase

# Lier le projet (une seule fois)
supabase link --project-ref TON_PROJECT_REF

# Exécuter les migrations
supabase db push
```

**Option B : Via le SQL Editor du Dashboard**

1. Va sur Supabase Dashboard → **SQL Editor**
2. Copie le contenu de `supabase/migrations/20250222000000_create_transcription_metrics.sql`
3. Colle et exécute (Run)

### 3. Vérifier que ça fonctionne

1. Lance l'app : `npm run dev`
2. Fais une transcription de test
3. Dans Supabase Dashboard → **Table Editor** → `transcription_metrics`
4. Tu devrais voir une nouvelle ligne avec les métriques

### 4. (Optionnel) Requêtes analytics utiles

```sql
-- Temps moyen de transcription par durée d'audio (en secondes)
SELECT 
  ROUND(audio_duration_seconds::numeric, 0) as duration_bucket,
  AVG(transcription_duration_ms)::int as avg_transcription_ms,
  COUNT(*) as count
FROM transcription_metrics
WHERE audio_duration_seconds IS NOT NULL
GROUP BY ROUND(audio_duration_seconds::numeric, 0)
ORDER BY duration_bucket;

-- Comparaison local vs openscribe
SELECT 
  source,
  AVG(transcription_duration_ms)::int as avg_ms,
  AVG(upload_duration_ms)::int as avg_upload_ms,
  COUNT(*) as count
FROM transcription_metrics
GROUP BY source;
```

## Comportement si non configuré

- Si `SUPABASE_SERVICE_ROLE_KEY` n'est pas défini : les métriques ne sont **pas** enregistrées, mais la transcription fonctionne normalement
- Aucune erreur n'est renvoyée à l'utilisateur

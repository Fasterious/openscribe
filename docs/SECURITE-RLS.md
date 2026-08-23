# Sécurité — RLS et surfaces publiques

Procédure d'audit et de vérification accompagnant la migration
`supabase/migrations/20260823000000_harden_rls_policies.sql`.

---

## 1. Audit — à lancer AVANT d'appliquer la migration

Dans le SQL editor Supabase. C'est le quart d'heure le plus rentable de
l'opération : il peut révéler un trou plus large que ceux déjà identifiés.

```sql
-- (a) Quelles tables ont RLS désactivé ?  relrowsecurity = false → tout est lisible.
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

-- (b) Toutes les policies, avec leurs rôles. `roles = {public}` est la forme du trou.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- (c) Schéma réel des deux tables créées hors migration.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('persona_sessions', 'feedbacks')
order by table_name, ordinal_position;
```

**Si `persona_sessions` ou `feedbacks` ressort avec `relrowsecurity = false`,
c'est une fuite de données en cours** — `feedbacks` stocke `user_email` — et
cela passe devant tout le reste. Ces deux tables ont été créées via le
dashboard, où RLS est désactivé par défaut, et n'ont aucune migration dans le
dépôt.

La seconde migration (`..._document_persona_and_feedback_tables.sql`) doit être
écrite **à partir du dump (c)**, pas devinée. Forme visée :
`CREATE TABLE IF NOT EXISTS` + `ENABLE ROW LEVEL SECURITY` + policies
`TO authenticated` sur `auth.uid()`, en miroir de `csv_analysis_sessions` ;
pour `feedbacks`, INSERT ouvert (la route insère avec le client anon) et
**aucune policy SELECT**, afin que personne ne puisse lire les retours ni les
adresses e-mail des autres.

---

## 2. Vérification — avant / après

Le diff entre les deux passes est la preuve.

```bash
export SB_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2- | tr -d '"')
export SB_ANON=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2- | tr -d '"')

for t in csv_analysis_sessions workshop_sessions workshop_responses workshop_analyses \
         persona_sessions feedbacks user_api_keys transcription_metrics; do
  printf '%-26s ' "$t"
  curl -s "$SB_URL/rest/v1/$t?select=*&limit=1" -H "apikey: $SB_ANON" | head -c 160
  echo
done
```

**Attendu après migration** : `[]` partout **sauf** `workshop_sessions` et
`workshop_responses`, volontairement publiques en lecture (cf. commentaires de
la migration).

⚠️ PostgREST renvoie **`200 []`**, et non `403`, quand RLS filtre toutes les
lignes. `[]` est donc le signal de succès, pas une erreur.

Test d'écriture anonyme :

```bash
curl -s -X POST "$SB_URL/rest/v1/workshop_responses" -H "apikey: $SB_ANON" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<uuid d une session réelle>","participant_name":"pentest","response_text":"pentest"}'
```

Avant : `201`. Après : `{"code":"42501", ... violates row-level security policy}`.

---

## 3. Non-régression fonctionnelle — dans cet ordre

1. Créer un atelier, ouvrir `/workshop/<id>/participate` en **fenêtre privée**,
   soumettre une réponse → **les deux écrans se mettent à jour en direct**
   (prouve que Realtime et le chemin d'écriture service-role ont survécu).
2. Lancer l'analyse de l'atelier → le facilitateur voit les clusters.
3. Analyse CSV de bout en bout : extract → cluster → synthesize → rapport → export.
4. Persona V1 : import, résultat, réouverture depuis l'historique.
5. Transcription : upload + transcription.

---

## 4. Reste à faire

| Sujet | Détail |
| --- | --- |
| `persona_sessions` / `feedbacks` | Migration à écrire après le dump §1(c). |
| `content-length` R2 | `lib/r2.ts` ne signe pas `content-length` : la taille validée par `/api/upload-url` reste **déclarative**, un PUT présigné accepte n'importe quel volume. Correctif = 4ᵉ paramètre `contentLength` passé à `PutObjectCommand`, à valider par un aller-retour réel contre R2 (bon volume → 200, volume différent → 403 `SignatureDoesNotMatch`). Non testable sans les variables `R2_*` en local. |
| `workshop_responses` SELECT public | Conservé pour ne pas casser Realtime. À reprendre au Lot 2 avec un jeton de session côté participant. |
| Mot de passe DB | `supabase/.temp/pooler-url` (chaîne de connexion Postgres avec mot de passe) a séjourné dans un chemin non ignoré, désormais gitignoré et **jamais committé** (vérifié : `git log --all -- 'supabase/.temp/*'` est vide). Le faire tourner dans le dashboard Supabase reste une précaution à 2 minutes. |

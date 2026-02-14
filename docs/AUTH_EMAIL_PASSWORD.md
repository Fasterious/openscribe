# Authentification Email/Mot de passe - Branche archivée

> **⚠️ Cette fonctionnalité ne fonctionne pas entièrement.** Le reset de mot de passe pose des problèmes en production. Cette branche est conservée pour référence future.

## État actuel

- **Inscription** (signup) : fonctionne
- **Connexion** (signin) : fonctionne
- **Mot de passe oublié** : l'email est envoyé, mais le lien de réinitialisation ne fonctionne pas correctement
- **Réinitialisation** : l'utilisateur arrive sur la page d'accueil au lieu de la page reset, ou reçoit "lien expiré"

## Problèmes rencontrés (retour utilisateur)

1. **Redirection incorrecte** : En cliquant sur le lien dans l'email de réinitialisation, l'utilisateur arrive sur la page par défaut (accueil) au lieu de la page de réinitialisation.

2. **Erreur "otp_expired"** : Même avec un lien fraîchement reçu, le message "Email link is invalid or has expired" apparaît. L'URL contient : `?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`

3. **Flow implicite vs PKCE** : Supabase utilise le flow implicite pour les emails de recovery, envoyant les tokens dans le **hash fragment** (`#access_token=...`). Le hash fragment n'est jamais envoyé au serveur, ce qui rend les routes callback serveur inutiles.

4. **Rate limit Supabase** : 2 emails/heure max avec le SMTP par défaut. Impossible à augmenter sans configurer un SMTP personnalisé (Resend, etc.).

## Tentatives de correction effectuées

### 1. Route callback dédiée
- Création de `/auth/callback/reset-password` pour échanger le code
- **Résultat** : Ne fonctionne pas car Supabase envoie les tokens dans le hash, pas en query params

### 2. redirectTo vers callback puis reset-password
- `redirectTo: /auth/callback?next=/auth/reset-password`
- **Résultat** : Conflits de paramètres URL, Supabase redirige vers Site URL en cas d'erreur

### 3. redirectTo direct vers /auth/reset-password
- La page reset-password gère le flow côté client
- Écoute de l'événement `PASSWORD_RECOVERY`
- Échange du paramètre `code` si présent (flow PKCE)
- **Résultat** : Amélioration mais problèmes persistants (otp_expired, redirection vers accueil)

### 4. Gestion des erreurs sur la homepage
- Détection de `error_code=otp_expired` dans l'URL (query + hash)
- Redirection vers `/auth/forgot-password?error=expired_link`
- **Résultat** : Meilleure UX quand le lien expire, mais le reset ne fonctionne toujours pas

### 5. Configuration Supabase
- Ajout des URLs dans Redirect URLs : `https://openscribe.fr/auth/callback/reset-password`, etc.
- **Résultat** : Nécessaire mais insuffisant

## Pistes pour une future implémentation

1. **Configurer Resend (SMTP personnalisé)** : Contourner le rate limit de 2 emails/h et améliorer la deliverability

2. **Vérifier le template email Supabase** : S'assurer que `{{ .ConfirmationURL }}` est correctement utilisé

3. **Tester avec un compte email/password natif** : L'utilisateur testait avec un compte créé via Google (sans mot de passe) — peut-être un comportement différent

4. **Vérifier la configuration Auth dans Supabase** : Flow PKCE vs Implicit, durée de validité des tokens

## Fichiers concernés

- `app/auth/forgot-password/page.tsx` - Demande de réinitialisation
- `app/auth/reset-password/page.tsx` - Formulaire nouveau mot de passe
- `components/auth/auth-modal.tsx` - Modal avec modes signin/signup/forgot-password
- `app/page.tsx` - Redirection otp_expired vers forgot-password
- `lib/i18n/translations.ts` - Traductions auth

## Pour réactiver

```bash
git merge feature/email-password-auth
```

Puis configurer Resend dans Supabase Dashboard avant de tester.

'use client';

/**
 * Page de réinitialisation mot de passe.
 * NOTE: Problèmes en prod (redirection, otp_expired). Voir docs/AUTH_EMAIL_PASSWORD.md
 */
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  const supabase = createClient();

  const initSession = useCallback(async () => {
    // 1. Check for hash fragment (implicit flow)
    //    Supabase client auto-processes #access_token=...&type=recovery
    //    and fires PASSWORD_RECOVERY or SIGNED_IN events

    // 2. Check for code query param (PKCE flow)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Clean the URL
        window.history.replaceState({}, '', '/auth/reset-password');
        setReady(true);
        return;
      }
    }

    // 3. Check for existing session (user might already be authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setReady(true);
      return;
    }

    // 4. Wait a moment for Supabase client to process hash tokens
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const { data: { session: retrySession } } = await supabase.auth.getSession();
    if (retrySession) {
      setReady(true);
      return;
    }

    // No valid session found - redirect to forgot password
    router.replace('/auth/forgot-password?error=invalid_link');
  }, [supabase.auth, router]);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event (fires when Supabase processes hash tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, initSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.resetPassword.passwordTooShort'));
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }

    setLoading(false);
  };

  // Loading while establishing session
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {t('auth.resetPassword.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('auth.resetPassword.subtitle')}
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {t('auth.resetPassword.success')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('auth.resetPassword.redirecting')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  {t('auth.resetPassword.newPassword')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                  {t('auth.resetPassword.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                {t('auth.resetPassword.resetButton')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const supabase = createClient();

  const handleModeChange = (newMode: AuthMode) => {
    setError(null);
    setMessage(null);
    setResetEmailSent(false);
    setMode(newMode);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(t('auth.modal.checkEmail'));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        onSuccess?.();
        onClose();
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetEmailSent(true);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  // Render forgot password content
  const renderForgotPasswordContent = () => (
    <div className="transition-all duration-200 ease-out">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('auth.forgotPassword.subtitle')}
        </p>
      </div>

      {resetEmailSent ? (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {t('auth.forgotPassword.emailSent')}
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleModeChange('signin')}
          >
            {t('auth.forgotPassword.backToSignIn')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-foreground mb-1.5">
              {t('auth.modal.email')}
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              required
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
            {t('auth.forgotPassword.sendButton')}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className="text-sm text-primary hover:underline"
            >
              {t('auth.forgotPassword.backToSignIn')}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  // Render sign in / sign up content
  const renderAuthContent = () => (
    <div className="transition-all duration-200 ease-out">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {mode === 'signup' ? t('auth.modal.signUp') : t('auth.modal.signIn')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'signup' 
            ? t('auth.modal.signUpSubtitle')
            : t('auth.modal.signInSubtitle')
          }
        </p>
      </div>

      {/* Google OAuth button */}
      <div className="mb-6">
        <Button
          variant="outline"
          className="w-full gap-3"
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t('auth.modal.continueWithGoogle')}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t('auth.modal.or')}</span>
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            {t('auth.modal.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              {t('auth.modal.password')}
            </label>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => handleModeChange('forgot-password')}
                className="text-xs text-primary hover:underline"
              >
                {t('auth.modal.forgotPassword')}
              </button>
            )}
          </div>
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

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
            {error}
          </div>
        )}

        {message && (
          <div className="text-sm text-accent bg-accent/10 rounded-xl p-3">
            {message}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : null}
          {mode === 'signup' ? t('auth.modal.signUpButton') : t('auth.modal.signInButton')}
        </Button>
      </form>

      {/* Toggle mode */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === 'signup' ? (
          <>
            {t('auth.modal.alreadyAccount')}{' '}
            <button
              onClick={() => handleModeChange('signin')}
              className="text-primary hover:underline font-medium"
            >
              {t('auth.modal.signIn')}
            </button>
          </>
        ) : (
          <>
            {t('auth.modal.noAccount')}{' '}
            <button
              onClick={() => handleModeChange('signup')}
              className="text-primary hover:underline font-medium"
            >
              {t('auth.modal.signUpButton')}
            </button>
          </>
        )}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - stays constant */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content - switches based on mode */}
        {mode === 'forgot-password' ? renderForgotPasswordContent() : renderAuthContent()}
      </div>
    </div>
  );
}

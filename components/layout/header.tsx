'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/auth-modal';
import { ApiKeysSetup } from '@/components/settings/api-keys-setup';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';
import type { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
  { href: '/transcription', label: 'Transcription' },
  { href: '/workshop', label: 'Workshop' },
  { href: '/csv-analysis', label: 'Analyse CSV' },
  { href: '/persona', label: 'Personas' },
];

interface HeaderProps {
  user?: User | null;
  loading?: boolean;
  onSignOut?: () => void;
  onSignIn?: () => void;
  /** Hide auth controls (e.g. on participant pages) */
  hideAuth?: boolean;
  /** Use internal auth management (default: true) */
  manageAuth?: boolean;
}

export function Header({
  user: externalUser,
  loading: externalLoading,
  onSignOut: externalSignOut,
  onSignIn: externalSignIn,
  hideAuth = false,
  manageAuth = true,
}: HeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const supabase = createClient();

  const [internalUser, setInternalUser] = useState<User | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const user = externalUser !== undefined ? externalUser : internalUser;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    if (!manageAuth) return;
    supabase.auth.getUser().then(({ data }) => {
      setInternalUser(data.user);
      setInternalLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setInternalUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [manageAuth]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    if (externalSignOut) {
      externalSignOut();
    } else {
      await supabase.auth.signOut();
    }
  };

  const handleSignIn = () => {
    if (externalSignIn) {
      externalSignIn();
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1">
              <img src="/logo.svg" alt="OpenScribe logo" className="h-8 w-auto" />
              <span className="text-xl font-semibold text-foreground">OpenScribe</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!hideAuth && !loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setApiKeysOpen(true)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title={t('settings.apiKeys.title')}
                  >
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </button>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button variant="default" size="sm" onClick={handleSignOut}>
                    {t('header.signOut')}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={handleSignIn}>
                  {t('header.signIn')}
                </Button>
              )
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="sm:hidden border-t border-border/50 bg-card/95 backdrop-blur-sm">
            <nav className="container mx-auto px-4 py-2 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {manageAuth && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      )}

      <ApiKeysSetup
        isOpen={apiKeysOpen}
        onClose={() => setApiKeysOpen(false)}
      />
    </>
  );
}

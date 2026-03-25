'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useTranslation } from '@/lib/i18n/context';
import type { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
  { href: '/', label: 'Transcription' },
  { href: '/workshop', label: 'Workshop' },
  { href: '/csv-analysis', label: 'Analyse CSV' },
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
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
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
            <LanguageSelector />
            {!hideAuth && !loading && (
              user ? (
                <div className="flex items-center gap-3">
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
          </div>
        </div>
      </header>

      {manageAuth && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      )}
    </>
  );
}

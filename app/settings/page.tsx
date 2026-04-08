'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ApiKeysSetup } from '@/components/settings/api-keys-setup';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSelector } from '@/components/ui/language-selector';
import type { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-muted-foreground">Connectez-vous pour acceder aux parametres.</p>
          <Button onClick={() => router.push('/')}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Parametres</h1>

        <div className="space-y-6">
          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle>Compte</CardTitle>
              <CardDescription>Informations de votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Email</Label>
                  <span className="text-sm text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">ID</Label>
                  <span className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Inscription</Label>
                  <span className="text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.apiKeys.title')}</CardTitle>
              <CardDescription>{t('settings.apiKeys.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setApiKeysOpen(true)}>
                Configurer les cles API
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Personnalisez votre experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode sombre</Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Basculer entre le theme clair et sombre</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Langue</Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Choisir la langue de l&apos;interface</p>
                  </div>
                  <LanguageSelector />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>A propos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>OpenScribe</span>
                  <Badge variant="secondary">v1.0</Badge>
                </div>
                <p>
                  Outils de recherche qualitative open-source propulses par l&apos;IA.
                  Transcription, workshops collaboratifs, analyse CSV et personas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ApiKeysSetup isOpen={apiKeysOpen} onClose={() => setApiKeysOpen(false)} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { WorkshopSession } from '@/types/workshop';

export default function WorkshopDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkshopSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthModalOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingSessions(true);
    fetch('/api/workshop/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoadingSessions(false));
  }, [user]);

  const isDevMode = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  const handleNewSession = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    router.push('/workshop/create');
  };

  if (!user && !isDevMode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-md mx-auto text-center space-y-6 py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Connectez-vous pour accéder au Workshop
            </h1>
            <p className="text-muted-foreground">
              Créez et gérez vos sessions d&apos;atelier collaboratif.
            </p>
            <Button onClick={() => setAuthModalOpen(true)}>
              Se connecter avec Google
            </Button>
          </div>
        </main>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {isDevMode && !user && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-sm text-amber-700">
          Mode développeur — authentification non requise
        </div>
      )}

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workshop</h1>
              <p className="text-muted-foreground mt-1">
                Vos sessions d&apos;atelier collaboratif
              </p>
            </div>
            <Button onClick={handleNewSession}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle session
            </Button>
          </div>

          {loadingSessions ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Aucune session
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Créez votre première session pour poser une question à votre
                  audience et collecter leurs retours en temps réel.
                </p>
                <Button className="mt-6" onClick={handleNewSession}>
                  Créer ma première session
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Collecte en temps réel</h3>
                  <p className="text-sm text-muted-foreground">QR code et lien partageable pour recueillir les retours instantanément</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Analyse qualitative IA</h3>
                  <p className="text-sm text-muted-foreground">Extraction, clustering et synthèse automatiques avec verbatims</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Export complet</h3>
                  <p className="text-sm text-muted-foreground">Nuage de mots, clusters et données brutes exportables en HTML</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => router.push(`/workshop/${session.id}`)}
                  className="w-full text-left bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground line-clamp-2">
                        {session.question}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(session.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {session.status === 'active' ? 'Active' : 'Fermée'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

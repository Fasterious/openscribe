'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function CreateSession() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [question, setQuestion] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
      if (!data.user) setAuthModalOpen(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthModalOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!question.trim()) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/workshop/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const { session } = await res.json();
      router.push(`/workshop/${session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10 flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {!user && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-center text-sm text-amber-700">
          Vous devez être connecté pour créer une session.{' '}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="underline font-medium hover:text-amber-900"
          >
            Se connecter
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <button
              onClick={() => router.push('/workshop')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-4"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            <h1 className="text-2xl font-bold text-foreground">
              Nouvelle session
            </h1>
            <p className="text-muted-foreground mt-1">
              Posez une question à votre audience. Les participants scanneront un
              QR code pour y répondre.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Votre question
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex : Quels sont les principaux problèmes que vous rencontrez au quotidien dans votre travail ?"
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/workshop')}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!question.trim() || creating}
              >
                {creating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Création...
                  </>
                ) : (
                  'Créer la session'
                )}
              </Button>
            </div>
          </div>
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

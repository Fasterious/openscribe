'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { AuthModal } from '@/components/auth/auth-modal';
import { Alert, AlertContent } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
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
          <Spinner className="size-8 border-[2px]" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {!user && (
        <Alert
          variant="warning"
          className="rounded-none border-x-0 border-t-0 py-3 justify-center"
        >
          <AlertContent className="text-center text-sm text-inherit">
            Vous devez être connecté pour créer une session.{' '}
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="underline font-medium hover:opacity-90"
            >
              Se connecter
            </button>
          </AlertContent>
        </Alert>
      )}

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/workshop')}
              className="text-muted-foreground hover:text-foreground -ml-2 mb-4"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </Button>
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
              <Label htmlFor="question" className="block mb-2">
                Votre question
              </Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex : Quels sont les principaux problèmes que vous rencontrez au quotidien dans votre travail ?"
                rows={4}
                className="rounded-xl resize-none"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertContent className="text-sm text-inherit">{error}</AlertContent>
              </Alert>
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
                    <Spinner
                      size="sm"
                      className="mr-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
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

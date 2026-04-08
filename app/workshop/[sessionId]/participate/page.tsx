'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Alert, AlertContent } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { WorkshopSession, WorkshopResponse } from '@/types/workshop';

const TOKEN_PREFIX = 'workshop_token_';

export default function ParticipatePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const supabase = useRef(createClient()).current;

  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [responses, setResponses] = useState<WorkshopResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [responseText, setResponseText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [myResponseId, setMyResponseId] = useState<string | null>(null);

  const getToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`${TOKEN_PREFIX}${sessionId}`);
  }, [sessionId]);

  const setToken = useCallback(
    (token: string) => {
      localStorage.setItem(`${TOKEN_PREFIX}${sessionId}`, token);
    },
    [sessionId]
  );

  const getName = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`${TOKEN_PREFIX}${sessionId}_name`) || '';
  }, [sessionId]);

  const saveName = useCallback(
    (n: string) => {
      localStorage.setItem(`${TOKEN_PREFIX}${sessionId}_name`, n);
    },
    [sessionId]
  );

  // Load session data
  useEffect(() => {
    fetch(`/api/workshop/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data.session);
        setResponses(data.responses ?? []);

        const token = getToken();
        if (token) {
          const myResponse = (data.responses ?? []).find(
            (r: WorkshopResponse) => r.participant_token === token
          );
          if (myResponse) {
            setSubmitted(true);
            setMyResponseId(myResponse.id);
            setResponseText(myResponse.response_text);
            setName(myResponse.participant_name);
          }
        }

        const savedName = getName();
        if (savedName) setName(savedName);
      })
      .catch(() => setError('Session introuvable'))
      .finally(() => setLoading(false));
  }, [sessionId, getToken, getName]);

  // Supabase Realtime for live response updates
  useEffect(() => {
    if (loading) return;

    const channel = supabase
      .channel(`participant-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setResponses((prev) => {
              if (prev.some((r) => r.id === payload.new.id)) return prev;
              return [...prev, payload.new as WorkshopResponse];
            });
          } else if (payload.eventType === 'UPDATE') {
            setResponses((prev) =>
              prev.map((r) =>
                r.id === payload.new.id ? (payload.new as WorkshopResponse) : r
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, sessionId, supabase]);

  const refreshResponses = async () => {
    try {
      const res = await fetch(`/api/workshop/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setResponses(data.responses ?? []);
    } catch {
      // Silent fail
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !responseText.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/workshop/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          participant_name: name.trim(),
          participant_token: getToken() || undefined,
          response_text: responseText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      const data = await res.json();
      if (data.participant_token) {
        setToken(data.participant_token);
      }
      saveName(name.trim());
      setMyResponseId(data.response.id);
      setSubmitted(true);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8 border-[2px]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">
            Session introuvable
          </p>
          <p className="text-sm text-muted-foreground">
            Cette session n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const otherResponses = responses.filter((r) => r.id !== myResponseId);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header for participants */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-1">
            <img src="/logo.svg" alt="OpenScribe" className="h-6 w-auto" />
            <span className="text-lg font-semibold text-foreground">
              OpenScribe
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="space-y-6">
          {/* Question */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
              Question
            </p>
            <p className="text-lg font-semibold text-foreground">
              {session.question}
            </p>
          </div>

          {/* Response form */}
          {!submitted ? (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div>
                <Label htmlFor="name" className="block mb-1.5">
                  Votre prénom
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Prénom"
                  className="rounded-xl"
                  autoFocus={!name}
                />
              </div>

              <div>
                <Label htmlFor="response" className="block mb-1.5">
                  Votre réponse
                </Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Partagez votre point de vue..."
                  rows={5}
                  className="rounded-xl resize-none"
                  autoFocus={!!name}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertContent className="text-sm text-inherit">{error}</AlertContent>
                </Alert>
              )}

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!name.trim() || !responseText.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Spinner
                      size="sm"
                      className="mr-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
                    Envoi...
                  </>
                ) : editing ? (
                  'Mettre à jour ma réponse'
                ) : (
                  'Envoyer ma réponse'
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-success">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Réponse envoyée</span>
              </div>
              <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-foreground/80 italic">
                &quot;{responseText}&quot;
              </div>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Modifier ma réponse
              </Button>
            </div>
          )}

          {/* Other responses */}
          {otherResponses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Réponses des autres participants ({otherResponses.length})
                </h2>
                <button
                  onClick={refreshResponses}
                  title="Rafraîchir"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {otherResponses.map((r) => (
                  <div
                    key={r.id}
                    className="bg-card rounded-xl border border-border px-4 py-3"
                  >
                    <p className="text-xs font-medium text-primary mb-1">
                      {r.participant_name}
                    </p>
                    <p className="text-sm text-foreground/80">
                      {r.response_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.status === 'closed' && (
            <div className="bg-muted rounded-xl p-4 text-center text-sm text-muted-foreground">
              Cette session est fermée. Les réponses ne sont plus acceptées.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

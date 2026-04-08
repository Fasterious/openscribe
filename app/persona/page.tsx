'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Header } from '@/components/layout/header';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import type { User } from '@supabase/supabase-js';
import type { PersonaSession } from '@/types/persona';

const SAMPLE_CSV = `Répondant,Persona,C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11
R34,🟣,1,5,2,1,1,5,4,4,1,5,2
R13,🔵,1,5,4,5,1,4,1,4,5,3,1
R50,🟡,1,3,3,5,4,5,4,4,4,4,1
R22,🟠,2,5,4,1,5,5,4,1,2,5,4
R3,🟢,5,3,2,1,4,5,5,3,1,1,1
R8,🟢,5,1,5,2,3,2,5,4,2,1,1
R44,🟡,2,4,5,2,4,5,2,1,4,4,1
R36,🟣,1,2,3,3,2,4,5,4,1,5,1
R27,🟠,1,4,4,3,1,5,5,1,3,4,5
R38,🟣,1,1,5,1,3,3,1,4,1,5,3
R15,🔵,1,4,4,5,3,4,2,3,5,2,2
R46,🟡,4,3,2,1,4,5,1,5,4,4,3
R20,🔵,2,2,5,4,3,5,3,3,4,2,3
R41,🟡,4,3,2,3,5,4,1,2,5,3,1
R30,🟠,1,5,3,5,3,4,4,2,5,5,4
R17,🔵,1,5,4,5,4,4,1,2,5,1,3
R39,🟣,1,5,2,4,1,5,4,5,2,4,1
R10,🟢,5,4,3,2,1,4,5,5,2,2,2
R4,🟢,4,1,5,2,1,2,5,5,2,4,2
R31,🟣,1,2,3,5,2,4,3,5,1,4,2
R33,🟣,2,1,5,4,3,3,1,5,1,4,1
R18,🔵,2,1,5,4,1,5,4,4,4,3,2
R21,🟠,3,5,2,3,1,2,5,4,3,4,5
R48,🟡,5,2,1,4,4,5,5,1,4,4,2
R11,🔵,1,3,4,5,2,4,2,5,5,1,3
R45,🟡,3,1,3,5,5,4,4,4,5,3,2
R24,🟠,3,5,5,2,4,3,4,5,1,5,4
R12,🔵,2,1,5,4,4,5,3,2,4,5,2
R23,🟠,1,4,1,4,2,1,5,3,4,4,5
R14,🔵,2,2,5,4,5,5,4,1,4,4,3
R2,🟢,4,5,4,2,2,1,4,4,2,5,3
R43,🟡,5,2,1,4,5,4,5,3,5,3,2
R5,🟢,5,4,3,1,3,3,4,2,1,2,1
R7,🟢,4,5,4,2,2,5,4,1,1,3,2
R35,🟣,1,3,4,2,4,2,2,5,2,4,3
R25,🟠,2,4,3,5,3,4,5,2,5,4,5
R19,🔵,1,4,4,5,5,4,2,1,5,4,1
R28,🟠,2,5,1,4,4,1,4,3,4,5,4
R40,🟣,2,3,4,2,4,2,2,4,1,5,2
R16,🔵,2,3,5,4,2,5,3,5,4,5,1
R32,🟣,1,4,1,3,5,1,5,4,2,5,3
R1,🟢,5,2,1,1,5,4,5,1,1,3,2
R29,🟠,3,4,5,2,2,3,5,5,1,4,5
R47,🟡,2,5,4,3,5,4,3,2,5,3,1
R6,🟢,5,3,2,1,4,1,5,3,2,5,3
R37,🟣,2,4,1,5,5,1,3,5,2,4,2
R9,🟢,4,2,1,1,5,3,4,2,1,4,3
R42,🟡,3,5,4,1,4,5,3,5,4,4,3
R26,🟠,3,5,2,1,5,2,4,4,2,5,4
R49,🟡,3,4,5,2,5,4,2,3,5,3,3`;

export default function PersonaDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PersonaSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    fetch('/api/persona/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoadingSessions(false));
  }, [user]);

  const loadData = useCallback(
    (filename: string, headers: string[], rows: Record<string, string>[], totalRows: number) => {
      const sessionData = { filename, headers, rows: rows.slice(0, 1000), total_rows: totalRows };
      sessionStorage.setItem('persona_upload', JSON.stringify(sessionData));
      router.push('/persona/new');
    },
    [router]
  );

  const processFile = useCallback(
    async (file: File) => {
      setUploading(true);

      try {
        let headers: string[] = [];
        let rows: Record<string, string>[] = [];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
          if (jsonData.length > 0) {
            headers = Object.keys(jsonData[0]);
            rows = jsonData.map((r) => {
              const row: Record<string, string> = {};
              headers.forEach((h) => { row[h] = String(r[h] ?? ''); });
              return row;
            });
          }
        } else {
          const result = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve) => {
            Papa.parse<Record<string, string>>(file, {
              header: true,
              skipEmptyLines: true,
              complete: resolve,
            });
          });
          headers = result.meta.fields || [];
          rows = result.data;
        }

        if (headers.length === 0 || rows.length === 0) {
          alert('Le fichier est vide ou mal formate.');
          setUploading(false);
          return;
        }

        loadData(file.name, headers, rows, rows.length);
      } catch {
        alert('Erreur lors de la lecture du fichier.');
      } finally {
        setUploading(false);
      }
    },
    [loadData]
  );

  const loadSampleData = useCallback(() => {
    const result = Papa.parse<Record<string, string>>(SAMPLE_CSV, {
      header: true,
      skipEmptyLines: true,
    });
    const headers = result.meta.fields || [];
    loadData('mixdata.csv (exemple)', headers, result.data, result.data.length);
  }, [loadData]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        if (!user) { setAuthModalOpen(true); return; }
        processFile(file);
      }
    },
    [processFile, user]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!user) { setAuthModalOpen(true); return; }
        processFile(file);
      }
      e.target.value = '';
    },
    [processFile, user]
  );

  const deleteSession = async (id: string) => {
    if (!confirm('Supprimer cette analyse ?')) return;
    await fetch(`/api/persona/sessions/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Analyse de Personas</h1>
          <p className="text-muted-foreground mt-1">
            Identifiez automatiquement des groupes de personas a partir de questionnaires quantitatifs (echelles de Likert).
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
          />
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-foreground font-medium">
            {uploading ? 'Lecture du fichier...' : 'Deposez votre fichier ici'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">CSV ou Excel (.xlsx) — questionnaire quantitatif</p>
        </div>

        {/* Sample data button */}
        <div className="mt-4 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); loadSampleData(); }}
            className="text-sm text-primary hover:underline transition-colors"
          >
            Pas de fichier ? Essayer avec des donnees d&apos;exemple (50 repondants, 11 criteres)
          </button>
        </div>

        {/* Benefit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Clustering automatique</h3>
            <p className="text-sm text-muted-foreground">Identification de groupes de personas par correlation paire-a-paire sur echelles de Likert</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Visualisations riches</h3>
            <p className="text-sm text-muted-foreground">Radar, heatmap, echelles de Likert et matrices de correlation interactives</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Detection IA des colonnes</h3>
            <p className="text-sm text-muted-foreground">Recommandation automatique des colonnes pertinentes via Gemini ou Mistral</p>
          </div>
        </div>

        {/* Sessions list */}
        {!loading && user && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Analyses precedentes</h2>
            {loadingSessions ? (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            ) : sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune analyse pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/persona/${s.id}`)}
                    >
                      <p className="font-medium text-foreground">{s.filename}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {s.respondent_count} repondants · {s.cluster_count} clusters · {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={s.status === 'complete' ? 'default' : s.status === 'error' ? 'destructive' : 'secondary'}
                        className={s.status === 'complete' ? 'bg-success/15 text-success border-success/20' : ''}
                      >
                        {s.status === 'complete' ? 'Termine' : s.status === 'error' ? 'Erreur' : 'En cours'}
                      </Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !user && (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-3">Connectez-vous pour sauvegarder vos analyses.</p>
            <Button onClick={() => setAuthModalOpen(true)}>Se connecter</Button>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
      <FeedbackButton />
    </div>
  );
}

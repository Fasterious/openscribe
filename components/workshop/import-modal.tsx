'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import type { LLMProvider } from '@/types/workshop';
import { LlmModelSelect } from '@/components/ui/llm-model-select';

export interface ImportRow {
  participant_name: string;
  response_text: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionQuestion: string;
  onImportSuccess: () => void;
}

type ImportSource = 'file' | 'paste';
type FileType = 'csv' | 'excel' | 'txt';

const ACCEPTED_FILE_TYPES: Record<FileType, string> = {
  csv: '.csv,text/csv',
  excel: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: '.txt,text/plain',
};

export function ImportModal({
  isOpen,
  onClose,
  sessionId,
  sessionQuestion,
  onImportSuccess,
}: ImportModalProps) {
  const [source, setSource] = useState<ImportSource>('file');
  const [fileType, setFileType] = useState<FileType>('csv');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('gemini');

  const reset = useCallback(() => {
    setSource('file');
    setFileType('csv');
    setPastedText('');
    setSelectedFile(null);
    setRows([]);
    setStep('input');
    setLoading(false);
    setError(null);
    setImporting(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const parseCSV = (text: string): ImportRow[] => {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    if (result.errors.length > 0 && result.data.length === 0) {
      throw new Error('Fichier CSV invalide');
    }
    const data = result.data;
    if (data.length === 0) throw new Error('Aucune donnée trouvée');

    const headers = Object.keys(data[0] || {});
    const nameCol = headers.find(
      (h) =>
        /nom|name|participant|auteur|author/i.test(h) ||
        h.toLowerCase().includes('participant')
    );
    const textCol = headers.find(
      (h) =>
        /reponse|response|texte|text|commentaire|comment|retour|feedback/i.test(h) ||
        h.toLowerCase().includes('reponse') ||
        h.toLowerCase().includes('response')
    );

    const colName = nameCol || headers[0];
    const colText = textCol || headers[headers.length - 1] || headers[0];

    return data
      .map((row) => {
        const name = (row[colName] ?? '').trim();
        const text = (row[colText] ?? '').trim();
        if (!text) return null;
        return {
          participant_name: name || 'Speaker',
          response_text: text,
        };
      })
      .filter((r): r is ImportRow => r !== null);
  };

  const parseExcel = (buffer: ArrayBuffer): ImportRow[] => {
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);
    if (data.length === 0) throw new Error('Aucune donnée trouvée');

    const headers = Object.keys(data[0] || {});
    const nameCol = headers.find(
      (h) =>
        /nom|name|participant|auteur|author/i.test(h) ||
        h.toLowerCase().includes('participant')
    );
    const textCol = headers.find(
      (h) =>
        /reponse|response|texte|text|commentaire|comment|retour|feedback/i.test(h) ||
        h.toLowerCase().includes('reponse') ||
        h.toLowerCase().includes('response')
    );

    const colName = nameCol || headers[0];
    const colText = textCol || headers[headers.length - 1] || headers[0];

    return data
      .map((row) => {
        const name = String(row[colName] ?? '').trim();
        const text = String(row[colText] ?? '').trim();
        if (!text) return null;
        return {
          participant_name: name || 'Speaker',
          response_text: text,
        };
      })
      .filter((r): r is ImportRow => r !== null);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      setError(null);
      setRows([]);
    },
    []
  );

  const handleParseAutomatically = useCallback(async () => {
    if (!selectedFile) return;
    setError(null);
    setLoading(true);
    try {
      if (fileType === 'csv') {
        const text = await selectedFile.text();
        const parsed = parseCSV(text);
        setRows(parsed);
      } else if (fileType === 'excel') {
        const buffer = await selectedFile.arrayBuffer();
        const parsed = parseExcel(buffer);
        setRows(parsed);
      }
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du parsing');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFile, fileType]);

  const handlePasteAndStructure = useCallback(async () => {
    const text = pastedText.trim();
    if (text.length < 10) {
      setError('Le texte est trop court (minimum 10 caractères)');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/workshop/import/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: text,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de structuration');

      setRows(data.responses || []);
      if ((data.responses || []).length > 0) {
        setStep('preview');
      } else {
        setError('Aucune réponse extraite du texte');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la structuration');
    } finally {
      setLoading(false);
    }
  }, [pastedText, selectedProvider]);

  const getFileContentAsText = useCallback(
    async (file: File): Promise<string> => {
      if (fileType === 'csv' || fileType === 'txt') {
        return file.text();
      }
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_csv(firstSheet);
    },
    [fileType]
  );

  const handleStructureFileWithAI = useCallback(async () => {
    if (!selectedFile) return;
    setError(null);
    setLoading(true);
    try {
      const text = await getFileContentAsText(selectedFile);
      if (text.trim().length < 10) {
        setError('Le fichier est trop court pour être structuré');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/workshop/import/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: text.trim(),
          provider: selectedProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de structuration');
      setRows(data.responses || []);
      if ((data.responses || []).length > 0) {
        setStep('preview');
      } else {
        setError('Aucune réponse extraite du fichier');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la structuration');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, selectedProvider, getFileContentAsText]);

  const handleImport = useCallback(async () => {
    if (rows.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch('/api/workshop/responses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          responses: rows,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'import');

      onImportSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  }, [sessionId, rows, onImportSuccess, handleClose]);

  const updateRow = useCallback((index: number, field: keyof ImportRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] mx-4 flex flex-col border border-border animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Importer des réponses
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'input' ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSource('file');
                    setError(null);
                    setRows([]);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    source === 'file'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Fichier
                </button>
                <button
                  onClick={() => {
                    setSource('paste');
                    setError(null);
                    setRows([]);
                    setSelectedFile(null);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    source === 'paste'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Coller du texte
                </button>
              </div>

              {source === 'file' && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {(['csv', 'excel', 'txt'] as FileType[]).map((ft) => (
                      <button
                        key={ft}
                        onClick={() => setFileType(ft)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          fileType === ft
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ft === 'csv' ? 'CSV' : ft === 'excel' ? 'Excel' : 'TXT'}
                      </button>
                    ))}
                  </div>
                  <label className="block">
                    <span className="text-sm text-muted-foreground block mb-1">
                      Sélectionner un fichier
                    </span>
                    <input
                      type="file"
                      accept={ACCEPTED_FILE_TYPES[fileType]}
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:bg-muted file:text-foreground file:font-medium hover:file:bg-muted/80"
                    />
                  </label>
                  {selectedFile && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        {fileType === 'csv' || fileType === 'excel'
                          ? 'Choisissez comment traiter ce fichier :'
                          : 'L\'IA va structurer ce fichier :'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(fileType === 'csv' || fileType === 'excel') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleParseAutomatically}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                                Parsing...
                              </>
                            ) : (
                              'Parser automatiquement'
                            )}
                          </Button>
                        )}
                        <div className="flex items-center gap-2">
                          <LlmModelSelect
                            value={selectedProvider}
                            onChange={setSelectedProvider}
                          />
                          <Button
                            size="sm"
                            onClick={handleStructureFileWithAI}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                                Structuration...
                              </>
                            ) : (
                              'Structurer avec l\'IA'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {source === 'paste' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Collez votre texte (notes, post-its, transcription…). L&apos;IA extraira les réponses.
                  </p>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Exemple :&#10;Marie : On manque de visibilité entre les équipes.&#10;Jean : Les réunions sont trop longues.&#10;Ou une liste de retours sans noms..."
                    className="w-full min-h-[160px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center gap-3">
                    <LlmModelSelect
                      value={selectedProvider}
                      onChange={setSelectedProvider}
                    />
                    <Button
                      onClick={handlePasteAndStructure}
                      disabled={loading || pastedText.trim().length < 10}
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                          Structuration en cours...
                        </>
                      ) : (
                        'Structurer avec l\'IA'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {rows.length} réponse{rows.length > 1 ? 's' : ''} à importer. Vous pouvez modifier avant d&apos;importer.
              </p>
              <div className="border border-border rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-36">
                        Participant
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                        Réponse
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 align-top">
                          <input
                            value={row.participant_name}
                            onChange={(e) =>
                              updateRow(i, 'participant_name', e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <textarea
                            value={row.response_text}
                            onChange={(e) =>
                              updateRow(i, 'response_text', e.target.value)
                            }
                            rows={2}
                            className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 text-sm resize-none"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <button
                            onClick={() => removeRow(i)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Supprimer"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4m1 4h.01M14 4h.01" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep('input')}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Retour
                </button>
                <Button
                  onClick={handleImport}
                  disabled={importing || rows.length === 0}
                >
                  {importing ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                      Import en cours...
                    </>
                  ) : (
                    `Importer ${rows.length} réponse${rows.length > 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 pb-5">
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

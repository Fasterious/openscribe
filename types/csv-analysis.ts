export type Sentiment = 'positive' | 'negative' | 'suggestion';

export type AnalysisStep = 'parsing' | 'extracting' | 'clustering' | 'synthesizing' | 'complete' | 'error';

export const STEP_ORDER: AnalysisStep[] = ['parsing', 'extracting', 'clustering', 'synthesizing', 'complete'];

export const STEP_LABELS: Record<AnalysisStep, string> = {
  parsing: '1. Parsing CSV',
  extracting: '2. Extraction atomique',
  clustering: '3. Normalisation & Clustering',
  synthesizing: '4. Comptage & Synthèse',
  complete: '5. Rapport final',
  error: 'Erreur',
};

export interface Quintuplet {
  id: string;
  tag: string;
  verbatim: string;
  sentiment: Sentiment;
  question: string;
  participant_id: string;
  participant_name: string;
}

export interface NormalizedTag {
  label: string;
  original_tags: string[];
  quintuplets: Quintuplet[];
  positive_count: number;
  negative_count: number;
  suggestion_count: number;
  unique_participants: string[];
  summary: string;
}

export interface AnalysisCluster {
  title: string;
  normalized_tags: NormalizedTag[];
  total_positive: number;
  total_negative: number;
  total_suggestion: number;
  unique_participants: string[];
  summary: string;
}

export interface ParsedCsvData {
  questions: string[];
  participants: {
    id: string;
    name: string;
    responses: Record<string, string>;
  }[];
  total_participants: number;
  total_questions: number;
}

export interface FinalAnalysis {
  clusters: AnalysisCluster[];
  global_summary: string;
  total_quintuplets: number;
  total_participants: number;
  total_clusters: number;
}

export interface CsvAnalysisSession {
  id: string;
  creator_id: string;
  filename: string;
  status: AnalysisStep;
  current_step: number;
  model_used: string;
  step_1_parsed: ParsedCsvData | null;
  step_2_quintuplets: Quintuplet[] | null;
  step_3_clusters: AnalysisCluster[] | null;
  step_5_final: FinalAnalysis | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function sentimentEmoji(s: Sentiment): string {
  switch (s) {
    case 'positive': return '✅';
    case 'negative': return '⚠️';
    case 'suggestion': return '💡';
  }
}

export function sentimentLabel(s: Sentiment): string {
  switch (s) {
    case 'positive': return 'Positif';
    case 'negative': return 'Négatif';
    case 'suggestion': return 'Suggestion';
  }
}

export function getStepNumber(step: AnalysisStep): number {
  const idx = STEP_ORDER.indexOf(step);
  return idx >= 0 ? idx + 1 : 0;
}

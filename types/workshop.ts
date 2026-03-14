export interface WorkshopSession {
  id: string;
  creator_id: string;
  question: string;
  status: 'active' | 'closed';
  created_at: string;
}

export interface WorkshopResponse {
  id: string;
  session_id: string;
  participant_name: string;
  participant_token: string;
  response_text: string;
  created_at: string;
  updated_at: string;
}

export interface ClusterExcerpt {
  participant_name: string;
  response_id: string;
  excerpt: string;
}

export interface Cluster {
  label: string;
  summary: string;
  participant_count: number;
  excerpts: ClusterExcerpt[];
}

export interface AnalysisResult {
  clusters: Cluster[];
  global_summary: string;
  total_responses: number;
  total_participants: number;
}

export interface WorkshopAnalysis {
  id: string;
  session_id: string;
  model_used: string;
  clusters: AnalysisResult;
  created_at: string;
}

export type LLMProvider = 'gemini' | 'mistral';

export const LLM_MODELS: Record<LLMProvider, { label: string; model: string }> = {
  gemini: { label: 'Gemini 2.0 Flash', model: 'gemini-2.0-flash' },
  mistral: { label: 'Mistral Small', model: 'mistral-small-latest' },
};

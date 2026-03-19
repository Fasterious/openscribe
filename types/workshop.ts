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

export type LLMProvider = 'gemini' | 'gemini-pro' | 'mistral-small' | 'mistral-medium' | 'mistral-large';

export const LLM_MODELS: Record<LLMProvider, { label: string; model: string }> = {
  gemini: { label: 'Gemini 3.1 Flash Lite Preview', model: 'gemini-3.1-flash-lite-preview' },
  'gemini-pro': { label: 'Gemini 3.1 Pro Preview', model: 'gemini-3.1-pro-preview' },
  'mistral-small': { label: 'Mistral Small 4', model: 'mistral-small-latest' },
  'mistral-medium': { label: 'Mistral Medium 3.1', model: 'mistral-medium-latest' },
  'mistral-large': { label: 'Mistral Large 3', model: 'mistral-large-latest' },
};

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
  /** Extraits à tonalité positive (alignés avec « Pros (N) » dans summary, N = longueur) */
  excerpts_pros?: ClusterExcerpt[];
  /** Extraits à tonalité négative / amélioration (alignés avec « Cons (M) », M = longueur) */
  excerpts_cons?: ClusterExcerpt[];
  /** @deprecated Anciennes analyses (avant pros/cons) */
  excerpts?: ClusterExcerpt[];
}

/** Tous les extraits du cluster (nouveau format : pros + cons ; ancien : excerpts seul) */
export function getAllClusterExcerpts(cluster: Cluster): ClusterExcerpt[] {
  const pros = cluster.excerpts_pros;
  const cons = cluster.excerpts_cons;
  if (Array.isArray(pros) || Array.isArray(cons)) {
    return [...(pros ?? []), ...(cons ?? [])];
  }
  return cluster.excerpts ?? [];
}

export function hasSplitExcerpts(cluster: Cluster): boolean {
  return Array.isArray(cluster.excerpts_pros) && Array.isArray(cluster.excerpts_cons);
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

export type LLMProvider =
  | 'gemini'
  | 'gemini-pro'
  | 'gemma-4-26b-a4b'
  | 'gemma-4-31b'
  | 'mistral-small'
  | 'mistral-medium'
  | 'mistral-large';

export const LLM_MODELS: Record<LLMProvider, { label: string; model: string }> = {
  gemini: { label: 'Gemini 3.1 Flash Lite Preview', model: 'gemini-3.1-flash-lite-preview' },
  'gemini-pro': { label: 'Gemini 3.1 Pro Preview', model: 'gemini-3.1-pro-preview' },
  'gemma-4-26b-a4b': {
    label: 'Gemma 4 26B A4B IT (open)',
    model: 'gemma-4-26b-a4b-it',
  },
  'gemma-4-31b': {
    label: 'Gemma 4 31B IT (open)',
    model: 'gemma-4-31b-it',
  },
  'mistral-small': { label: 'Mistral Small 4', model: 'mistral-small-latest' },
  'mistral-medium': { label: 'Mistral Medium 3.1', model: 'mistral-medium-latest' },
  'mistral-large': { label: 'Mistral Large 3', model: 'mistral-large-latest' },
};

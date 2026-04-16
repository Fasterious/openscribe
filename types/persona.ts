export interface PersonaRespondent {
  id: string;
  values: number[];
  metadata?: Record<string, string>;
}

export interface PersonaColumn {
  index: number;
  name: string;
  isLikert: boolean;
  min?: number;
  max?: number;
}

export interface SignatureVariable {
  varIdx: number;
  columnName: string;
  direction: 'high' | 'low' | 'mid';
  avgVal: number;
}

export interface PersonaCluster {
  centroid: number[];
  members: PersonaRespondent[];
  color: string;
  label: string;
  signatureVars: SignatureVariable[];
}

export interface CorrelationData {
  perQuestion: number[][][];
  totalMatrix: number[][];
  sortedIndices: number[];
}

export interface KResult {
  clusters: PersonaCluster[];
  correlationData: CorrelationData;
}

export type ClusteringAlgorithm = 'greedy-correlation' | 'subspace-cohesion';

export type Direction = 'H' | 'MH' | 'L' | 'ML' | 'N';

export interface DirectionPatternItem {
  varIdx: number;
  direction: Direction;
}

export interface DirectionPattern {
  items: DirectionPatternItem[];
  support: number;
  memberIndices: number[];
}

export interface PersonaAnalysisResult {
  clusters: PersonaCluster[];
  correlationData: CorrelationData;
  optimalK: number;
  silhouetteScores: { k: number; score: number }[];
  columnNames: string[];
  allResults: Record<number, KResult>;
  algorithm?: ClusteringAlgorithm;
}

export type PersonaStep = 'upload' | 'configure' | 'analyzing' | 'complete' | 'error';

export interface PersonaSession {
  id: string;
  creator_id: string;
  filename: string;
  status: PersonaStep;
  column_names: string[];
  selected_columns: number[];
  respondent_count: number;
  cluster_count: number;
  analysis_result: PersonaAnalysisResult | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const CLUSTER_COLORS = [
  '#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6',
  '#10b981', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
];

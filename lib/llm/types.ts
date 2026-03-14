import type { AnalysisResult } from '@/types/workshop';

export interface LLMClient {
  analyze(prompt: string): Promise<string>;
}

export interface ClusteringInput {
  question: string;
  responses: {
    id: string;
    participant_name: string;
    text: string;
  }[];
}

export type { AnalysisResult };

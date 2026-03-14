import type { LLMClient, ClusteringInput, AnalysisResult } from './types';
import type { LLMProvider } from '@/types/workshop';
import { createGeminiClient } from './gemini';
import { createMistralClient } from './mistral';
import { buildClusteringPrompt } from './prompts';

export function getLLMClient(provider: LLMProvider): LLMClient {
  switch (provider) {
    case 'gemini':
      return createGeminiClient();
    case 'mistral':
      return createMistralClient();
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export async function runClustering(
  provider: LLMProvider,
  input: ClusteringInput
): Promise<AnalysisResult> {
  const client = getLLMClient(provider);
  const prompt = buildClusteringPrompt(input);

  const raw = await client.analyze(prompt);
  const json = extractJSON(raw);

  try {
    const result: AnalysisResult = JSON.parse(json);
    if (!result.clusters || !Array.isArray(result.clusters)) {
      throw new Error('Invalid response: missing clusters array');
    }
    return result;
  } catch (e) {
    console.error('[Clustering] Failed to parse LLM response:', raw);
    throw new Error(
      `Failed to parse clustering result: ${e instanceof Error ? e.message : 'unknown error'}`
    );
  }
}

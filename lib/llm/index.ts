import type { LLMClient, ClusteringInput, AnalysisResult } from './types';
import type { LLMProvider } from '@/types/workshop';
import { LLM_MODELS } from '@/types/workshop';
import { createGeminiClient } from './gemini';
import { createMistralClient } from './mistral';
import { buildClusteringPrompt, buildStructureTextPrompt } from './prompts';

export interface StructuredResponse {
  participant_name: string;
  response_text: string;
}

export function getLLMClient(provider: LLMProvider): LLMClient {
  switch (provider) {
    case 'gemini':
    case 'gemini-pro':
      return createGeminiClient(LLM_MODELS[provider].model);
    case 'mistral-small':
    case 'mistral-medium':
    case 'mistral-large':
      return createMistralClient(LLM_MODELS[provider].model);
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

export async function runStructureText(
  provider: LLMProvider,
  rawText: string
): Promise<StructuredResponse[]> {
  const client = getLLMClient(provider);
  const prompt = buildStructureTextPrompt(rawText);

  const raw = await client.analyze(prompt);
  const json = extractJSON(raw);

  try {
    const result = JSON.parse(json);
    if (!Array.isArray(result)) {
      throw new Error('Response must be an array');
    }
    return result
      .filter(
        (r): r is StructuredResponse =>
          r &&
          typeof r === 'object' &&
          typeof r.participant_name === 'string' &&
          typeof r.response_text === 'string'
      )
      .map((r) => ({
        participant_name: r.participant_name.trim() || 'Speaker',
        response_text: r.response_text.trim(),
      }))
      .filter((r) => r.response_text.length > 0);
  } catch (e) {
    console.error('[StructureText] Failed to parse LLM response:', raw);
    throw new Error(
      `Failed to structure text: ${e instanceof Error ? e.message : 'unknown error'}`
    );
  }
}

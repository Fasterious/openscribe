import type { LLMClient, ClusteringInput, AnalysisResult } from './types';
import type { LLMProvider, Cluster } from '@/types/workshop';
import { LLM_MODELS } from '@/types/workshop';
import { createGeminiClient } from './gemini';
import { createMistralClient } from './mistral';
import { buildClusteringPrompt, buildStructureTextPrompt } from './prompts';

export interface StructuredResponse {
  participant_name: string;
  response_text: string;
}

export interface LLMClientOptions {
  mistralApiKey?: string;
  geminiApiKey?: string;
}

export function getLLMClient(provider: LLMProvider, keys?: LLMClientOptions): LLMClient {
  switch (provider) {
    case 'gemini':
    case 'gemini-pro':
      return createGeminiClient(LLM_MODELS[provider].model, { apiKey: keys?.geminiApiKey });
    case 'mistral-small':
      return createMistralClient(LLM_MODELS[provider].model, {
        reasoningEffort: 'high',
        apiKey: keys?.mistralApiKey,
      });
    case 'mistral-medium':
    case 'mistral-large':
      return createMistralClient(LLM_MODELS[provider].model, { apiKey: keys?.mistralApiKey });
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/** Migre l’ancien format `excerpts` unique vers excerpts_pros / excerpts_cons */
function normalizeClusterFromLLM(c: Cluster & { excerpts?: unknown }): Cluster {
  const pros = c.excerpts_pros;
  const cons = c.excerpts_cons;
  if (Array.isArray(pros) || Array.isArray(cons)) {
    return {
      ...c,
      excerpts_pros: Array.isArray(pros) ? pros : [],
      excerpts_cons: Array.isArray(cons) ? cons : [],
    };
  }
  const legacy = c.excerpts;
  if (Array.isArray(legacy)) {
    return {
      ...c,
      excerpts_pros: legacy as Cluster['excerpts_pros'],
      excerpts_cons: [],
    };
  }
  return { ...c, excerpts_pros: [], excerpts_cons: [] };
}

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export async function runClustering(
  provider: LLMProvider,
  input: ClusteringInput,
  keys?: LLMClientOptions
): Promise<AnalysisResult> {
  const client = getLLMClient(provider, keys);
  const prompt = buildClusteringPrompt(input);

  const raw = await client.analyze(prompt);
  const json = extractJSON(raw);

  try {
    const result: AnalysisResult = JSON.parse(json);
    if (!result.clusters || !Array.isArray(result.clusters)) {
      throw new Error('Invalid response: missing clusters array');
    }
    result.clusters = result.clusters.map(normalizeClusterFromLLM);
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
  rawText: string,
  keys?: LLMClientOptions
): Promise<StructuredResponse[]> {
  const client = getLLMClient(provider, keys);
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

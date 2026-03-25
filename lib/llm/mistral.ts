import type { LLMClient } from './types';

const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

/** Avec reasoning_effort=high, `content` peut être un tableau (thinking + text) — on ne garde que le texte final. */
function extractMistralAssistantContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const textChunks: string[] = [];
  for (const part of content) {
    if (part && typeof part === 'object' && 'type' in part) {
      const p = part as { type?: string; text?: string };
      if (p.type === 'text' && typeof p.text === 'string') textChunks.push(p.text);
    }
  }
  return textChunks.join('\n').trim();
}

export type MistralClientOptions = {
  /**
   * Raisonnement ajustable — documenté pour `mistral-small-latest` uniquement.
   * @see https://docs.mistral.ai/capabilities/reasoning/adjustable
   */
  reasoningEffort?: 'none' | 'high';
};

export function createMistralClient(
  model: string,
  options: MistralClientOptions = {}
): LLMClient {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not set');
  }

  const { reasoningEffort } = options;

  return {
    async analyze(prompt: string): Promise<string> {
      const body: Record<string, unknown> = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        random_seed: 42,
        response_format: { type: 'json_object' },
      };
      if (reasoningEffort !== undefined) {
        body.reasoning_effort = reasoningEffort;
      }

      const response = await fetch(MISTRAL_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      return extractMistralAssistantContent(raw);
    },
  };
}

import { GoogleGenAI } from '@google/genai';
import type { LLMClient } from './types';

export function createGeminiClient(
  model: string,
  options?: { apiKey?: string }
): LLMClient {
  const apiKey = options?.apiKey; // BYOK strict : pas de repli hébergeur
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({ apiKey });

  return {
    async analyze(prompt: string): Promise<string> {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0,
          seed: 42,
          responseMimeType: 'application/json',
        },
      });
      return result.text ?? '';
    },
  };
}

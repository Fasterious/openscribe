import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMClient } from './types';

export function createGeminiClient(): LLMClient {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  return {
    async analyze(prompt: string): Promise<string> {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    },
  };
}

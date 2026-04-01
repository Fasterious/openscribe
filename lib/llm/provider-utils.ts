import type { LLMProvider } from '@/types/workshop';
import type { ApiProvider } from '@/lib/user-api-keys';

/**
 * Maps an LLM provider identifier to the underlying API provider
 * (either 'mistral' or 'gemini') for key retrieval.
 */
export function getProviderType(provider: LLMProvider): ApiProvider {
  switch (provider) {
    case 'gemini':
    case 'gemini-pro':
      return 'gemini';
    case 'mistral-small':
    case 'mistral-medium':
    case 'mistral-large':
      return 'mistral';
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

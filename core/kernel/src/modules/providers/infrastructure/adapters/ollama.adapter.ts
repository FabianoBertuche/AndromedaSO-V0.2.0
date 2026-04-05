/**
 * @adapter Ollama Adapter
 *
 * Realiza chamadas HTTP reais à instância local do Ollama.
 * Degrada graciosamente para dados de seed quando o Ollama não está em execução ou a requisição falha.
 *
 * Referência: https://github.com/ollama/ollama/blob/main/docs/api.md#list-local-models
 */
import pino from 'pino';
import {
  createProviderAdapterChatError,
  type AdapterFactory,
  type ProviderChatMessage,
  type ProviderChatResult,
  ProviderAdapterChatError
} from './adapter.interface.js';
import { fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:ollama' });

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

interface OllamaChatResponse {
  message?: {
    role?: string;
    content?: string;
  };
}

function normalizeOllamaChatModelId(modelId: string): string {
  if (modelId.startsWith('ollama/')) {
    return modelId.slice('ollama/'.length);
  }

  return modelId;
}

function isOllamaConnectionFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return [
    'econnrefused',
    'enotfound',
    'fetch failed',
    'network',
    'timeout',
    'abort',
    'unreachable',
    'socket'
  ].some((term) => message.includes(term));
}

export const ollamaAdapterFactory: AdapterFactory = (_apiKey, baseUrl) => {
  const base = baseUrl ?? process.env.OLLAMA_BASE_URL ?? (
    process.env.NODE_ENV === 'production' 
      ? 'http://host.docker.internal:11434' 
      : DEFAULT_BASE_URL
  );

  return {
    async listModels() {
      const seedModels = listSeedModels('ollama');
      const cloudModels = seedModels.filter((m) => m.modelId.startsWith('ollama-cloud/'));
      try {
        const res = await fetchWithTimeout(`${base}/api/tags`, {}, 5000);
        const json = await res.json() as OllamaTagsResponse;
        const localModels = json.models.map((m) => ({
          modelId: m.name.startsWith('ollama/') ? m.name : `ollama/${m.name}`,
          displayName: m.name,
          contextWindow: 'unknown',
          capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'N/A',
          score: 0,
          latencyMs: 0
        }));
        // Merge real local models with cloud seed models
        return [...localModels, ...cloudModels];
      } catch (err) {
        log.warn({ err }, 'ollama listModels falhou, usando seed');
        return seedModels;
      }
    },

    async ping() {
      return pingWithTimeout(`${base}/api/tags`, {}, 3000);
    },

    async chat(modelId: string, messages: ProviderChatMessage[]): Promise<ProviderChatResult> {
      try {
        const response = await fetchWithTimeout(`${base}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: normalizeOllamaChatModelId(modelId),
            messages,
            stream: false
          })
        }, 30000);

        if (!response.ok) {
          log.warn({ modelId, status: response.status }, 'ollama chat returned non-ok response');
          throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Ollama chat request failed upstream.');
        }

        const payload = await response.json() as OllamaChatResponse;
        const content = payload.message?.content?.trim();

        if (!content) {
          throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Ollama chat returned an invalid assistant message.');
        }

        return {
          message: {
            role: 'assistant',
            content
          }
        };
      } catch (error) {
        if (error instanceof ProviderAdapterChatError) {
          throw error;
        }

        log.warn({ modelId, errorMessage: error instanceof Error ? error.message : 'Unknown error' }, 'ollama chat request failed');
        throw createProviderAdapterChatError(
          isOllamaConnectionFailure(error) ? 'PROVIDER_UNREACHABLE' : 'UPSTREAM_CHAT_FAILED',
          isOllamaConnectionFailure(error)
            ? 'Ollama provider is unavailable or unreachable.'
            : 'Ollama chat request failed upstream.'
        );
      }
    }
  };
};

// Backward-compatible export
export const ollamaAdapter = ollamaAdapterFactory();

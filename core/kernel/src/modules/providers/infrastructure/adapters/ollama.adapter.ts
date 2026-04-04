/**
 * @adapter Ollama Adapter
 *
 * Realiza chamadas HTTP reais à instância local do Ollama.
 * Degrada graciosamente para dados de seed quando o Ollama não está em execução ou a requisição falha.
 *
 * Referência: https://github.com/ollama/ollama/blob/main/docs/api.md#list-local-models
 */
import pino from 'pino';
import type { AdapterFactory } from './adapter.interface';
import { fetchWithTimeout, pingWithTimeout } from './http.utils';
import { listSeedModels } from './providerCatalog';

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

export const ollamaAdapterFactory: AdapterFactory = (_apiKey, baseUrl) => {
  const base = baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;

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
    }
  };
};

// Backward-compatible export
export const ollamaAdapter = ollamaAdapterFactory();

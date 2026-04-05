/**
 * @adapter LMStudio Adapter
 *
 * Realiza chamadas HTTP reais à instância local do LMStudio.
 * Degrada graciosamente para dados de seed quando o LMStudio não está em execução ou a requisição falha.
 *
 * Referência: https://lmstudio.ai/docs/api
 */
import pino from 'pino';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { type AdapterFactory } from './adapter.interface.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:lmstudio' });

const DEFAULT_BASE_URL = 'http://localhost:1234';

interface LMStudioModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface LMStudioModelsResponse {
  data: LMStudioModel[];
  object: string;
}

export const lmstudioAdapterFactory: AdapterFactory = (_apiKey, baseUrl) => {
  const base = baseUrl ?? DEFAULT_BASE_URL;

  return {
    async listModels() {
      const seedModels = listSeedModels('lmstudio');
      try {
        const res = await fetchWithTimeout(`${base}/v1/models`, {}, 5000);
        const json = await res.json() as LMStudioModelsResponse;
        return json.data.map((m) => ({
          modelId: m.id,
          displayName: m.id,
          contextWindow: 'unknown',
          capabilities: ['chat', 'coding'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'FREE',
          score: 0,
          latencyMs: 0
        }));
      } catch (err) {
        log.warn({ err }, 'lmstudio listModels falhou, usando seed');
        return seedModels;
      }
    },

    async ping() {
      return pingWithTimeout(`${base}/v1/models`, {}, 3000);
    },

    async chat(modelId, messages) {
      return chatWithOpenAiCompatibleApi({
        url: `${base}/v1/chat/completions`,
        modelId,
        messages,
        headers: {}
      });
    }
  };
};

// Backward-compatible export
export const lmstudioAdapter = lmstudioAdapterFactory();

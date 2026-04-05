/**
 * @adapter vLLM Adapter
 *
 * Realiza chamadas HTTP reais à instância local do vLLM.
 * Degrada graciosamente para dados de seed quando o vLLM não está em execução ou a requisição falha.
 *
 * Referência: https://docs.vllm.ai/en/latest/api/server_args.html
 */
import pino from 'pino';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { type AdapterFactory } from './adapter.interface.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:vllm' });

const DEFAULT_BASE_URL = 'http://localhost:8000';

interface VLLMModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface VLLMModelsResponse {
  data: VLLMModel[];
  object: string;
}

export const vllmAdapterFactory: AdapterFactory = (_apiKey, baseUrl) => {
  const base = baseUrl ?? DEFAULT_BASE_URL;

  return {
    async listModels() {
      const seedModels = listSeedModels('vllm');
      try {
        const res = await fetchWithTimeout(`${base}/v1/models`, {}, 5000);
        const json = await res.json() as VLLMModelsResponse;
        return json.data.map((m) => ({
          modelId: m.id,
          displayName: m.id,
          contextWindow: 'unknown',
          capabilities: ['chat', 'coding', 'analysis'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'SELF',
          score: 0,
          latencyMs: 0
        }));
      } catch (err) {
        log.warn({ err }, 'vllm listModels falhou, usando seed');
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
export const vllmAdapter = vllmAdapterFactory();

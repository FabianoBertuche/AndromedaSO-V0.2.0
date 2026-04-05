/**
 * @adapter Cohere Adapter
 *
 * Realiza chamadas HTTP reais à API da Cohere quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://docs.cohere.com/docs/models
 */
import pino from 'pino';
import { withUnsupportedChat, type AdapterFactory } from './adapter.interface.js';
import { fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:cohere' });

const COHERE_MODELS_URL = 'https://api.cohere.ai/v1/models';

interface CohereModel {
  id: string;
  object: string;
}

interface CohereModelsResponse {
  data: CohereModel[];
  object: 'list';
}

export const cohereAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => withUnsupportedChat({
  async listModels() {
    if (!apiKey) {
      return listSeedModels('cohere');
    }
    try {
      const res = await fetchWithTimeout(
        COHERE_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'Cohere API retornou erro, usando seed');
        return listSeedModels('cohere');
      }
      const json = await res.json() as CohereModelsResponse;
      return json.data.map((m) => ({
        modelId: m.id,
        displayName: m.id,
        contextWindow: 'unknown',
        capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
        priceLabel: 'N/A',
        score: 0,
        latencyMs: 0
      }));
    } catch (err) {
      log.warn({ err }, 'Cohere listModels falhou, usando seed');
      return listSeedModels('cohere');
    }
  },

  async ping() {
    if (!apiKey) {
      return { ok: true, latencyMs: 105 };
    }
    return pingWithTimeout(
      COHERE_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  }
}, 'cohere');

// Backward-compatible export
export const cohereAdapter = cohereAdapterFactory();

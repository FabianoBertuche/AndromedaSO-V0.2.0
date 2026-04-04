/**
 * @adapter OpenAI Adapter
 *
 * Realiza chamadas HTTP reais à API da OpenAI quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://platform.openai.com/docs/api-reference/models/list
 */
import pino from 'pino';
import type { AdapterFactory } from './adapter.interface';
import { fetchWithTimeout, pingWithTimeout } from './http.utils';
import { listSeedModels } from './providerCatalog';

const log = pino({ name: 'adapter:openai' });

const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';
const ALLOWED_PREFIXES = ['gpt-', 'o1', 'o3', 'o4'];

interface OpenAIModel {
  id: string;
  object: string;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
  object: 'list';
}

export const openAiAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('openai');
    }
    try {
      const res = await fetchWithTimeout(
        OPENAI_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      const json = await res.json() as OpenAIModelsResponse;
      return json.data
        .filter((m) => ALLOWED_PREFIXES.some((p) => m.id.startsWith(p)))
        .map((m) => ({
          modelId: m.id,
          displayName: m.id,
          contextWindow: 'unknown',
          capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'N/A',
          score: 0,
          latencyMs: 0
        }));
    } catch (err) {
      log.warn({ err }, 'openai listModels falhou, usando seed');
      return listSeedModels('openai');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 110 };
    }
    return pingWithTimeout(
      OPENAI_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  }
});

// Backward-compatible export for existing code that imports openAiAdapter directly
export const openAiAdapter = openAiAdapterFactory();

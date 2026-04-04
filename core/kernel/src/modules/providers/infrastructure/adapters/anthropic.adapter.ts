/**
 * @adapter Anthropic Adapter
 *
 * Realiza chamadas HTTP reais à API da Anthropic quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://docs.anthropic.com/en/api/models-list
 */
import pino from 'pino';
import type { AdapterFactory } from './adapter.interface';
import { fetchWithTimeout, pingWithTimeout } from './http.utils';
import { listSeedModels } from './providerCatalog';

const log = pino({ name: 'adapter:anthropic' });

const ANTHROPIC_MODELS_URL = 'https://api.anthropic.com/v1/models';
const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicModel {
  id: string;
  display_name: string;
  created_at: string;
  type: 'model';
}

interface AnthropicModelsResponse {
  data: AnthropicModel[];
}

export const anthropicAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => {
  const headers: Record<string, string> = {
    'anthropic-version': ANTHROPIC_VERSION,
    ...(apiKey ? { 'x-api-key': apiKey } : {})
  };

  return {
    async listModels() {
      if (!apiKey) {
        // Retorna dados de seed estáticos — apiKey não configurada.
        return listSeedModels('anthropic');
      }
      try {
        const res = await fetchWithTimeout(ANTHROPIC_MODELS_URL, { headers }, 5000);
        const json = await res.json() as AnthropicModelsResponse;
        return json.data.map((m) => ({
          modelId: m.id,
          displayName: m.display_name,
          contextWindow: 'unknown',
          capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'N/A',
          score: 0,
          latencyMs: 0
        }));
      } catch (err) {
        log.warn({ err }, 'anthropic listModels falhou, usando seed');
        return listSeedModels('anthropic');
      }
    },

    async ping() {
      if (!apiKey) {
        // Latência fixa simulada — apiKey não configurada.
        return { ok: true, latencyMs: 135 };
      }
      return pingWithTimeout(ANTHROPIC_MODELS_URL, { headers }, 3000);
    }
  };
};

// Backward-compatible export
export const anthropicAdapter = anthropicAdapterFactory();

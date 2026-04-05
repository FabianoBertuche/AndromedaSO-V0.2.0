/**
 * @adapter Hyperbolic Adapter
 *
 * Realiza chamadas HTTP reais à API da Hyperbolic quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://api.hyperbolic.xyz/v1/models
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:hyperbolic' });

const HYPERBOLIC_MODELS_URL = 'https://api.hyperbolic.xyz/v1/models';

interface HyperbolicModel {
  id: string;
  object: string;
}

interface HyperbolicModelsResponse {
  data: HyperbolicModel[];
  object: 'list';
}

export const hyperbolicAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      return listSeedModels('hyperbolic');
    }
    try {
      const res = await fetchWithTimeout(
        HYPERBOLIC_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'Hyperbolic API retornou erro, usando seed');
        return listSeedModels('hyperbolic');
      }
      const json = await res.json() as HyperbolicModelsResponse;
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
      log.warn({ err }, 'Hyperbolic listModels falhou, usando seed');
      return listSeedModels('hyperbolic');
    }
  },

  async ping() {
    if (!apiKey) {
      return { ok: true, latencyMs: 115 };
    }
    return pingWithTimeout(
      HYPERBOLIC_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Hyperbolic chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.hyperbolic.xyz/v1/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const hyperbolicAdapter = hyperbolicAdapterFactory();

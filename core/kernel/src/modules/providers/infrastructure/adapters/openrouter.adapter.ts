/**
 * @adapter OpenRouter Adapter
 *
 * Realiza chamadas HTTP reais à API da OpenRouter quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://openrouter.ai/models
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:openrouter' });

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/v1/models';

interface OpenRouterModel {
  id: string;
  object: string;
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
  object: 'list';
}

export const openrouterAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      return listSeedModels('openrouter');
    }
    try {
      const res = await fetchWithTimeout(
        OPENROUTER_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'OpenRouter API retornou erro, usando seed');
        return listSeedModels('openrouter');
      }
      const json = await res.json() as OpenRouterModelsResponse;
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
      log.warn({ err }, 'OpenRouter listModels falhou, usando seed');
      return listSeedModels('openrouter');
    }
  },

  async ping() {
    if (!apiKey) {
      return { ok: true, latencyMs: 110 };
    }
    return pingWithTimeout(
      OPENROUTER_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'OpenRouter chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const openrouterAdapter = openrouterAdapterFactory();

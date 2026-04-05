/**
 * @adapter Together AI Adapter
 *
 * Realiza chamadas HTTP reais à API da Together AI quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://docs.together.ai/api
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:together' });

const TOGETHER_MODELS_URL = 'https://api.together.ai/v1/models';

interface TogetherModel {
  id: string;
  object: string;
}

interface TogetherModelsResponse {
  data: TogetherModel[];
  object: 'list';
}

export const togetherAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('together');
    }
    try {
      const res = await fetchWithTimeout(
        TOGETHER_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'Together AI API retornou erro, usando seed');
        return listSeedModels('together');
      }
      const json = await res.json() as TogetherModelsResponse;
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
      log.warn({ err }, 'Together AI listModels falhou, usando seed');
      return listSeedModels('together');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 120 };
    }
    return pingWithTimeout(
      TOGETHER_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Together chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.together.ai/v1/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const togetherAdapter = togetherAdapterFactory();

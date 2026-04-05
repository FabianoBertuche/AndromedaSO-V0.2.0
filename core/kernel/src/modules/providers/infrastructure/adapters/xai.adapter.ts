/**
 * @adapter xAI Adapter
 *
 * Realiza chamadas HTTP reais à API da xAI quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://docs.x.ai/api
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:xai' });

const XAI_MODELS_URL = 'https://api.x.ai/v1/models';

interface XaiModel {
  id: string;
  object: string;
}

interface XaiModelsResponse {
  data: XaiModel[];
  object: 'list';
}

export const xaiAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('xai');
    }
    try {
      const res = await fetchWithTimeout(
        XAI_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'xAI API retornou erro, usando seed');
        return listSeedModels('xai');
      }
      const json = await res.json() as XaiModelsResponse;
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
      log.warn({ err }, 'xAI listModels falhou, usando seed');
      return listSeedModels('xai');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 120 };
    }
    return pingWithTimeout(
      XAI_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'xAI chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.x.ai/v1/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const xaiAdapter = xaiAdapterFactory();

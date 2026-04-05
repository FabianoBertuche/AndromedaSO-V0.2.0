/**
 * @adapter Fireworks AI Adapter
 *
 * Realiza chamadas HTTP reais à API da Fireworks AI quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://docs.fireworks.ai/api
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:fireworks' });

const FIREWORKS_MODELS_URL = 'https://api.fireworks.ai/v1/models';

interface FireworksModel {
  id: string;
  object: string;
}

interface FireworksModelsResponse {
  data: FireworksModel[];
  object: 'list';
}

export const fireworksAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('fireworks');
    }
    try {
      const res = await fetchWithTimeout(
        FIREWORKS_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'Fireworks AI API retornou erro, usando seed');
        return listSeedModels('fireworks');
      }
      const json = await res.json() as FireworksModelsResponse;
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
      log.warn({ err }, 'Fireworks AI listModels falhou, usando seed');
      return listSeedModels('fireworks');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 120 };
    }
    return pingWithTimeout(
      FIREWORKS_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Fireworks chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.fireworks.ai/v1/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const fireworksAdapter = fireworksAdapterFactory();

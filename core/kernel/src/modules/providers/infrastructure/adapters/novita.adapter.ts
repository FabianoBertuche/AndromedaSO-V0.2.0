/**
 * @adapter Novita Adapter
 *
 * Realiza chamadas HTTP reais à API da Novita quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://novita.ai/api
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:novita' });

const NOVITA_MODELS_URL = 'https://api.novita.ai/v1/models';

interface NovitaModel {
  id: string;
  object: string;
  display_name?: string;
}

interface NovitaModelsResponse {
  data: NovitaModel[];
  object: 'list';
}

export const novitaAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      return listSeedModels('novita');
    }
    try {
      const res = await fetchWithTimeout(
        NOVITA_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'Novita API retornou erro, usando seed');
        return listSeedModels('novita');
      }
      const json = await res.json() as NovitaModelsResponse;
      return json.data.map((m) => ({
        modelId: m.id,
        displayName: m.display_name ?? m.id,
        contextWindow: 'unknown',
        capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
        priceLabel: 'N/A',
        score: 0,
        latencyMs: 0
      }));
    } catch (err) {
      log.warn({ err }, 'Novita listModels falhou, usando seed');
      return listSeedModels('novita');
    }
  },

  async ping() {
    if (!apiKey) {
      return { ok: true, latencyMs: 120 };
    }
    return pingWithTimeout(
      NOVITA_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Novita chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.novita.ai/v3/openai/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const novitaAdapter = novitaAdapterFactory();

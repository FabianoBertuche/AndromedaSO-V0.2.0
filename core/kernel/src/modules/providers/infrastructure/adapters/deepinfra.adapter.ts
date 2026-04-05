/**
 * @adapter DeepInfra Adapter
 *
 * Realiza chamadas HTTP reais à API da DeepInfra quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://deepinfra.com/docs/api
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:deepinfra' });

const DEEPINFRA_MODELS_URL = 'https://api.deepinfra.com/v1/models';

interface DeepInfraModel {
  id: string;
  object: string;
  display_name?: string;
}

interface DeepInfraModelsResponse {
  data: DeepInfraModel[];
  object: 'list';
}

export const deepinfraAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      return listSeedModels('deepinfra');
    }
    try {
      const res = await fetchWithTimeout(
        DEEPINFRA_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'DeepInfra API retornou erro, usando seed');
        return listSeedModels('deepinfra');
      }
      const json = await res.json() as DeepInfraModelsResponse;
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
      log.warn({ err }, 'DeepInfra listModels falhou, usando seed');
      return listSeedModels('deepinfra');
    }
  },

  async ping() {
    if (!apiKey) {
      return { ok: true, latencyMs: 120 };
    }
    return pingWithTimeout(
      DEEPINFRA_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'DeepInfra chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.deepinfra.com/v1/openai/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const deepinfraAdapter = deepinfraAdapterFactory();

/**
 * @adapter Groq Adapter
 *
 * Realiza chamadas HTTP reais à API da Groq (compatível com OpenAI) quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://console.groq.com/docs/openai
 */
import pino from 'pino';
import { createProviderAdapterChatError, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:groq' });

const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

interface GroqModel {
  id: string;
  object: string;
}

interface GroqModelsResponse {
  data: GroqModel[];
}

export const groqAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('groq');
    }
    try {
      const res = await fetchWithTimeout(
        GROQ_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      const json = await res.json() as GroqModelsResponse;
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
      log.warn({ err }, 'groq listModels falhou, usando seed');
      return listSeedModels('groq');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 65 };
    }
    return pingWithTimeout(
      GROQ_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  },

  async chat(modelId, messages) {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Groq chat requires a configured API key.');
    }

    return chatWithOpenAiCompatibleApi({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      modelId,
      messages,
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  }
});

// Backward-compatible export
export const groqAdapter = groqAdapterFactory();

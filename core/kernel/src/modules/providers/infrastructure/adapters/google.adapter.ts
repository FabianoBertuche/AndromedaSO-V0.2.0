/**
 * @adapter Google Adapter
 *
 * Realiza chamadas HTTP reais à API do Google Generative Language quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://ai.google.dev/api/rest/v1beta/models/list
 */
import pino from 'pino';
import { withUnsupportedChat, type AdapterFactory } from './adapter.interface.js';
import { fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:google' });

const GOOGLE_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GoogleModel {
  name: string;
  displayName?: string;
  version?: string;
  description?: string;
}

interface GoogleModelsResponse {
  models?: GoogleModel[];
}

export const googleAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => withUnsupportedChat({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('google');
    }

    try {
      const url = `${GOOGLE_MODELS_URL}?key=${apiKey}`;
      const res = await fetchWithTimeout(url, {}, 5000);
      if (!res.ok) {
        log.warn({ status: res.status }, 'google API retornou erro, usando seed');
        return listSeedModels('google');
      }
      const json = await res.json() as GoogleModelsResponse;
      const models = json.models ?? [];
      return models.map((m) => ({
        modelId: m.name,
        displayName: m.displayName ?? m.name,
        contextWindow: 'unknown',
        capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
        priceLabel: 'N/A',
        score: 0,
        latencyMs: 0
      }));
    } catch (err) {
      log.warn({ err }, 'google listModels falhou, usando seed');
      return listSeedModels('google');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 120 };
    }
    const url = `${GOOGLE_MODELS_URL}?key=${apiKey}`;
    return pingWithTimeout(url, {}, 3000);
  }
}, 'google');

// Backward-compatible export
export const googleAdapter = googleAdapterFactory();

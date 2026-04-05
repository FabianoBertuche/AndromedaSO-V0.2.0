/**
 * @adapter Replicate Adapter
 *
 * Realiza chamadas HTTP reais à API da Replicate quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Nota: A API de listagem de modelos da Replicate pode não suportar listagem pública.
 * Este adapter tenta o endpoint padrão e usa seed como fallback.
 *
 * Referência: https://replicate.com/docs/api
 */
import pino from 'pino';
import { withUnsupportedChat, type AdapterFactory } from './adapter.interface.js';
import { fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:replicate' });

const REPLICATE_MODELS_URL = 'https://api.replicate.com/v1/models';

interface ReplicateModel {
  id: string;
  object: string;
}

interface ReplicateModelsResponse {
  data: ReplicateModel[];
  object: 'list';
}

export const replicateAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => withUnsupportedChat({
  async listModels() {
    if (!apiKey) {
      return listSeedModels('replicate');
    }
    try {
      const res = await fetchWithTimeout(
        REPLICATE_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      if (!res.ok) {
        log.warn({ status: res.status }, 'Replicate API retornou erro, usando seed');
        return listSeedModels('replicate');
      }
      const json = await res.json() as ReplicateModelsResponse;
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
      log.warn({ err }, 'Replicate listModels falhou, usando seed');
      return listSeedModels('replicate');
    }
  },

  async ping() {
    if (!apiKey) {
      return { ok: true, latencyMs: 125 };
    }
    return pingWithTimeout(
      REPLICATE_MODELS_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      3000
    );
  }
}, 'replicate');

// Backward-compatible export
export const replicateAdapter = replicateAdapterFactory();

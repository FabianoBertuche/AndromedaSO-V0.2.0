/**
 * @adapter Google Vertex AI Adapter
 *
 * Realiza chamadas HTTP reais à API Google Vertex AI.
 * Degrada graciosamente para dados de seed quando a requisição falha.
 *
 * Referência: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference
 */
import pino from 'pino';
import { withUnsupportedChat, type AdapterFactory } from './adapter.interface';
import { fetchWithTimeout, pingWithTimeout } from './http.utils';
import { listSeedModels } from './providerCatalog';

const log = pino({ name: 'adapter:google-vertex' });

interface VertexModel {
  name: string;
  displayName?: string;
  version?: string;
  description?: string;
  infrastructure?: {
    tier?: string;
  };
}

interface VertexModelsResponse {
  models?: VertexModel[];
}

export const googleVertexAdapterFactory: AdapterFactory = (apiKey, baseUrl) => {
  // Google Vertex AI requires a baseUrl like https://us-central1-aiplatform.googleapis.com
  if (!baseUrl) {
    log.warn('Google Vertex baseUrl not configured, using seed data');
    return withUnsupportedChat({
      async listModels() {
        return listSeedModels('google-vertex');
      },
      async ping() {
        return { ok: false, latencyMs: 0 };
      }
    }, 'google-vertex');
  }

  return withUnsupportedChat({
    async listModels() {
      const seedModels = listSeedModels('google-vertex');

      if (!apiKey) {
        log.warn('Google Vertex api-key not configured, using seed data');
        return seedModels;
      }

      try {
        const modelsUrl = `${baseUrl}/v1beta/models`;
        const res = await fetchWithTimeout(modelsUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }, 5000);

        if (!res.ok) {
          log.warn({ status: res.status }, 'Google Vertex models API returned error, using seed');
          return seedModels;
        }

        const json = await res.json() as VertexModelsResponse;
        const models = json.models ?? [];

        if (models.length === 0) {
          log.warn('No Google Vertex models found, using seed');
          return seedModels;
        }

        return models.map((m) => ({
          modelId: m.name,
          displayName: m.displayName ?? m.name,
          contextWindow: '1M',
          capabilities: ['chat', 'coding', 'analysis'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'VERTEX',
          score: 8.7,
          latencyMs: 0
        }));
      } catch (err) {
        log.warn({ err }, 'Google Vertex listModels failed, using seed');
        return seedModels;
      }
    },

    async ping() {
      if (!apiKey || !baseUrl) {
        return { ok: false, latencyMs: 0 };
      }

      try {
        const modelsUrl = `${baseUrl}/v1beta/models`;
        return await pingWithTimeout(modelsUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }, 3000);
      } catch {
        return { ok: false, latencyMs: 3000 };
      }
    }
  }, 'google-vertex');
};

// Backward-compatible export
export const googleVertexAdapter = googleVertexAdapterFactory(undefined, undefined);

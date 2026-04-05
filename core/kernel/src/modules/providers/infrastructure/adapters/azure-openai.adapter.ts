/**
 * @adapter Azure OpenAI Adapter
 *
 * Realiza chamadas HTTP reais à instância Azure OpenAI.
 * Degrada graciosamente para dados de seed quando a requisição falha.
 *
 * Referência: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
 */
import pino from 'pino';
import { createProviderAdapterChatError, withUnsupportedChat, type AdapterFactory } from './adapter.interface.js';
import { chatWithOpenAiCompatibleApi, fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:azure-openai' });

interface AzureOpenAIDeployment {
  id: string;
  name: string;
  model: string;
  version?: string;
  resourceName?: string;
}

interface AzureOpenAIDeploymentsResponse {
  value?: AzureOpenAIDeployment[];
}

export const azureOpenAiAdapterFactory: AdapterFactory = (apiKey, baseUrl) => {
  // Azure OpenAI requires a baseUrl like https://my-resource.openai.azure.com
  if (!baseUrl) {
    log.warn('Azure OpenAI baseUrl not configured, using seed data');
    return withUnsupportedChat({
      async listModels() {
        return listSeedModels('azure-openai');
      },
      async ping() {
        return { ok: false, latencyMs: 0 };
      }
    }, 'azure-openai');
  }

  return {
    async listModels() {
      const seedModels = listSeedModels('azure-openai');

      if (!apiKey) {
        log.warn('Azure OpenAI api-key not configured, using seed data');
        return seedModels;
      }

      try {
        const deploymentsUrl = `${baseUrl}/openai/deployments?api-version=2024-02-01`;
        const res = await fetchWithTimeout(deploymentsUrl, {
          headers: {
            'api-key': apiKey
          }
        }, 5000);

        if (!res.ok) {
          log.warn({ status: res.status }, 'Azure OpenAI deployments API returned error, using seed');
          return seedModels;
        }

        const json = await res.json() as AzureOpenAIDeploymentsResponse;
        const deployments = json.value ?? [];

        if (deployments.length === 0) {
          log.warn('No Azure OpenAI deployments found, using seed');
          return seedModels;
        }

        return deployments.map((d) => ({
          modelId: d.model ?? d.name,
          displayName: d.name,
          contextWindow: '128k',
          capabilities: ['chat', 'coding', 'analysis'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'AZURE',
          score: 9.0,
          latencyMs: 0
        }));
      } catch (err) {
        log.warn({ err }, 'Azure OpenAI listModels failed, using seed');
        return seedModels;
      }
    },

    async ping() {
      if (!apiKey || !baseUrl) {
        return { ok: false, latencyMs: 0 };
      }

      try {
        const deploymentsUrl = `${baseUrl}/openai/deployments?api-version=2024-02-01`;
        return await pingWithTimeout(deploymentsUrl, {
          headers: {
            'api-key': apiKey
          }
        }, 3000);
      } catch {
        return { ok: false, latencyMs: 3000 };
      }
    },

    async chat(modelId, messages) {
      if (!apiKey || !baseUrl) {
        throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Azure OpenAI chat requires a configured API key and base URL.');
      }

      return chatWithOpenAiCompatibleApi({
        url: `${baseUrl}/openai/deployments/${modelId}/chat/completions?api-version=2024-02-01`,
        modelId,
        messages,
        headers: { 'api-key': apiKey }
      });
    }
  };
};

// Backward-compatible export
export const azureOpenAiAdapter = azureOpenAiAdapterFactory(undefined, undefined);

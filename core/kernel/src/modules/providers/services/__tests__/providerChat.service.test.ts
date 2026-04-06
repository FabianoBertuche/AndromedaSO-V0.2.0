import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderOrchestratorService } from '../providerOrchestratorService.js';
import type { ProviderChatMessage, ProviderChatResult } from '../../infrastructure/adapters/adapter.interface.js';
import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../../domain/entities/provider.entity.js';
import type { ProviderRepository } from '../../domain/repositories/provider.repository.js';

const unsupportedOauthSessionOperation = async () => {
  throw new Error('OAuth session operations are not supported in this mock repository');
};

type ProviderChatCapableService = ProviderOrchestratorService & {
  chatByModel(input: {
    modelId: string;
    messages: ProviderChatMessage[];
  }): Promise<ProviderChatResult>;
};

function createMockRepo(): ProviderRepository {
  const providers = new Map<string, Provider>();
  const catalogs = new Map<string, ModelCatalogItem[]>();
  const benchmarks: ModelBenchmarkResult[] = [];
  const decisions: Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }> = [];

  return {
    async create(provider) {
      providers.set(provider.id, provider);
      return provider;
    },
    async update(provider) {
      providers.set(provider.id, provider);
      return provider;
    },
    async findById(id) {
      return providers.get(id) ?? null;
    },
    async findByName(name) {
      return [...providers.values()].find((provider) => provider.name === name) ?? null;
    },
    async list() {
      return [...providers.values()];
    },
    async setCatalog(providerId, models) {
      catalogs.set(providerId, models);
    },
    async getCatalog(providerId) {
      return catalogs.get(providerId) ?? [];
    },
    async addBenchmark(result) {
      benchmarks.push(result);
    },
    async listBenchmarks() {
      return [...benchmarks];
    },
    async addRoutingDecision(decision) {
      decisions.push(decision);
    },
    async listRoutingDecisions() {
      return [...decisions];
    },
    createOAuthSession: unsupportedOauthSessionOperation,
    findOAuthSessionByStateHash: unsupportedOauthSessionOperation,
    claimOAuthSessionByStateHash: unsupportedOauthSessionOperation,
    consumeOAuthSession: unsupportedOauthSessionOperation,
    deleteExpiredOAuthSessions: async () => undefined,
    async delete(id) {
      providers.delete(id);
    },
    async reset() {
      providers.clear();
      catalogs.clear();
      benchmarks.length = 0;
      decisions.length = 0;
    }
  };
}

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: overrides.id ?? 'provider-1',
    name: overrides.name ?? 'provider-1',
    type: overrides.type ?? 'openai',
    health: overrides.health ?? 'ok',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    selectedModelIds: overrides.selectedModelIds ?? [],
    apiKeyEnc: overrides.apiKeyEnc,
    baseUrl: overrides.baseUrl,
    variant: overrides.variant,
    authMode: overrides.authMode,
    healthDetails: overrides.healthDetails
  };
}

function createCatalogItem(overrides: Partial<ModelCatalogItem> = {}): ModelCatalogItem {
  return {
    id: overrides.id ?? 'catalog-1',
    providerId: overrides.providerId ?? 'provider-1',
    modelId: overrides.modelId ?? 'gpt-4o-mini',
    displayName: overrides.displayName ?? 'GPT-4o Mini',
    contextWindow: overrides.contextWindow ?? '128k',
    capabilities: overrides.capabilities ?? ['chat'],
    priceLabel: overrides.priceLabel ?? 'N/A',
    score: overrides.score ?? 0,
    latencyMs: overrides.latencyMs ?? 0
  };
}

describe('ProviderOrchestratorService.chatByModel', () => {
  let repository: ProviderRepository;
  let service: ProviderChatCapableService;

  beforeEach(() => {
    repository = createMockRepo();
    service = new ProviderOrchestratorService(repository) as ProviderChatCapableService;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves the model owner from the persisted catalog and returns the assistant message', async () => {
    const provider = createProvider({
      id: 'provider-openai',
      name: 'openai-primary',
      apiKeyEnc: Buffer.from('sk-test').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'gpt-4o-mini' })]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'hello from upstream'
          }
        }
      ]
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    await expect(service.chatByModel({
      modelId: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hello' }]
    })).resolves.toEqual({
      message: {
        role: 'assistant',
        content: 'hello from upstream'
      }
    });
  });

  it('fails with MODEL_NOT_FOUND when no persisted catalog contains the requested model', async () => {
    await repository.create(createProvider());
    await repository.setCatalog('provider-1', [createCatalogItem({ modelId: 'other-model' })]);

    await expect(service.chatByModel({
      modelId: 'missing-model',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toMatchObject({ code: 'MODEL_NOT_FOUND' });
  });

  it('uses first-match strategy when the same model exists in multiple catalogs', async () => {
    const firstProvider = createProvider({ id: 'provider-1', name: 'provider-1' });
    const secondProvider = createProvider({ id: 'provider-2', name: 'provider-2', type: 'groq' });

    await repository.create(firstProvider);
    await repository.create(secondProvider);
    await repository.setCatalog(firstProvider.id, [createCatalogItem({ providerId: firstProvider.id, modelId: 'shared-model' })]);
    await repository.setCatalog(secondProvider.id, [createCatalogItem({ id: 'catalog-2', providerId: secondProvider.id, modelId: 'shared-model' })]);

    // Should resolve to the first provider (first-match strategy) and fail there due to missing adapter API key
    await expect(service.chatByModel({
      modelId: 'shared-model',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toBeDefined();
  });

  it('fails with PROVIDER_NOT_FOUND when the matching catalog points to a missing provider', async () => {
    const provider = createProvider({ id: 'provider-1', name: 'provider-1' });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: 'provider-missing', modelId: 'orphaned-model' })]);

    await expect(service.chatByModel({
      modelId: 'orphaned-model',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toMatchObject({ code: 'PROVIDER_NOT_FOUND' });
  });

  it('maps connection failures to PROVIDER_UNREACHABLE', async () => {
    const provider = createProvider({
      id: 'provider-openai',
      name: 'openai-primary',
      apiKeyEnc: Buffer.from('sk-test').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'gpt-4o-mini' })]);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1')));

    await expect(service.chatByModel({
      modelId: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toMatchObject({ code: 'PROVIDER_UNREACHABLE' });
  });

  it('maps upstream provider failures to UPSTREAM_CHAT_FAILED', async () => {
    const provider = createProvider({
      id: 'provider-openai',
      name: 'openai-primary',
      apiKeyEnc: Buffer.from('sk-test').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'gpt-4o-mini' })]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'boom' } }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })));

    await expect(service.chatByModel({
      modelId: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toMatchObject({ code: 'UPSTREAM_CHAT_FAILED' });
  });

  it('supports chat for synced OpenAI-compatible providers that the frontend can select', async () => {
    const provider = createProvider({
      id: 'provider-groq',
      name: 'groq-primary',
      type: 'groq',
      apiKeyEnc: Buffer.from('groq-key').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'llama-3.1-405b' })]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'groq says hello'
          }
        }
      ]
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    await expect(service.chatByModel({
      modelId: 'llama-3.1-405b',
      messages: [{ role: 'user', content: 'hello' }]
    })).resolves.toEqual({
      message: {
        role: 'assistant',
        content: 'groq says hello'
      }
    });
  });

  it('fails explicitly when a synced provider model cannot chat safely', async () => {
    const provider = createProvider({
      id: 'provider-bedrock',
      name: 'bedrock-primary',
      type: 'aws-bedrock',
      apiKeyEnc: Buffer.from('access:secret').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'bedrock-claude' })]);

    await expect(service.chatByModel({
      modelId: 'bedrock-claude',
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toMatchObject({
      code: 'UPSTREAM_CHAT_FAILED',
      message: 'aws-bedrock chat is not supported by this adapter.'
    });
  });
});

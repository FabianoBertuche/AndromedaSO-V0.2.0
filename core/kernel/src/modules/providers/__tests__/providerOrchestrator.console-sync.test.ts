import { describe, expect, it, vi } from 'vitest';
import { ProviderOrchestratorService } from '../services/providerOrchestratorService.js';
import type { ModelCatalogItem, Provider } from '../domain/entities/provider.entity.js';
import type { ProviderRepository } from '../domain/repositories/provider.repository.js';

function createFailingCatalogRepo(): ProviderRepository {
  const provider: Provider = {
    id: 'provider-1',
    name: 'openai',
    type: 'openai',
    variant: 'openai-api',
    health: 'warning',
    createdAt: '2026-01-01T00:00:00.000Z',
    selectedModelIds: ['gpt-4o']
  };

  const catalog: ModelCatalogItem[] = [{
    id: 'catalog-1',
    providerId: 'provider-1',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    contextWindow: '128k',
    capabilities: ['coding', 'chat'],
    priceLabel: '$0.02',
    score: 9,
    latencyMs: 120
  }];

  return {
    async create(item) { return item; },
    async update(item) { Object.assign(provider, item); return provider; },
    async findById(id) { return id === provider.id ? provider : null; },
    async findByName(name) { return name === provider.name ? provider : null; },
    async list() { return [provider]; },
    async setCatalog() { throw new Error('Sync upstream failed'); },
    async getCatalog() { return [...catalog]; },
    async addBenchmark() {},
    async listBenchmarks() { return []; },
    async addRoutingDecision() {},
    async listRoutingDecisions() { return []; },
    async createOAuthSession() { throw new Error('Unsupported'); },
    async findOAuthSessionByStateHash() { return null; },
    async claimOAuthSessionByStateHash() { return null; },
    async consumeOAuthSession() { return false; },
    async deleteExpiredOAuthSessions() {},
    async reset() {},
    async delete() {}
  };
}

describe('ProviderOrchestratorService sync safety', () => {
  it('preserves saved config and selectedModelIds when sync fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 'gpt-4o', object: 'model' }]
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    const repo = createFailingCatalogRepo();
    const service = new ProviderOrchestratorService(repo);

    await expect(service.syncModels('provider-1')).rejects.toThrow('Sync upstream failed');

    const provider = await repo.findById('provider-1');
    const catalog = await repo.getCatalog('provider-1');

    expect(provider?.selectedModelIds).toEqual(['gpt-4o']);
    expect(provider?.type).toBe('openai');
    expect(catalog.map((item) => item.modelId)).toEqual(['gpt-4o']);
  });
});

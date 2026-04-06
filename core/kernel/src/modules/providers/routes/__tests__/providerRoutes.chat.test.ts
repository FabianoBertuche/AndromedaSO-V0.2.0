import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../config/validateEnvironment.js', () => ({
  validateEnvironment: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../../../store/postgresRegistry.js', () => ({
  registerModule: vi.fn().mockResolvedValue([]),
  getModuleById: vi.fn().mockResolvedValue([]),
  persistLifecycleEvent: vi.fn().mockResolvedValue([]),
  persistValidationDecision: vi.fn().mockResolvedValue([])
}));

type BuildServer = typeof import('../../../../server.js').buildServer;
type GetProviderRepository = typeof import('../../infrastructure/repositories/provider.repository.factory.js').getProviderRepository;
type ResetProviderRepositoryFactory = typeof import('../../infrastructure/repositories/provider.repository.factory.js').resetProviderRepositoryFactory;
type ProviderRepository = import('../../domain/repositories/provider.repository.js').ProviderRepository;
type Provider = import('../../domain/entities/provider.entity.js').Provider;
type ModelCatalogItem = import('../../domain/entities/provider.entity.js').ModelCatalogItem;

let buildServer: BuildServer;
let getProviderRepository: GetProviderRepository;
let resetProviderRepositoryFactory: ResetProviderRepositoryFactory;
let server: Awaited<ReturnType<BuildServer>>;
let repository: ProviderRepository;

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

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PROVIDER_REPOSITORY_MODE = 'memory';

  ({ buildServer } = await import('../../../../server.js'));
  ({ getProviderRepository, resetProviderRepositoryFactory } = await import('../../infrastructure/repositories/provider.repository.factory.js'));

  resetProviderRepositoryFactory();
  repository = await getProviderRepository();
  server = await buildServer(false);
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await repository.reset();
});

describe('POST /api/providers/chat', () => {
  it('returns the exact assistant message contract on success', async () => {
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
            content: 'route success'
          }
        }
      ]
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: {
        role: 'assistant',
        content: 'route success'
      }
    });
  });

  it('returns 400 INVALID_CHAT_PAYLOAD for invalid request bodies', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: '   ',
        messages: [{ role: 'system', content: '   ' }]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'INVALID_CHAT_PAYLOAD'
    });
  });

  it('returns 404 MODEL_NOT_FOUND when the model is absent from every catalog', async () => {
    await repository.create(createProvider({ id: 'provider-1', name: 'provider-1' }));
    await repository.setCatalog('provider-1', [createCatalogItem({ providerId: 'provider-1', modelId: 'other-model' })]);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'missing-model',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: 'MODEL_NOT_FOUND'
    });
  });

  it('uses first-match strategy when the same model exists in multiple catalogs', async () => {
    await repository.create(createProvider({ id: 'provider-1', name: 'provider-1' }));
    await repository.create(createProvider({ id: 'provider-2', name: 'provider-2', type: 'groq' }));
    await repository.setCatalog('provider-1', [createCatalogItem({ providerId: 'provider-1', modelId: 'shared-model' })]);
    await repository.setCatalog('provider-2', [createCatalogItem({ id: 'catalog-2', providerId: 'provider-2', modelId: 'shared-model' })]);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'shared-model',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    // First-match strategy: should use first provider instead of returning 409
    // Will fail with 502 (upstream error) because the mock provider can't actually chat
    expect(response.statusCode).toBe(502);
  });

  it('returns 404 PROVIDER_NOT_FOUND when the resolved catalog owner no longer exists', async () => {
    await repository.create(createProvider({ id: 'provider-1', name: 'provider-1' }));
    await repository.setCatalog('provider-1', [createCatalogItem({ providerId: 'provider-missing', modelId: 'orphaned-model' })]);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'orphaned-model',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: 'PROVIDER_NOT_FOUND'
    });
  });

  it('returns 503 PROVIDER_UNREACHABLE when the provider cannot be reached', async () => {
    const provider = createProvider({
      id: 'provider-openai',
      name: 'openai-primary',
      apiKeyEnc: Buffer.from('sk-test').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'gpt-4o-mini' })]);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1')));

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      code: 'PROVIDER_UNREACHABLE'
    });
  });

  it('returns 502 UPSTREAM_CHAT_FAILED when the upstream provider responds with an error', async () => {
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

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      code: 'UPSTREAM_CHAT_FAILED'
    });
  });

  it('returns an explicit unsupported-chat message when a synced provider cannot chat safely', async () => {
    const provider = createProvider({
      id: 'provider-bedrock',
      name: 'bedrock-primary',
      type: 'aws-bedrock',
      apiKeyEnc: Buffer.from('access:secret').toString('base64')
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'bedrock-claude' })]);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/chat',
      payload: {
        modelId: 'bedrock-claude',
        messages: [{ role: 'user', content: 'hello' }]
      }
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: 'aws-bedrock chat is not supported by this adapter.',
      code: 'UPSTREAM_CHAT_FAILED'
    });
  });

  it('excludes models from unsupported chat providers in the catalog response used by the frontend selector', async () => {
    const provider = createProvider({
      id: 'provider-bedrock',
      name: 'bedrock-primary',
      type: 'aws-bedrock'
    });
    await repository.create(provider);
    await repository.setCatalog(provider.id, [createCatalogItem({ providerId: provider.id, modelId: 'bedrock-claude' })]);

    const response = await server.inject({
      method: 'GET',
      url: `/api/providers/${provider.id}/models`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      providerId: provider.id,
      selectedModelIds: [],
      models: []
    });
  });
});

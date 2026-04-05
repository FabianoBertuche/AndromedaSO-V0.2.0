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
type ResetProviderRepositoryFactory = typeof import('../../infrastructure/repositories/provider.repository.factory.js').resetProviderRepositoryFactory;

let buildServer: BuildServer;
let resetProviderRepositoryFactory: ResetProviderRepositoryFactory;
let server: Awaited<ReturnType<BuildServer>>;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PROVIDER_REPOSITORY_MODE = 'memory';

  ({ buildServer } = await import('../../../../server.js'));
  ({ resetProviderRepositoryFactory } = await import('../../infrastructure/repositories/provider.repository.factory.js'));

  resetProviderRepositoryFactory();
  server = await buildServer(false);
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('provider console routes', () => {
  it('GET /api/providers/variants returns a manifest-driven catalog', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/providers/variants'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      group: 'providers',
      variants: expect.arrayContaining([
        expect.objectContaining({ variant: 'ollama' }),
        expect.objectContaining({ variant: 'openai-api' }),
        expect.objectContaining({ variant: 'openai-oauth' })
      ])
    });
  });

  it('POST /api/providers/connection-test returns a structured result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/connection-test',
      payload: {
        variant: 'ollama',
        config: {
          baseUrl: 'http://localhost:11434'
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      variant: 'ollama',
      ok: true,
      health: expect.objectContaining({
        status: 'ok'
      })
    });
  });

  it('POST /api/providers/connection-test returns 400 for invalid payloads', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/connection-test',
      payload: {
        variant: 'openai-api',
        config: {}
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'INVALID_VARIANT_CONFIG'
    });
  });

  it('POST /api/providers/connection-test returns 503 for offline or timed out upstream tests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')));

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/connection-test',
      payload: {
        variant: 'ollama',
        config: {
          baseUrl: 'http://localhost:11434'
        }
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE'
    });
  });
});

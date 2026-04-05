import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ProviderConnectionTestService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates openai-api with apiKey required and organization optional', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const { ProviderConnectionTestService } = await import('../providerConnectionTest.service.js');
    const service = new ProviderConnectionTestService();

    await expect(service.testConnection({
      variant: 'openai-api',
      config: {
        baseUrl: 'https://api.openai.com/v1',
        organization: 'org_123'
      }
    })).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_VARIANT_CONFIG'
    });

    const result = await service.testConnection({
      variant: 'openai-api',
      config: {
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        organization: 'org_123'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.validatedFields).toEqual(['apiKey', 'baseUrl', 'organization']);
  });

  it('rejects openai-oauth payloads that try to send a raw secret', async () => {
    const { ProviderConnectionTestService } = await import('../providerConnectionTest.service.js');
    const service = new ProviderConnectionTestService();

    await expect(service.testConnection({
      variant: 'openai-oauth',
      auth: {
        mode: 'oauth-manual',
        callbackUrl: 'http://localhost:5173/oauth/callback?code=test&state=state'
      },
      config: {
        apiKey: 'should-not-be-allowed'
      }
    })).rejects.toMatchObject({
      statusCode: 400,
      code: 'RAW_SECRET_NOT_ALLOWED'
    });
  });

  it('validates ollama with baseUrl required', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const { ProviderConnectionTestService } = await import('../providerConnectionTest.service.js');
    const service = new ProviderConnectionTestService();

    await expect(service.testConnection({
      variant: 'ollama',
      config: {}
    })).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_VARIANT_CONFIG'
    });

    const result = await service.testConnection({
      variant: 'ollama',
      config: {
        baseUrl: 'http://localhost:11434'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.validatedFields).toEqual(['baseUrl']);
  });

  it('does not persist a provider when a temporary connection test fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_api_key' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { ProviderConnectionTestService } = await import('../providerConnectionTest.service.js');
    const service = new ProviderConnectionTestService();

    await expect(service.testConnection({
      variant: 'openai-api',
      config: {
        apiKey: 'sk-invalid'
      }
    })).rejects.toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_AUTH_FAILED'
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

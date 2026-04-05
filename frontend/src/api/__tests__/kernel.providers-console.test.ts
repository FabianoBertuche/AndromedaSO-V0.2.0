import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOpenAiCodexOAuthSession, listProviderVariants, saveProviderConsoleConfiguration, testProviderConnection } from '../kernel';

describe('provider console API helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists provider variants from the dedicated backend endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      group: 'providers',
      variants: [{ variant: 'ollama', authMode: 'base-url', displayName: 'Ollama' }]
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    await expect(listProviderVariants()).resolves.toEqual({
      group: 'providers',
      variants: [{
        variant: 'ollama',
        group: 'providers',
        authMode: 'base-url',
        displayName: 'Ollama',
        description: undefined,
        capabilities: [],
        requiredFields: [],
        optionalFields: [],
        moduleId: undefined,
        status: undefined,
        saveAllowsDegradedHealth: undefined
      }]
    });
  });

  it('normalizes sparse variant metadata so the models page can still render', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      group: 'providers',
      variants: [{
        variant: 'ollama',
        authMode: 'base-url',
        displayName: 'Ollama'
      }]
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })));

    await expect(listProviderVariants()).resolves.toEqual({
      group: 'providers',
      variants: [{
        variant: 'ollama',
        group: 'providers',
        authMode: 'base-url',
        displayName: 'Ollama',
        description: undefined,
        capabilities: [],
        requiredFields: [],
        optionalFields: [],
        moduleId: undefined,
        status: undefined,
        saveAllowsDegradedHealth: undefined
      }]
    });
  });

  it('posts temporary payloads to the connection test endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      variant: 'openai-api',
      ok: true,
      health: { status: 'ok', message: 'Connection succeeded' },
      validatedFields: ['apiKey']
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(testProviderConnection({
      variant: 'openai-api',
      config: { apiKey: 'sk-test' }
    })).resolves.toMatchObject({
      ok: true,
      validatedFields: ['apiKey']
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/providers/connection-test', expect.objectContaining({
      method: 'POST'
    }));
  });

  it('posts public oauth session requests through the openai-oauth endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      authUrl: 'https://auth.openai.com/oauth/authorize',
      expiresAt: '2099-01-01T00:00:00.000Z',
      redirectUri: 'http://localhost:5173/oauth/callback',
      mode: 'manual'
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    await createOpenAiCodexOAuthSession({ origin: 'http://localhost:5173' });

    expect(fetchMock).toHaveBeenCalledWith('/api/providers/openai-oauth/oauth/sessions', expect.objectContaining({
      method: 'POST'
    }));
  });

  it('sends auth data in the public save payload contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'provider-1' }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    await saveProviderConsoleConfiguration({
      variant: 'openai-oauth',
      auth: {
        mode: 'oauth-manual',
        callbackUrl: 'http://localhost:5173/oauth/callback?code=test&state=state'
      }
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/providers', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        variant: 'openai-oauth',
        auth: {
          mode: 'oauth-manual',
          callbackUrl: 'http://localhost:5173/oauth/callback?code=test&state=state'
        }
      })
    }));
  });
});

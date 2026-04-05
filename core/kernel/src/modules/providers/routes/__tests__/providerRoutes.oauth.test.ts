import { createHash } from 'node:crypto';
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

let buildServer: BuildServer;
let getProviderRepository: GetProviderRepository;
let resetProviderRepositoryFactory: ResetProviderRepositoryFactory;
let server: Awaited<ReturnType<BuildServer>>;

function hashState(state: string): string {
  return createHash('sha256').update(state, 'utf-8').digest('hex');
}

function createJsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

async function createOpenAiOauthSession() {
  const response = await server.inject({
    method: 'POST',
    url: '/api/providers/openai-oauth/oauth/sessions',
    payload: { origin: 'http://localhost:5173' }
  });

  expect(response.statusCode).toBe(201);

  const body = response.json() as {
    authUrl: string;
    expiresAt: string;
    redirectUri: string;
    mode: 'manual';
  };
  const authUrl = new URL(body.authUrl);
  const state = authUrl.searchParams.get('state');

  expect(state).toBeTruthy();

  return {
    authUrl,
    state: state as string,
    expiresAt: body.expiresAt,
    redirectUri: body.redirectUri,
    mode: body.mode
  };
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PROVIDER_REPOSITORY_MODE = 'memory';
  process.env.OPENAI_CODEX_WEB_CLIENT_ID = 'test-openai-codex-client';

  ({ buildServer } = await import('../../../../server.js'));
  ({ getProviderRepository, resetProviderRepositoryFactory } = await import('../../infrastructure/repositories/provider.repository.factory.js'));

  resetProviderRepositoryFactory();
  server = await buildServer(false);
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  const repository = await getProviderRepository();
  await repository.reset();
});

describe('OpenAI OAuth routes', () => {
  it('creates a backend-owned session and returns manual-flow metadata', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/sessions',
      payload: { origin: 'http://localhost:5173' }
    });

    expect(response.statusCode).toBe(201);

    const body = response.json() as { authUrl: string; expiresAt: string; redirectUri: string; mode: 'manual' };
    const authUrl = new URL(body.authUrl);
    const state = authUrl.searchParams.get('state');
    const repository = await getProviderRepository();
    const storedSession = await repository.findOAuthSessionByStateHash(hashState(state as string));

    expect(authUrl.origin).toBe('https://auth.openai.com');
    expect(authUrl.pathname).toBe('/oauth/authorize');
    expect(authUrl.searchParams.get('client_id')).toBe('test-openai-codex-client');
    expect(authUrl.searchParams.get('redirect_uri')).toBe('http://localhost:5173/oauth/callback');
    expect(body.expiresAt).toBeTruthy();
    expect(body.redirectUri).toBe('http://localhost:5173/oauth/callback');
    expect(body.mode).toBe('manual');
    expect(storedSession).toMatchObject({
      providerType: 'openai-codex',
      redirectUri: 'http://localhost:5173/oauth/callback',
      origin: 'http://localhost:5173'
    });
    expect(storedSession?.codeVerifier).toBeTruthy();
  });

  it('fails before persisting a session when the Codex client ID is missing', async () => {
    const repository = await getProviderRepository();
    const createOAuthSessionSpy = vi.spyOn(repository, 'createOAuthSession');
    const originalClientId = process.env.OPENAI_CODEX_WEB_CLIENT_ID;

    process.env.OPENAI_CODEX_WEB_CLIENT_ID = '';

    try {
      const response = await server.inject({
        method: 'POST',
        url: '/api/providers/openai-oauth/oauth/sessions',
        payload: { origin: 'http://localhost:5173' }
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: 'OpenAI OAuth sign-in requires a valid web OAuth client ID. Set OPENAI_CODEX_WEB_CLIENT_ID in your backend .env. See docs/suporte/logincodex.md for setup instructions.'
      });
      expect(createOAuthSessionSpy).not.toHaveBeenCalled();
    } finally {
      process.env.OPENAI_CODEX_WEB_CLIENT_ID = originalClientId;
    }
  });

  it('completes sign-in with a pasted callbackUrl', async () => {
    const session = await createOpenAiOauthSession();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      id_token: 'aaa.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjaGF0Z3B0X2FjY291bnRfaWQiOiJhY2NvdW50LTEifQ.ccc'
    })));

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: `${session.redirectUri}?code=authorization-code&state=${session.state}`
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      provider: expect.objectContaining({
        type: 'openai-codex',
        name: 'openai-oauth:test@example.com'
      }),
      models: expect.any(Array)
    });
    expect(response.json().provider).not.toHaveProperty('apiKeyEnc');
  });

  it('completes sign-in with pasted code and state values', async () => {
    const session = await createOpenAiOauthSession();
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      id_token: 'aaa.eyJlbWFpbCI6InRlc3QtY29kZUBleGFtcGxlLmNvbSJ9.ccc'
    }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        code: 'authorization-code',
        state: session.state
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalled();
    expect(String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body)).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Foauth%2Fcallback');
    expect(response.json().provider).not.toHaveProperty('apiKeyEnc');
  });

  it('rejects replay before a second token exchange can start', async () => {
    const session = await createOpenAiOauthSession();
    let releaseFetchGate!: () => void;
    const fetchGate = new Promise<void>((resolve) => {
      releaseFetchGate = resolve;
    });

    const fetchMock = vi.fn().mockImplementation(async () => {
      await fetchGate;

      return createJsonResponse({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        id_token: 'aaa.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.ccc'
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const firstRequestPromise = server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        code: 'authorization-code',
        state: session.state
      }
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const secondResponse = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: `${session.redirectUri}?code=authorization-code&state=${session.state}`
      }
    });

    expect(secondResponse.statusCode).toBe(400);
    expect(secondResponse.json()).toEqual({
      error: 'This OpenAI OAuth sign-in link was already used. Please restart sign-in.'
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    releaseFetchGate();
    expect((await firstRequestPromise).statusCode).toBe(201);
  });

  it('rejects expired sessions', async () => {
    const repository = await getProviderRepository();

    await repository.createOAuthSession({
      id: 'expired-session',
      providerType: 'openai-codex',
      stateHash: hashState('expired-state'),
      codeVerifier: 'expired-verifier',
      redirectUri: 'http://localhost:5173/oauth/callback',
      origin: 'http://localhost:5173',
      expiresAt: '2020-01-01T00:00:00.000Z',
      createdAt: '2020-01-01T00:00:00.000Z'
    });

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: 'http://localhost:5173/oauth/callback?code=authorization-code&state=expired-state'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Your OpenAI OAuth sign-in session is invalid or has expired. Please restart sign-in.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed callback URLs', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: 'not-a-url'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth callback URL is invalid.'
    });
  });

  it('rejects callback URLs missing code', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: 'http://localhost:5173/oauth/callback?state=test-state'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth callback is missing the authorization code.'
    });
  });

  it('rejects callback URLs missing state', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: 'http://localhost:5173/oauth/callback?code=test-code'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth callback is missing the OAuth state.'
    });
  });

  it('rejects callbackUrl payloads that also try to override redirectUri', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: 'http://localhost:5173/oauth/callback?code=test-code&state=test-state',
        redirectUri: 'https://attacker.example/callback'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth redirect URI is managed by the server. Restart sign-in and paste only the callback URL or code/state values.'
    });
  });

  it('rejects code/state payloads that also try to override redirectUri', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        code: 'test-code',
        state: 'test-state',
        redirectUri: 'https://attacker.example/callback'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth redirect URI is managed by the server. Restart sign-in and paste only the callback URL or code/state values.'
    });
  });

  it('maps missing_codex_entitlement from callback error params', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        callbackUrl: 'http://localhost:5173/oauth/callback?error=access_denied&error_description=missing_codex_entitlement'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth access is not enabled for your workspace. Contact your workspace administrator.'
    });
  });

  it('maps missing_codex_entitlement from token endpoint responses', async () => {
    const session = await createOpenAiOauthSession();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({
      error: 'access_denied',
      error_description: 'missing_codex_entitlement'
    }, {
      status: 403
    })));

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        code: 'authorization-code',
        state: session.state
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: 'OpenAI OAuth access is not enabled for your workspace. Contact your workspace administrator.'
    });
  });

  it('keeps oauth token bundles out of browser responses', async () => {
    const session = await createOpenAiOauthSession();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      id_token: 'aaa.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.ccc'
    })));

    const completeResponse = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/complete',
      payload: {
        code: 'authorization-code',
        state: session.state
      }
    });

    expect(completeResponse.statusCode).toBe(201);
    expect(completeResponse.json().provider).not.toHaveProperty('apiKeyEnc');

    const listResponse = await server.inject({
      method: 'GET',
      url: '/api/providers'
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      providers: [
        expect.objectContaining({
          type: 'openai-codex',
          name: 'openai-oauth:test@example.com'
        })
      ]
    });
    expect(listResponse.json().providers[0]).not.toHaveProperty('apiKeyEnc');
  });

  it('refreshes using the stored backend refresh token only', async () => {
    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/providers',
      payload: {
        type: 'openai-codex',
        name: 'openai-oauth:test@example.com',
        apiKey: JSON.stringify({
          accessToken: 'old-access-token',
          refreshToken: 'stored-refresh-token',
          idToken: 'old-id-token'
        })
      }
    });

    expect(createResponse.statusCode).toBe(201);

    const createdProvider = createResponse.json() as { id: string };
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({
      access_token: 'new-access-token',
      refresh_token: 'rotated-refresh-token',
      expires_in: 3600
    }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await server.inject({
      method: 'POST',
      url: '/api/providers/openai-oauth/oauth/refresh',
      payload: { providerId: createdProvider.id }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      refreshed: true,
      expiresIn: 3600
    });

    const refreshBody = (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body;
    expect(String(refreshBody)).toContain('refresh_token=stored-refresh-token');

    const repository = await getProviderRepository();
    const storedProvider = await repository.findById(createdProvider.id);
    const storedTokens = JSON.parse(Buffer.from(storedProvider?.apiKeyEnc ?? '', 'base64').toString('utf-8')) as {
      accessToken: string;
      refreshToken: string;
    };

    expect(storedTokens.accessToken).toBe('new-access-token');
    expect(storedTokens.refreshToken).toBe('rotated-refresh-token');
  });
});

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { z } from 'zod';
import type { ProviderConfig, StructuredProviderHealth, TaskType } from '../domain/entities/provider.entity.js';
import type { OpenAiCodexOAuthSession } from '../domain/repositories/provider.repository.js';
import {
  isProviderConsoleSavePayload,
  mapConsoleSavePayloadToProviderConfig,
  mapProviderToConsoleMetadata
} from '../domain/services/providerVariantMapper.js';
import { getProviderRepository } from '../infrastructure/repositories/provider.repository.factory.js';
import { ProviderConnectionTestError, ProviderConnectionTestService } from '../services/providerConnectionTest.service.js';
import { ProviderChatDomainError, ProviderOrchestratorService } from '../services/providerOrchestratorService.js';
import { ProviderVariantCatalogService } from '../services/providerVariantCatalog.service.js';

type CreateOpenAiCodexOAuthSessionRequest = {
  origin: string;
};

type CreateOpenAiCodexOAuthSessionResponse = {
  authUrl: string;
  expiresAt: string;
  redirectUri: string;
  mode: 'manual';
};

type CompleteOpenAiCodexOAuthRequest =
  | {
    callbackUrl: string;
  }
  | {
    code: string;
    state: string;
  };

type ParsedOpenAiCodexCompletionInput = {
  code: string;
  state: string;
};

type OpenAiCodexTokenResponse = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
};

type OpenAiCodexRefreshRequest = {
  providerId: string;
};

type OpenAiCodexRefreshTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

type OpenAiCodexRefreshResponse = {
  refreshed: true;
  expiresIn?: number;
};

type BrowserSafeProvider<TProvider extends { apiKeyEnc?: string }> = Omit<TProvider, 'apiKeyEnc'>;

type OpenAiCodexErrorResponse = {
  error?: string;
  message?: string;
  error_description?: string;
};

class OpenAiCodexExchangeError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

const log = pino({ name: 'providers:openai-codex-oauth' });
const providerChatLog = pino({ name: 'providers:chat-route' });
const OPENAI_CODEX_CALLBACK_PATH = '/oauth/callback';
const OPENAI_CODEX_AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
const OPENAI_CODEX_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const OPENAI_CODEX_OAUTH_TTL_MS = 10 * 60 * 1000;
const OPENAI_CODEX_SCOPE = 'openid profile email offline_access api.connectors.read api.connectors.invoke';
const OPENAI_CODEX_CONFIG_REQUIRED_MESSAGE = 'OpenAI OAuth sign-in requires a valid web OAuth client ID. Set OPENAI_CODEX_WEB_CLIENT_ID in your backend .env. See docs/suporte/logincodex.md for setup instructions.';

function requireOpenAiCodexClientId(): string {
  const clientId = process.env.OPENAI_CODEX_WEB_CLIENT_ID?.trim() ?? '';

  if (!clientId) {
    throw new OpenAiCodexExchangeError(OPENAI_CODEX_CONFIG_REQUIRED_MESSAGE, 503);
  }

  return clientId;
}

function normalizeOrigin(origin: string): string {
  try {
    const normalizedOrigin = new URL(origin).origin;
    if (!normalizedOrigin) {
      throw new Error('missing origin');
    }

    return normalizedOrigin;
  } catch {
    throw new OpenAiCodexExchangeError('A valid origin is required to start OpenAI OAuth sign-in.', 400);
  }
}

function normalizeOpenAiCodexRedirectUri(redirectUri: string): string {
  let parsedRedirectUri: URL;

  try {
    parsedRedirectUri = new URL(redirectUri);
  } catch {
    throw new OpenAiCodexExchangeError('OpenAI OAuth callback must use a valid redirect URI.', 400);
  }

  if (parsedRedirectUri.pathname !== OPENAI_CODEX_CALLBACK_PATH) {
    throw new OpenAiCodexExchangeError(`OpenAI OAuth callback must use ${OPENAI_CODEX_CALLBACK_PATH}.`, 400);
  }

  parsedRedirectUri.hash = '';
  return parsedRedirectUri.toString();
}

function buildOpenAiCodexRedirectUri(origin: string): string {
  const normalizedOrigin = normalizeOrigin(origin);
  return normalizeOpenAiCodexRedirectUri(`${normalizedOrigin}${OPENAI_CODEX_CALLBACK_PATH}`);
}

function createBase64UrlRandomString(size: number): string {
  return randomBytes(size).toString('base64url');
}

function hashOpenAiCodexState(state: string): string {
  return createHash('sha256').update(state, 'utf-8').digest('hex');
}

function createPkceCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier, 'utf-8').digest('base64url');
}

function createOpenAiCodexAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const searchParams = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: OPENAI_CODEX_SCOPE,
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
    state: params.state,
    id_token_add_organizations: 'true',
    codex_cli_simplified_flow: 'true',
    originator: 'pi'
  });

  return `${OPENAI_CODEX_AUTHORIZE_URL}?${searchParams.toString()}`;
}

function base64urlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth sign-in returned an invalid identity token.', 502);
  }

  try {
    const payload = base64urlDecode(parts[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new OpenAiCodexExchangeError('OpenAI OAuth sign-in returned an unreadable identity token.', 502);
  }
}

function extractEmailFromIdToken(idToken: string): string {
  const payload = decodeJwtPayload(idToken);
  const email = payload.email;
  if (typeof email !== 'string' || !email.trim()) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth sign-in could not determine your account email.', 502);
  }

  return email.trim();
}

function extractAccountIdFromIdToken(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);
  const accountId = payload.chatgpt_account_id;
  return typeof accountId === 'string' && accountId.trim() ? accountId : null;
}

function parseCreateOpenAiCodexOAuthSessionRequest(body: unknown): CreateOpenAiCodexOAuthSessionRequest {
  if (!body || typeof body !== 'object') {
    throw new OpenAiCodexExchangeError('OpenAI OAuth sign-in requires an origin.', 400);
  }

  const { origin } = body as Partial<CreateOpenAiCodexOAuthSessionRequest>;
  if (typeof origin !== 'string' || !origin.trim()) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth sign-in requires an origin.', 400);
  }

  return {
    origin: origin.trim()
  };
}

function parseOpenAiCodexCallbackUrl(callbackUrl: string): ParsedOpenAiCodexCompletionInput {
  let parsedCallbackUrl: URL;

  try {
    parsedCallbackUrl = new URL(callbackUrl);
  } catch {
    throw new OpenAiCodexExchangeError('OpenAI OAuth callback URL is invalid.', 400);
  }

  const error = parsedCallbackUrl.searchParams.get('error')?.trim();
  const errorDescription = parsedCallbackUrl.searchParams.get('error_description')?.trim();
  if (error) {
    throw mapOpenAiCodexErrorResponse({
      error,
      error_description: errorDescription
    });
  }

  const code = parsedCallbackUrl.searchParams.get('code')?.trim();
  if (!code) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth callback is missing the authorization code.', 400);
  }

  const state = parsedCallbackUrl.searchParams.get('state')?.trim();
  if (!state) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth callback is missing the OAuth state.', 400);
  }

  return { code, state };
}

function parseCompleteOpenAiCodexOAuthRequest(body: unknown): ParsedOpenAiCodexCompletionInput {
  if (!body || typeof body !== 'object') {
    throw new OpenAiCodexExchangeError('OpenAI OAuth sign-in completion is missing the callback data.', 400);
  }

  const requestBody = body as {
    callbackUrl?: unknown;
    code?: unknown;
    state?: unknown;
    redirectUri?: unknown;
  };
  if (typeof requestBody.redirectUri === 'string' && requestBody.redirectUri.trim()) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth redirect URI is managed by the server. Restart sign-in and paste only the callback URL or code/state values.', 400);
  }

  if (typeof requestBody.callbackUrl === 'string' && requestBody.callbackUrl.trim()) {
    return parseOpenAiCodexCallbackUrl(requestBody.callbackUrl.trim());
  }

  const { code, state } = requestBody;

  if (typeof code !== 'string' || !code.trim()) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth callback is missing the authorization code.', 400);
  }

  if (typeof state !== 'string' || !state.trim()) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth callback is missing the OAuth state.', 400);
  }

  return {
    code: code.trim(),
    state: state.trim()
  };
}

function parseOpenAiCodexRefreshRequest(body: unknown): OpenAiCodexRefreshRequest {
  if (!body || typeof body !== 'object') {
    throw new OpenAiCodexExchangeError('providerId is required', 400);
  }

  const { providerId } = body as Partial<OpenAiCodexRefreshRequest>;
  if (typeof providerId !== 'string' || !providerId.trim()) {
    throw new OpenAiCodexExchangeError('providerId is required', 400);
  }

  return { providerId: providerId.trim() };
}

async function readOpenAiCodexErrorMessage(response: Response): Promise<OpenAiCodexErrorResponse> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return await response.json() as OpenAiCodexErrorResponse;
  }

  const text = await response.text();
  return { error_description: text.trim() || undefined };
}

function isMissingCodexEntitlement(errorResponse: OpenAiCodexErrorResponse): boolean {
  if (errorResponse.error && errorResponse.error !== 'access_denied') {
    return false;
  }

  const description = errorResponse.error_description ?? errorResponse.message ?? '';
  return description.includes('missing_codex_entitlement');
}

function mapOpenAiCodexErrorResponse(errorResponse: OpenAiCodexErrorResponse): OpenAiCodexExchangeError {
  if (isMissingCodexEntitlement(errorResponse)) {
    return new OpenAiCodexExchangeError('OpenAI OAuth access is not enabled for your workspace. Contact your workspace administrator.', 403);
  }

  const message = errorResponse.error_description ?? errorResponse.message ?? errorResponse.error;
  return new OpenAiCodexExchangeError(message ?? 'OpenAI OAuth sign-in failed. Please try again.', message ? 400 : 502);
}

async function exchangeOpenAiCodexAuthorizationCode(payload: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<OpenAiCodexTokenResponse> {
  let response: Response;

  try {
    response = await fetch(OPENAI_CODEX_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: payload.code,
        redirect_uri: payload.redirectUri,
        client_id: requireOpenAiCodexClientId(),
        code_verifier: payload.codeVerifier
      })
    });
  } catch {
    throw new OpenAiCodexExchangeError('OpenAI OAuth token exchange failed. Please try again.', 502);
  }

  if (!response.ok) {
    const errorResponse = await readOpenAiCodexErrorMessage(response);
    throw mapOpenAiCodexErrorResponse(errorResponse);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth token exchange failed. Please try again.', 502);
  }

  const tokenResponse = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
  };

  if (!tokenResponse.access_token || !tokenResponse.refresh_token || !tokenResponse.id_token) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth token exchange returned incomplete tokens.', 502);
  }

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    idToken: tokenResponse.id_token
  };
}

async function refreshOpenAiCodexToken(refreshToken: string): Promise<OpenAiCodexRefreshTokenResponse> {
  let response: Response;

  try {
    response = await fetch(OPENAI_CODEX_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: requireOpenAiCodexClientId()
      })
    });
  } catch {
    throw new OpenAiCodexExchangeError('OpenAI OAuth token refresh failed.', 502);
  }

  if (!response.ok) {
    const errorResponse = await readOpenAiCodexErrorMessage(response);
    const message = errorResponse.error_description ?? errorResponse.message ?? errorResponse.error;
    throw new OpenAiCodexExchangeError(message ?? 'OpenAI OAuth token refresh failed.', message ? 400 : 502);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth token refresh failed.', 502);
  }

  const tokenResponse = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!tokenResponse.access_token) {
    throw new OpenAiCodexExchangeError('OpenAI OAuth token refresh returned incomplete tokens.', 502);
  }

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresIn: tokenResponse.expires_in
  };
}

function parseStoredOpenAiCodexTokens(apiKeyEnc?: string): {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accountId?: string | null;
} {
  if (!apiKeyEnc) {
    return {};
  }

  try {
    const decoded = Buffer.from(apiKeyEnc, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as {
      accessToken?: unknown;
      refreshToken?: unknown;
      idToken?: unknown;
      accountId?: unknown;
    };

    return {
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : undefined,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      idToken: typeof parsed.idToken === 'string' ? parsed.idToken : undefined,
      accountId: typeof parsed.accountId === 'string' ? parsed.accountId : null
    };
  } catch {
    throw new OpenAiCodexExchangeError('Stored OpenAI OAuth credentials are invalid.', 500);
  }
}

function sanitizeProviderForBrowser<TProvider extends { apiKeyEnc?: string }>(provider: TProvider): BrowserSafeProvider<TProvider> {
  const { apiKeyEnc: _apiKeyEnc, ...safeProvider } = provider;
  return safeProvider;
}

function sanitizeProviderListForBrowser<TProvider extends { apiKeyEnc?: string }>(providers: TProvider[]): Array<BrowserSafeProvider<TProvider>> {
  return providers.map((provider) => sanitizeProviderForBrowser(provider));
}

async function requireClaimedOpenAiCodexOAuthSession(state: string): Promise<OpenAiCodexOAuthSession> {
  const repository = await getProviderRepository();
  const now = new Date().toISOString();
  const stateHash = hashOpenAiCodexState(state);
  await repository.deleteExpiredOAuthSessions(now);

  const claimedSession = await repository.claimOAuthSessionByStateHash(
    stateHash,
    'openai-codex',
    now,
    now
  );

  if (claimedSession) {
    return claimedSession;
  }

  const session = await repository.findOAuthSessionByStateHash(stateHash);
  if (!session) {
    throw new OpenAiCodexExchangeError('Your OpenAI OAuth sign-in session is invalid or has expired. Please restart sign-in.', 400);
  }

  if (session.providerType !== 'openai-codex') {
    throw new OpenAiCodexExchangeError('Invalid provider variant for OpenAI OAuth callback.', 400);
  }

  if (Date.parse(session.expiresAt) <= Date.parse(now)) {
    throw new OpenAiCodexExchangeError('Your OpenAI OAuth sign-in session has expired. Please restart sign-in.', 400);
  }

  if (session.consumedAt) {
    throw new OpenAiCodexExchangeError('This OpenAI OAuth sign-in link was already used. Please restart sign-in.', 400);
  }

  throw new OpenAiCodexExchangeError('Your OpenAI OAuth sign-in session is invalid or has expired. Please restart sign-in.', 400);
}

let orchestratorServicePromise: Promise<ProviderOrchestratorService> | null = null;

const providerChatRequestSchema = z.object({
  modelId: z.string().trim().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1)
  })).min(1)
});

const getProviderOrchestratorService = async (): Promise<ProviderOrchestratorService> => {
  if (!orchestratorServicePromise) {
    orchestratorServicePromise = getProviderRepository().then(
      (repository) => new ProviderOrchestratorService(repository)
    );
  }

  return orchestratorServicePromise;
};

function normalizeStructuredHealth(payload: {
  health: string;
  status?: StructuredProviderHealth['status'];
  message?: string;
  latencyMs?: number;
  checkedAt?: string;
  details?: Record<string, unknown>;
}): StructuredProviderHealth {
  return {
    status: payload.status ?? (payload.health === 'warning' ? 'degraded' : payload.health as StructuredProviderHealth['status']),
    message: payload.message ?? 'Health status updated.',
    latencyMs: payload.latencyMs,
    checkedAt: payload.checkedAt ?? new Date().toISOString(),
    details: payload.details
  };
}

export const providerRoutes: FastifyPluginAsync = async function providerRoutes(server) {
  const providerVariantCatalogService = new ProviderVariantCatalogService();
  const providerConnectionTestService = new ProviderConnectionTestService();
  const oauthSessionPaths = ['/openai-oauth/oauth/sessions', '/openai-codex/oauth/sessions'] as const;
  const oauthCompletionPaths = ['/openai-oauth/oauth/complete', '/openai-codex/oauth/complete'] as const;
  const oauthRefreshPaths = ['/openai-oauth/oauth/refresh', '/openai-codex/oauth/refresh'] as const;

  server.get('/health', async function handleHealth() {
    return { status: 'ok', module: 'providers' };
  });

  server.get('/variants', async function handleVariants(_request, reply) {
    try {
      return await providerVariantCatalogService.listSupportedVariants();
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message, code: 'VARIANT_CATALOG_FAILED' });
    }
  });

  server.post('/connection-test', async function handleConnectionTest(request, reply) {
    try {
      return await providerConnectionTestService.testConnection(request.body as never);
    } catch (error) {
      if (error instanceof ProviderConnectionTestError) {
        return reply.status(error.statusCode).send({
          error: error.message,
          code: error.code,
          health: error.health,
          details: error.details
        });
      }

      return reply.status(500).send({
        error: 'Connection test failed unexpectedly.',
        code: 'CONNECTION_TEST_FAILED'
      });
    }
  });

  const handleCreateOpenAiOAuthSession = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = parseCreateOpenAiCodexOAuthSessionRequest(request.body);
      const clientId = requireOpenAiCodexClientId();
      const origin = normalizeOrigin(payload.origin);
      const redirectUri = buildOpenAiCodexRedirectUri(origin);
      const state = createBase64UrlRandomString(32);
      const codeVerifier = createBase64UrlRandomString(48);
      const expiresAt = new Date(Date.now() + OPENAI_CODEX_OAUTH_TTL_MS).toISOString();
      const repository = await getProviderRepository();

      await repository.deleteExpiredOAuthSessions(new Date().toISOString());
      await repository.createOAuthSession({
        id: randomUUID(),
        providerType: 'openai-codex',
        stateHash: hashOpenAiCodexState(state),
        codeVerifier,
        redirectUri,
        origin,
        expiresAt,
        createdAt: new Date().toISOString()
      });

      log.info({ operation: 'oauth_session_created', providerType: 'openai-codex', origin, redirectUri, expiresAt }, 'OpenAI OAuth session created');

      const response: CreateOpenAiCodexOAuthSessionResponse = {
        authUrl: createOpenAiCodexAuthorizeUrl({
          clientId,
          redirectUri,
          state,
          codeChallenge: createPkceCodeChallenge(codeVerifier)
        }),
        expiresAt,
        redirectUri,
        mode: 'manual'
      };

      return reply.status(201).send(response);
    } catch (error) {
      if (error instanceof OpenAiCodexExchangeError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'OpenAI OAuth sign-in could not be started.' });
    }
  };

  oauthSessionPaths.forEach((path) => {
    server.post(path, handleCreateOpenAiOAuthSession);
  });

  server.post('/', async function handleCreate(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const consolePayload = isProviderConsoleSavePayload(request.body) ? request.body : null;
    if (consolePayload?.variant === 'openai-oauth') {
      return reply.status(400).send({
        error: 'openai-oauth must be completed through the manual OAuth completion route.',
        code: 'OAUTH_SAVE_REQUIRES_COMPLETION'
      });
    }

    const body = consolePayload
      ? mapConsoleSavePayloadToProviderConfig(consolePayload)
      : request.body as ProviderConfig;
    if (!body?.type) {
      return reply.status(400).send({ error: 'type is required' });
    }

    try {
      const provider = await providerOrchestratorService.createProvider(body);
      try {
        const health = await providerOrchestratorService.healthCheck(provider.id);
        return reply.status(201).send(sanitizeProviderForBrowser(mapProviderToConsoleMetadata({
          ...provider,
          health: health.health,
          healthDetails: normalizeStructuredHealth(health)
        })));
      } catch {
        return reply.status(201).send(sanitizeProviderForBrowser(mapProviderToConsoleMetadata({
          ...provider,
          health: 'error',
          healthDetails: normalizeStructuredHealth({
            health: 'unknown',
            status: 'unknown',
            message: 'Health unavailable right now.'
          })
        })));
      }
    } catch (error) {
      return reply.status(409).send({ error: (error as Error).message });
    }
  });

  const handleOpenAiOAuthComplete = async (request: FastifyRequest, reply: FastifyReply) => {
    const providerOrchestratorService = await getProviderOrchestratorService();

    try {
      const payload = parseCompleteOpenAiCodexOAuthRequest(request.body);
      const session = await requireClaimedOpenAiCodexOAuthSession(payload.state);
      const tokens = await exchangeOpenAiCodexAuthorizationCode({
        code: payload.code,
        codeVerifier: session.codeVerifier,
        redirectUri: session.redirectUri
      });
      const email = extractEmailFromIdToken(tokens.idToken);
      const accountId = extractAccountIdFromIdToken(tokens.idToken);
      const providerName = `openai-oauth:${email.toLowerCase()}`;
      const storedTokens = JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        accountId
      });

      const provider = await providerOrchestratorService.createProvider({
        type: 'openai-codex',
        name: providerName,
        apiKey: storedTokens
      });
      const models = await providerOrchestratorService.syncModels(provider.id);

      log.info({ operation: 'oauth_session_consumed', providerType: 'openai-codex', sessionId: session.id, providerId: provider.id }, 'OpenAI OAuth session consumed');

      return reply.status(201).send({ provider: sanitizeProviderForBrowser(mapProviderToConsoleMetadata(provider)), models });
    } catch (error) {
      if (error instanceof OpenAiCodexExchangeError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }

      if (error instanceof Error && error.message === 'Provider already exists') {
        return reply.status(409).send({ error: 'OpenAI OAuth is already connected for this account.' });
      }

      if (error instanceof Error) {
        return reply.status(500).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'OpenAI OAuth sign-in completion failed.' });
    }
  };

  oauthCompletionPaths.forEach((path) => {
    server.post(path, handleOpenAiOAuthComplete);
  });

  const handleOpenAiOAuthRefresh = async (request: FastifyRequest, reply: FastifyReply) => {
    const providerOrchestratorService = await getProviderOrchestratorService();

    try {
      const refreshPayload = parseOpenAiCodexRefreshRequest(request.body);
      const provider = await providerOrchestratorService.resolveProviderById(refreshPayload.providerId);

      if (provider.type !== 'openai-codex') {
        throw new OpenAiCodexExchangeError('OpenAI OAuth refresh is only available for the openai-oauth provider variant.', 400);
      }

      const existingTokens = parseStoredOpenAiCodexTokens(provider.apiKeyEnc);
      if (!existingTokens.refreshToken) {
        throw new OpenAiCodexExchangeError('Stored OpenAI OAuth refresh token is missing.', 400);
      }

      const refreshed = await refreshOpenAiCodexToken(existingTokens.refreshToken);
      const updatedTokens = JSON.stringify({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? existingTokens.refreshToken,
        idToken: existingTokens.idToken ?? '',
        accountId: existingTokens.accountId ?? null
      });

      await providerOrchestratorService.updateProviderApiKey(refreshPayload.providerId, updatedTokens);

      return reply.status(200).send({
        refreshed: true,
        expiresIn: refreshed.expiresIn
      });
    } catch (error) {
      if (error instanceof OpenAiCodexExchangeError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }

      if (error instanceof Error) {
        return reply.status(500).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'OpenAI OAuth token refresh failed.' });
    }
  };

  oauthRefreshPaths.forEach((path) => {
    server.post(path, handleOpenAiOAuthRefresh);
  });

  server.get('/', async function handleList() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    return { providers: sanitizeProviderListForBrowser(await providerOrchestratorService.listProviders()) };
  });

  server.post('/:id/sync', async function handleSync(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      const models = await providerOrchestratorService.syncModels(id);
      return { providerId: id, models };
    } catch (error) {
      const message = (error as Error).message;
      const statusCode = message === 'Provider not found' ? 404 : 502;
      return reply.status(statusCode).send({
        error: message,
        code: statusCode === 404 ? 'PROVIDER_NOT_FOUND' : 'PROVIDER_SYNC_FAILED'
      });
    }
  });

  server.get('/:id/models', async function handleCatalog(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      return await providerOrchestratorService.getCatalog(id);
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.post('/:id/models/select', async function handleSelect(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    const body = request.body as { modelIds?: string[] };

    try {
      const provider = await providerOrchestratorService.saveSelectedModels(id, body.modelIds ?? []);
      return { providerId: provider.id, selectedModelIds: provider.selectedModelIds };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.post('/chat', async function handleChat(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const parsedBody = providerChatRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: 'Invalid chat payload.',
        code: 'INVALID_CHAT_PAYLOAD'
      });
    }

    try {
      return await providerOrchestratorService.chatByModel(parsedBody.data);
    } catch (error) {
      if (error instanceof ProviderChatDomainError) {
        providerChatLog.warn({
          operation: 'provider_chat',
          code: error.code,
          statusCode: error.statusCode,
          modelId: parsedBody.data.modelId,
          errorMessage: error.message
        }, 'provider chat request failed');

        return reply.status(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }

      providerChatLog.error({
        operation: 'provider_chat',
        modelId: parsedBody.data.modelId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }, 'provider chat request failed unexpectedly');

      return reply.status(502).send({
        error: 'Provider chat request failed upstream.',
        code: 'UPSTREAM_CHAT_FAILED'
      });
    }
  });

  server.get('/:id/health', async function handleHealthById(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      const health = await providerOrchestratorService.healthCheck(id);
      return {
        ...health,
        healthDetails: normalizeStructuredHealth(health)
      };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.delete('/:id', async function handleDelete(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      await providerOrchestratorService.deleteProvider(id);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/:id/health/stream', async function handleHealthStream(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const emit = async () => {
      try {
        const payload = await providerOrchestratorService.healthCheck(id);
        reply.raw.write('event: health\n');
        reply.raw.write(`data: ${JSON.stringify({ ...payload, healthDetails: normalizeStructuredHealth(payload) })}\n\n`);
      } catch (error) {
        const message = (error as Error).message;
        reply.raw.write('event: error\n');
        reply.raw.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      }
    };

    const timer = setInterval(() => {
      void emit();
    }, 3000);

    await emit();

    request.raw.on('close', function onClose() {
      clearInterval(timer);
      reply.raw.end();
    });
  });
};

export const llmRouterRoutes: FastifyPluginAsync = async function llmRouterRoutes(server) {
  server.get('/health', async function handleHealth() {
    return { status: 'ok', module: 'llm-router' };
  });

  server.post('/infer', async function handleInfer(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const body = request.body as { taskType?: TaskType };
    if (!body?.taskType) {
      return reply.status(400).send({ error: 'taskType is required' });
    }

    try {
      return await providerOrchestratorService.inferRoute(body.taskType);
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }
  });

  server.post('/benchmark', async function handleBenchmark(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const body = request.body as { modelId?: string; taskType?: TaskType };
    if (!body?.modelId || !body?.taskType) {
      return reply.status(400).send({ error: 'modelId and taskType are required' });
    }

    try {
      const result = await providerOrchestratorService.benchmarkModel(body.modelId, body.taskType);
      return { result };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/benchmarks', async function handleBenchmarks() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    return { results: await providerOrchestratorService.listBenchmarks() };
  });

  server.get('/rankings', async function handleRankings() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const decision = await providerOrchestratorService.inferRoute('coding');
    return { ranked: decision.ranked };
  });

  server.get('/decisions', async function handleDecisions() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    return { decisions: await providerOrchestratorService.getRoutingHistory() };
  });
};

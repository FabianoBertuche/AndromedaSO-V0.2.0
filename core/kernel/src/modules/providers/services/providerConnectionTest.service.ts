import { z } from 'zod';
import type { StructuredProviderHealth } from '../domain/entities/provider.entity.js';
import { fetchWithTimeout } from '../infrastructure/adapters/http.utils.js';
import { isConsoleVariant } from '../domain/services/providerVariantMapper.js';

const openAiConfigSchema = z.object({
  apiKey: z.string().trim().min(1, 'apiKey is required'),
  baseUrl: z.string().trim().url('baseUrl must be a valid URL').optional(),
  organization: z.string().trim().min(1).optional()
});

const ollamaConfigSchema = z.object({
  baseUrl: z.string().trim().url('baseUrl must be a valid URL')
});

const oauthManualSchema = z.object({
  mode: z.literal('oauth-manual'),
  callbackUrl: z.string().trim().url().optional(),
  code: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional()
}).superRefine((value, ctx) => {
  if (value.callbackUrl) {
    return;
  }

  if (!value.code || !value.state) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'callbackUrl or code/state is required for oauth-manual'
    });
  }
});

export type ProviderConnectionTestRequest = {
  variant: 'ollama' | 'openai-api' | 'openai-oauth';
  config?: Record<string, unknown>;
  auth?: Record<string, unknown>;
};

export type ProviderConnectionTestResponse = {
  variant: ProviderConnectionTestRequest['variant'];
  ok: boolean;
  health: StructuredProviderHealth;
  validatedFields: string[];
};

export class ProviderConnectionTestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly health: StructuredProviderHealth,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

function nowIsoString(): string {
  return new Date().toISOString();
}

function createHealth(status: StructuredProviderHealth['status'], message: string, details?: Record<string, unknown>, latencyMs?: number): StructuredProviderHealth {
  return {
    status,
    message,
    latencyMs,
    checkedAt: nowIsoString(),
    details
  };
}

function unwrapZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid variant config';
}

function ensureNoRawSecret(payload: ProviderConnectionTestRequest): void {
  const config = payload.config ?? {};
  const auth = payload.auth ?? {};

  if ('apiKey' in config || 'secret' in config || 'apiKey' in auth || 'secret' in auth) {
    throw new ProviderConnectionTestError(
      'openai-oauth does not accept a raw secret. Use the manual OAuth flow fields only.',
      400,
      'RAW_SECRET_NOT_ALLOWED',
      createHealth('error', 'Raw secret payloads are not allowed for openai-oauth.')
    );
  }
}

function buildOpenAiModelsUrl(baseUrl?: string): string {
  const target = new URL(baseUrl ?? 'https://api.openai.com/v1/');
  target.pathname = target.pathname.endsWith('/') ? target.pathname : `${target.pathname}/`;
  return new URL('models', target).toString();
}

function buildOllamaTagsUrl(baseUrl: string): string {
  return new URL('/api/tags', baseUrl).toString();
}

function mapFetchFailure(error: unknown, variant: ProviderConnectionTestRequest['variant']): ProviderConnectionTestError {
  const message = error instanceof Error ? error.message : 'Connection test failed.';
  const code = message.toLowerCase().includes('abort') ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE';

  return new ProviderConnectionTestError(
    code === 'UPSTREAM_TIMEOUT'
      ? `Connection test for ${variant} timed out.`
      : `Connection test for ${variant} could not reach the upstream provider.`,
    503,
    code,
    createHealth(code === 'UPSTREAM_TIMEOUT' ? 'degraded' : 'error', code === 'UPSTREAM_TIMEOUT' ? 'Connection timed out.' : 'Provider is offline or unreachable.', {
      cause: message
    })
  );
}

async function performHttpConnectionTest(params: {
  variant: ProviderConnectionTestRequest['variant'];
  url: string;
  headers?: Record<string, string>;
  successMessage: string;
  unavailableMessage: string;
}): Promise<ProviderConnectionTestResponse> {
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetchWithTimeout(params.url, { headers: params.headers }, 5000);
  } catch (error) {
    throw mapFetchFailure(error, params.variant);
  }

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ProviderConnectionTestError(
        'The supplied credentials were rejected by the upstream provider.',
        502,
        'UPSTREAM_AUTH_FAILED',
        createHealth('error', 'Invalid or unauthorized credentials.', {
          statusCode: response.status
        }, latencyMs)
      );
    }

    throw new ProviderConnectionTestError(
      params.unavailableMessage,
      response.status >= 500 ? 503 : 502,
      'UPSTREAM_UNAVAILABLE',
      createHealth('error', params.unavailableMessage, {
        statusCode: response.status
      }, latencyMs)
    );
  }

  return {
    variant: params.variant,
    ok: true,
    health: createHealth('ok', params.successMessage, undefined, latencyMs),
    validatedFields: []
  };
}

export class ProviderConnectionTestService {
  async testConnection(payload: ProviderConnectionTestRequest): Promise<ProviderConnectionTestResponse> {
    if (!isConsoleVariant(payload.variant)) {
      throw new ProviderConnectionTestError(
        'variant must be one of ollama, openai-api, openai-oauth',
        400,
        'INVALID_VARIANT_CONFIG',
        createHealth('error', 'Unknown provider variant.')
      );
    }

    if (payload.variant === 'openai-api') {
      let config: z.infer<typeof openAiConfigSchema>;
      try {
        config = openAiConfigSchema.parse(payload.config ?? {});
      } catch (error) {
        throw new ProviderConnectionTestError(
          unwrapZodError(error as z.ZodError),
          400,
          'INVALID_VARIANT_CONFIG',
          createHealth('error', 'openai-api requires apiKey and a valid optional baseUrl.')
        );
      }

      const result = await performHttpConnectionTest({
        variant: 'openai-api',
        url: buildOpenAiModelsUrl(config.baseUrl),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          ...(config.organization ? { 'OpenAI-Organization': config.organization } : {})
        },
        successMessage: 'OpenAI API connection succeeded.',
        unavailableMessage: 'OpenAI API is unavailable for the supplied configuration.'
      });

      return {
        ...result,
        validatedFields: [
          'apiKey',
          ...(config.baseUrl ? ['baseUrl'] : []),
          ...(config.organization ? ['organization'] : [])
        ]
      };
    }

    if (payload.variant === 'ollama') {
      let config: z.infer<typeof ollamaConfigSchema>;
      try {
        config = ollamaConfigSchema.parse(payload.config ?? {});
      } catch (error) {
        throw new ProviderConnectionTestError(
          unwrapZodError(error as z.ZodError),
          400,
          'INVALID_VARIANT_CONFIG',
          createHealth('error', 'ollama requires a valid baseUrl.')
        );
      }

      const result = await performHttpConnectionTest({
        variant: 'ollama',
        url: buildOllamaTagsUrl(config.baseUrl),
        successMessage: 'Ollama connection succeeded.',
        unavailableMessage: 'Ollama is unavailable for the supplied baseUrl.'
      });

      return {
        ...result,
        validatedFields: ['baseUrl']
      };
    }

    ensureNoRawSecret(payload);

    let auth: z.infer<typeof oauthManualSchema>;
    try {
      auth = oauthManualSchema.parse({
        ...(payload.auth ?? {}),
        mode: 'oauth-manual'
      });
    } catch (error) {
      throw new ProviderConnectionTestError(
        unwrapZodError(error as z.ZodError),
        400,
        'INVALID_VARIANT_CONFIG',
        createHealth('error', 'openai-oauth requires callbackUrl or code/state completion inputs.')
      );
    }

    if (auth.callbackUrl) {
      const callbackUrl = new URL(auth.callbackUrl);
      const oauthError = callbackUrl.searchParams.get('error');
      const oauthDescription = callbackUrl.searchParams.get('error_description');

      if (oauthError) {
        throw new ProviderConnectionTestError(
          oauthDescription ?? oauthError,
          400,
          'OAUTH_ERROR',
          createHealth('error', oauthDescription ?? oauthError, {
            oauthError
          })
        );
      }
    }

    return {
      variant: 'openai-oauth',
      ok: true,
      health: createHealth('degraded', 'Manual OAuth input is valid. Complete save to finish the connection.'),
      validatedFields: auth.callbackUrl ? ['callbackUrl'] : ['code', 'state']
    };
  }
}

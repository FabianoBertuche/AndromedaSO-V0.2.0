# Design: OpenAI Codex Hardcoded Client ID

## Architecture Overview

Replace environment-variable-based OAuth configuration with a hardcoded official OpenAI client ID (`app_EMoamEEZ7brann`), matching the reference implementation from openclaw/openclaw.

## Changes by File

### 1. `core/kernel/src/modules/providers/routes/providerRoutes.ts`

#### Remove:
- `OpenAiCodexWebClientConfig` type
- `parseConfiguredOrigins()` function
- `getOpenAiCodexWebClientConfig()` function
- `OPENAI_CODEX_CONFIG_REQUIRED_MESSAGE` constant
- Origin validation logic in `buildOpenAiCodexOAuthConfigResponse()`
- Origin validation logic in `parseOpenAiCodexExchangeRequest()`

#### Add:
```typescript
const OPENAI_CODEX_CLIENT_ID = 'app_EMoamEEZ7brann';
```

#### Modify:

**`buildOpenAiCodexOAuthConfigResponse()`** — Simplify to always return ready:
```typescript
function buildOpenAiCodexOAuthConfigResponse(requestedOrigin: string): OpenAiCodexOAuthConfigResponse {
  const normalizedOrigin = normalizeOrigin(requestedOrigin.trim());
  if (!normalizedOrigin) {
    return {
      ready: false,
      message: 'Origin is required for OpenAI Codex OAuth configuration.',
      clientId: null,
      redirectUri: null
    };
  }
  return {
    ready: true,
    message: null,
    clientId: OPENAI_CODEX_CLIENT_ID,
    redirectUri: `${normalizedOrigin}${OPENAI_CODEX_CALLBACK_PATH}`
  };
}
```

**`parseOpenAiCodexExchangeRequest()`** — Remove origin validation block (lines 169-175):
```typescript
// Remove these lines:
// const config = getOpenAiCodexWebClientConfig();
// if (!config.allowedOrigins.includes(parsedRedirectUri.origin)) {
//   throw new OpenAiCodexExchangeError(
//     `OpenAI Codex web OAuth is not configured for ${parsedRedirectUri.origin}${OPENAI_CODEX_CALLBACK_PATH}.`,
//     400
//   );
// }
```

**`exchangeOpenAiCodexAuthorizationCode()`** — Use hardcoded client ID:
```typescript
async function exchangeOpenAiCodexAuthorizationCode(payload: OpenAiCodexExchangeRequest): Promise<string> {
  let response: Response;
  try {
    response = await fetch('https://auth0.openai.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: payload.code,
        redirect_uri: payload.redirectUri,
        client_id: OPENAI_CODEX_CLIENT_ID,
        code_verifier: payload.codeVerifier
      })
    });
  } catch {
    throw new OpenAiCodexExchangeError('OpenAI Codex token exchange failed.', 502);
  }
  // ... rest unchanged
}
```

### 2. `frontend/src/pages/ModelProviders.tsx`

#### Remove:
- Import of `fetchOpenAiCodexOAuthConfig`
- `openAiCodexOAuthConfigQuery` (useQuery)
- `openAiCodexOAuthConfig` variable
- `openAiCodexOAuthMessage` variable
- `canStartOpenAiCodexFlow` check
- Loading state JSX for "Checking OpenAI Codex web OAuth configuration..."
- Error message JSX when config is unavailable
- `disabled={!canStartOpenAiCodexFlow}` from the sign-in button

#### Add:
```typescript
const OPENAI_CODEX_CLIENT_ID = 'app_EMoamEEZ7brann';
```

#### Modify `startOpenAiCodexFlow()`:
```typescript
const startOpenAiCodexFlow = async () => {
  setSyncError(null);

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateOAuthState();
  const redirectUri = `${window.location.origin}${OPENAI_CODEX_CALLBACK_PATH}`;

  sessionStorage.setItem(OAUTH_CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(OAUTH_PROVIDER_TYPE_KEY, 'openai-codex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OPENAI_CODEX_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: OPENAI_CODEX_SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    id_token_add_organizations: 'true',
    codex_cli_simplified_flow: 'true',
    originator: 'pi'
  });

  window.location.assign(`${OPENAI_CODEX_AUTHORIZE_URL}?${params.toString()}`);
};
```

#### Add constant:
```typescript
const OPENAI_CODEX_CALLBACK_PATH = '/oauth/callback';
```

### 3. `frontend/src/api/kernel.ts`

- Keep `fetchOpenAiCodexOAuthConfig()` function but mark as deprecated (or remove if no longer referenced)
- Keep `completeOpenAiCodexOAuth()` — still used by OAuth callback
- Keep `OpenAiCodexOAuthConfigResponse` type — still matches backend response shape

### 4. `.env.example` files

**`core/kernel/.env.example`:**
- Remove the block about `OPENAI_CODEX_WEB_CLIENT_ID` and `OPENAI_CODEX_ALLOWED_ORIGINS`
- Add comment: `# OpenAI Codex uses a hardcoded official client ID (app_EMoamEEZ7brann). No env vars needed.`

**`frontend/.env.example`:**
- Remove all content about `VITE_OPENAI_CODEX_WEB_CLIENT_ID` and `VITE_OPENAI_CODEX_ALLOWED_ORIGINS`
- Add comment: `# OpenAI Codex uses a hardcoded official client ID. No env vars needed.`

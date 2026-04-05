# Design: OpenAI Codex OAuth Flow Correction

## Architecture Overview

Fix five critical discrepancies between the current implementation and the official OpenAI Codex OAuth documentation. Changes are localized to three files: backend routes, frontend page, and frontend API types.

## Changes by File

### 1. `core/kernel/src/modules/providers/routes/providerRoutes.ts`

#### Change 1.1: Fix token endpoint
- Line 121: Change `https://auth0.openai.com/oauth/token` → `https://auth.openai.com/oauth/token`

#### Change 1.2: Capture full token response
- Modify `exchangeOpenAiCodexAuthorizationCode()` return type from `Promise<string>` to `Promise<OpenAiCodexTokenResponse>`
- New type:
```typescript
type OpenAiCodexTokenResponse = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
};
```
- Parse all three tokens from the response: `access_token`, `refresh_token`, `id_token`

#### Change 1.3: Decode JWT id_token to extract email
- Add helper function `decodeJwtPayload(token: string)` that base64url-decodes the JWT payload
- Add helper function `extractEmailFromIdToken(idToken: string): string` that extracts `email` claim
- Add helper function `extractAccountIdFromIdToken(idToken: string): string | null` that extracts `chatgpt_account_id` claim

#### Change 1.4: Handle `missing_codex_entitlement` error
- In `exchangeOpenAiCodexAuthorizationCode()`, after reading error response, check if error is `access_denied` AND description contains `missing_codex_entitlement`
- If so, throw `OpenAiCodexExchangeError` with message: "Codex is not enabled for your workspace. Contact your workspace administrator." with status 403

#### Change 1.5: Create provider with email-based name
- In the exchange handler, after getting tokens, decode id_token to get email
- Create provider with `name: openai-codex:${email}` instead of `name: 'openai-codex'`
- Store tokens as JSON string in apiKey field: `JSON.stringify({ accessToken, refreshToken, idToken })`

#### Change 1.6: Add refresh token endpoint
- Add `POST /oauth/openai-codex/refresh` route
- Request body: `{ providerId: string, refreshToken: string }`
- Calls `https://auth.openai.com/oauth/token` with `grant_type=refresh_token`
- Returns `{ accessToken, refreshToken?, expiresIn }`
- Updates the provider's stored tokens with new values

### 2. `frontend/src/pages/ModelProviders.tsx`

#### Change 2.1: Fix OAuth scopes
- Line 26: Change `OPENAI_CODEX_SCOPE` from `'openid profile email offline_access'` to `'openid profile email offline_access api.connectors.read api.connectors.invoke'`

### 3. `frontend/src/api/kernel.ts`

#### Change 3.1: Update response types
- Update `CompleteOpenAiCodexOAuthResponse` to include `refreshToken` and `idToken` fields (optional for backward compatibility)
- Add `RefreshOpenAiCodexTokenRequest` type
- Add `RefreshOpenAiCodexTokenResponse` type
- Add `refreshOpenAiCodexToken()` function

### 4. `frontend/src/pages/OAuthCallbackHandler.tsx`

#### Change 4.1: Handle missing_codex_entitlement error
- The error message from backend will already be user-friendly after backend changes
- No specific change needed — the existing error display will show the friendly message

## Data Flow

```
Frontend → POST /oauth/openai-codex/exchange { code, codeVerifier, redirectUri }
Backend → POST https://auth.openai.com/oauth/token
OpenAI → { id_token, access_token, refresh_token }
Backend → decode id_token → extract email
Backend → createProvider({ name: `openai-codex:${email}`, apiKey: JSON.stringify(tokens) })
Backend → return { provider, models }
```

## Token Storage Format

The `apiKey` field will store a JSON string:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "idToken": "eyJ..."
}
```

This maintains backward compatibility — the field type remains `string`, and existing code that reads `apiKey` for the access token can parse it as JSON.

## Refresh Flow

```
Frontend → POST /oauth/openai-codex/refresh { providerId, refreshToken }
Backend → POST https://auth.openai.com/oauth/token { grant_type: 'refresh_token', refresh_token, client_id }
OpenAI → { access_token, refresh_token? }
Backend → update provider apiKey with new tokens
Backend → return { accessToken, refreshToken?, expiresIn }
```

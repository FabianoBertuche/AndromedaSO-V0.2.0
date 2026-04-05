# Requirements: OpenAI Codex OAuth Flow Correction

## Problem

The current OpenAI Codex OAuth implementation has critical discrepancies from the official documentation in `docs/suporte/logincodex.md`:

1. **Wrong token endpoint**: Uses `auth0.openai.com` instead of `auth.openai.com`
2. **Incomplete OAuth scopes**: Missing `api.connectors.read` and `api.connectors.invoke`
3. **No refresh token handling**: Tokens are exchanged but refresh tokens are discarded
4. **No `missing_codex_entitlement` error handling**: Users get raw error messages
5. **No JWT claims validation**: `id_token` is not decoded to extract user identity

## Acceptance Criteria

### AC1: Correct Token Endpoint
- Backend token exchange MUST use `https://auth.openai.com/oauth/token`
- Frontend authorize URL already uses `https://auth.openai.com/oauth/authorize` (correct)

### AC2: Complete OAuth Scopes
- Frontend MUST request: `openid profile email offline_access api.connectors.read api.connectors.invoke`

### AC3: Refresh Token Storage
- Backend MUST capture `refresh_token` from token exchange response
- Backend MUST store `refresh_token` alongside `access_token` (in the `apiKey` field as JSON)
- Backend MUST expose `POST /api/providers/oauth/openai-codex/refresh` endpoint for token refresh
- Refresh endpoint accepts `{ providerId, refreshToken }` and returns `{ accessToken, refreshToken?, expiresIn }`

### AC4: Missing Codex Entitlement Error
- When OpenAI returns `access_denied` with description containing `missing_codex_entitlement`
- Backend MUST return user-friendly message: "Codex is not enabled for your workspace. Contact your workspace administrator."
- Frontend MUST display this message clearly to the user

### AC5: JWT Claims Extraction
- Backend MUST decode the `id_token` from token exchange response
- Backend MUST extract `email` and `chatgpt_account_id` claims
- Backend MUST create provider with name `openai-codex:<email>` instead of just `openai-codex`
- Backend MUST store `id_token` alongside other tokens

### AC6: No Breaking Changes
- Existing provider creation flow MUST continue to work
- Existing API contracts MUST not change (only additions)
- Existing tests MUST continue to pass

# Design: OpenAI Codex Backend Hardening

## Overview

This change hardens the existing `openai-codex` browser sign-in flow without changing the product split already established in the repo:

- `openai` stays API-key only.
- `openai-codex` stays the separate sign-in variant.

The implementation stays inside the current providers module and frontend API/hook pattern. No new libraries are needed; use existing Fastify, React Query, `pg`, and Node `crypto`.

## Current Repo Touchpoints

### Backend
- `core/kernel/src/modules/providers/routes/providerRoutes.ts`
- `core/kernel/src/modules/providers/services/providerOrchestratorService.ts`
- `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`
- `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts`
- `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts`

### Frontend
- `frontend/src/api/kernel.ts`
- `frontend/src/hooks/useProviders.ts`
- `frontend/src/pages/ModelProviders.tsx`
- `frontend/src/pages/OAuthCallbackHandler.tsx`

## Design Decisions

### 1. Keep the SPA callback route, but move PKCE/session ownership to the backend

This repo already routes the browser back to `frontend` at `/oauth/callback`. The hardening change keeps that browser callback path, but removes browser ownership of PKCE and refresh-token state.

Resulting split:

1. Frontend asks backend to create an `openai-codex` OAuth session.
2. Backend generates `state`, PKCE verifier/challenge, `redirectUri`, TTL, and `authUrl`, then persists the session.
3. Browser goes to OpenAI.
4. OpenAI redirects back to the existing SPA route `/oauth/callback?code=...&state=...`.
5. `OAuthCallbackHandler.tsx` calls a frontend API helper that POSTs only `code`, `state`, and `redirectUri` to the backend.
6. Backend validates the stored session, exchanges the code, creates/syncs the provider, consumes the session, and returns success.

This preserves the current app routing while moving the actual trust boundary to the server.

### 2. Reuse the existing provider repository mode split

The providers module already supports memory and PostgreSQL repositories through `provider.repository.factory.ts`. The OAuth-session persistence must follow the same split instead of adding a new storage system.

Add OAuth-session methods to the existing repository abstraction so both modes behave consistently.

## Backend Design

### 3. OAuth session entity and repository methods

Add a small server-only session model used only by `openai-codex`:

```ts
type OpenAiCodexOAuthSession = {
  id: string;
  providerType: 'openai-codex';
  stateHash: string;
  codeVerifier: string;
  redirectUri: string;
  origin: string;
  expiresAt: string;
  consumedAt?: string;
  createdAt: string;
};
```

Add repository operations to `provider.repository.ts`:

- `createOAuthSession(session)`
- `findOAuthSessionByStateHash(stateHash)`
- `consumeOAuthSession(sessionId, consumedAt)`
- `deleteExpiredOAuthSessions(now)`

#### In-memory repository
- Store sessions in a dedicated `Map<string, OpenAiCodexOAuthSession>` keyed by session id.
- Maintain a secondary lookup by `stateHash`.

#### PostgreSQL repository
- Extend `initialize()` in `provider.repository.postgres.ts` with a new table such as `provider_oauth_session`.
- Required columns:
  - `id`
  - `provider_type`
  - `state_hash`
  - `code_verifier`
  - `redirect_uri`
  - `origin`
  - `expires_at`
  - `consumed_at`
  - `created_at`
- Add a unique index on `state_hash`.

This remains implementation-specific to the current repository code and avoids introducing a separate secrets/vault framework.

### 4. Server-side session generation in `providerRoutes.ts`

Replace the current config-fetch-first browser flow with a backend start endpoint:

```text
POST /api/providers/openai-codex/oauth/sessions
```

Request body:

```ts
type CreateOpenAiCodexOAuthSessionRequest = {
  origin: string;
};
```

Response body:

```ts
type CreateOpenAiCodexOAuthSessionResponse = {
  authUrl: string;
  expiresAt: string;
};
```

#### Start endpoint behavior
- Validate `origin` with the same URL normalization approach already used in `providerRoutes.ts`.
- Build `redirectUri` as `${origin}/oauth/callback`.
- Reject any origin that cannot produce that callback path cleanly.
- Generate:
  - random `state`
  - random PKCE `codeVerifier`
  - S256 `codeChallenge`
- Hash `state` with Node `crypto.createHash('sha256')` before persistence.
- Persist the session with short TTL and `consumedAt = null`.
- Return the OpenAI authorize URL using the existing Codex parameters:
  - `response_type=code`
  - `client_id`
  - `redirect_uri`
  - `scope=openid profile email offline_access api.connectors.read api.connectors.invoke`
  - `code_challenge`
  - `code_challenge_method=S256`
  - `state`
  - `id_token_add_organizations=true`
  - `codex_cli_simplified_flow=true`
  - `originator=pi`

### 5. Callback completion endpoint

Replace the current browser-owned verifier flow with a server-owned completion contract:

```text
POST /api/providers/openai-codex/oauth/complete
```

Request body:

```ts
type CompleteOpenAiCodexOAuthRequest = {
  code: string;
  state: string;
  redirectUri: string;
};
```

The request deliberately does **not** include `codeVerifier` or `refreshToken`.

#### Completion behavior
1. Validate request shape.
2. Normalize and validate `redirectUri`.
3. Hash incoming `state` and load the stored session by `stateHash`.
4. Reject when:
   - no session exists
   - session expired
   - session already consumed
   - `providerType !== 'openai-codex'`
   - stored `redirectUri` differs from request `redirectUri`
   - callback path is not `/oauth/callback`
5. Exchange the authorization code against `https://auth.openai.com/oauth/token` using the **stored** PKCE verifier.
6. Decode `id_token`, extract `email` and optional `chatgpt_account_id` as currently done.
7. Create provider:
   - `type: 'openai-codex'`
   - `name: openai-codex:${email.toLowerCase()}`
   - `apiKey` payload stored server-side as JSON string containing `accessToken`, `refreshToken`, `idToken`, and optional metadata needed for refresh.
8. Sync models before returning success.
9. Mark the OAuth session consumed atomically before returning `201`.

### 6. Refresh-token ownership rules

The current route `POST /oauth/openai-codex/refresh` accepts `{ providerId, refreshToken }`, which is the main hardening issue from the review.

Change it to one of these repo-compatible shapes:

- preferred: keep refresh fully internal and remove the frontend API helper entirely
- acceptable fallback: keep a backend route but accept only `{ providerId }`

In either case:
- load the provider via `ProviderOrchestratorService.resolveProviderById()`
- decode the stored JSON token bundle from `apiKeyEnc`
- read `refreshToken` from server-side storage only
- exchange refresh token server-side
- write back rotated tokens through `updateProviderApiKey()`

The browser never sees the refresh token and never sends it.

### 7. Error mapping in `providerRoutes.ts`

Keep `OpenAiCodexExchangeError`, but expand the explicit mappings:

- missing `code` -> user-facing callback error
- missing `state` -> user-facing callback error
- invalid/missing session -> restart sign-in
- expired session -> restart sign-in
- consumed session -> restart sign-in
- `missing_codex_entitlement` -> workspace/admin guidance
- upstream non-JSON token error -> generic exchange failure without leaking raw secrets

Error payloads stay in the existing `{ error: string }` shape.

## Frontend Design

### 8. `frontend/src/api/kernel.ts`

Add/adjust helpers:

- `createOpenAiCodexOAuthSession(payload)`
- `completeOpenAiCodexOAuth(payload)` updated to send `code`, `state`, and `redirectUri`
- remove the public `refreshOpenAiCodexToken()` browser helper, or update it so it never accepts `refreshToken`

Update response/request types so no frontend contract includes raw token values.

### 9. `frontend/src/hooks/useProviders.ts`

Add React Query mutations for the Codex flow:

- `useCreateOpenAiCodexOAuthSession()`
- `useCompleteOpenAiCodexOAuth()`

This keeps Codex start/completion aligned with the repo's existing mutation pattern and satisfies the "no direct fetch in React component" requirement.

### 10. `frontend/src/pages/ModelProviders.tsx`

Current issue:
- it directly calls `fetch('/api/providers/oauth/openai-codex/config?...')`
- it stores PKCE verifier in `sessionStorage`
- it builds the authorize URL in the component

Replace that with:

1. call `useCreateOpenAiCodexOAuthSession().mutateAsync({ origin: window.location.origin })`
2. store only lightweight browser state needed for UX guardrails:
   - `oauth_provider_type = openai-codex`
   - optional session-start timestamp if useful for UX
3. navigate to returned `authUrl`

Do **not** store PKCE verifier in `sessionStorage` anymore.

### 11. `frontend/src/pages/OAuthCallbackHandler.tsx`

Keep the existing page, but narrow its responsibility:

- read `code` and `state` from the browser URL
- verify stored provider type is `openai-codex`
- call `useCompleteOpenAiCodexOAuth()` or the API helper through the hook layer
- never read or send a verifier
- on success:
  - invalidate `['providers']`
  - invalidate `['provider-catalog', provider.id]`
  - clear `oauth_provider_type`
  - navigate to `/?tab=models`
- on failure:
  - keep the page in error state
  - show friendly backend error text

## Security Rules

### 12. Session TTL and one-time use
- Default TTL should be short and server-controlled.
- Session lookup must happen by hashed state.
- A consumed session must never be reusable, even if the user retries the same callback URL.

### 13. Redirect guardrails
- The backend must only accept callback completion for `/oauth/callback`.
- The backend must reject loopback-style redirect URIs such as `http://localhost:1455/auth/callback` for this web flow.
- The stored session origin and callback URI must match the completion request exactly.

### 14. Logging and redaction
- Use existing Pino logging only.
- Log session lifecycle events without secrets.
- Never log `code`, `state`, PKCE verifier, access token, refresh token, or id token.

## Verification Plan

### Backend
- unit coverage for state hashing and PKCE generation helpers
- repository coverage for create/find/consume/expire session behavior in memory mode
- HTTP integration coverage for:
  - session creation
  - callback completion success
  - expired session
  - reused session
  - invalid redirect URI
  - `missing_codex_entitlement`
  - refresh path without browser-supplied refresh token

### Frontend
- component/hook coverage proving `ModelProviders.tsx` no longer calls `fetch(...)` directly for Codex OAuth
- callback handler coverage proving completion sends `code`, `state`, and `redirectUri`, but not `codeVerifier` or `refreshToken`
- UX coverage for user-friendly OAuth errors

### Build verification
- `core/kernel`: `npx tsc --noEmit`
- `frontend`: `npx tsc --noEmit`

## Out of Scope

- Changing generic `openai` to OAuth
- Introducing a new secret manager or OAuth dependency
- Reworking unrelated provider auth flows

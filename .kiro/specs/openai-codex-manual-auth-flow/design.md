# Design: OpenAI Codex Manual Authentication Flow

## Overview

This design converts the current `openai-codex` onboarding flow from an automatic browser callback completion into a manual Codex-style flow:

1. the frontend asks the backend to create a session,
2. the backend returns an authorization URL,
3. the user opens that URL manually,
4. OpenAI redirects to the existing frontend callback route,
5. the callback page shows copyable callback data instead of completing OAuth automatically, and
6. the user pastes the returned URL or the extracted `code` + `state` back into the provider screen, which then calls the backend completion endpoint.

This keeps the current BYO OAuth client model and repository-backed session handling, while changing the UX to a manual/headless pattern.

## Why this design

- It matches the requested manual link/copy-return interaction without introducing new dependencies.
- It preserves the existing backend-owned PKCE/state/session model.
- It avoids trusting browser-supplied redirect URI during completion.
- It minimizes architecture churn by reusing the current provider routes, repository methods, React Query hooks, and provider onboarding page.

## Configuration decision

`OPENAI_CODEX_WEB_CLIENT_ID` remains required.

### Justification
- The current implementation already builds authorize and token requests around a configured OAuth client ID.
- This design intentionally changes the completion UX, not the OAuth client strategy.
- The existing redirect model still targets the app callback route `/oauth/callback`, so the configured OAuth client must still recognize that redirect URI.
- Therefore the spec keeps the env dependency and updates docs accordingly rather than pretending the manual flow removes it.

## Backend design

### File: `core/kernel/src/modules/providers/routes/providerRoutes.ts`

This file remains the main implementation point.

#### Keep
- `POST /openai-codex/oauth/sessions`
- `POST /openai-codex/oauth/complete`
- `POST /openai-codex/oauth/refresh`
- server-side PKCE generation
- state hashing
- session TTL cleanup
- provider sanitization for browser responses

#### Change 1: start-session response contract

Current response:

```ts
type CreateOpenAiCodexOAuthSessionResponse = {
  authUrl: string;
  expiresAt: string;
};
```

New response:

```ts
type CreateOpenAiCodexOAuthSessionResponse = {
  authUrl: string;
  expiresAt: string;
  redirectUri: string;
  mode: 'manual';
};
```

Notes:
- Request stays `{ origin: string }` to preserve the current redirect-URI construction pattern.
- Response includes `redirectUri` so the frontend can show explicit instructions.
- `mode: 'manual'` makes the frontend contract unambiguous and future-proof.

#### Change 2: completion request contract

Current request:

```ts
type CompleteOpenAiCodexOAuthRequest = {
  code: string;
  state: string;
  redirectUri: string;
};
```

Replace with a union:

```ts
type CompleteOpenAiCodexOAuthRequest =
  | {
      callbackUrl: string;
    }
  | {
      code: string;
      state: string;
    };
```

Rules:
- `redirectUri` is removed from the browser-facing completion contract.
- If `callbackUrl` is provided, the backend parses it and extracts `code`, `state`, `error`, and `error_description`.
- If `code` + `state` are provided directly, the backend uses them as the manual input.
- The backend always derives the redirect URI from the claimed session record, never from the request body.

#### Change 3: parsing helpers

Add or replace parsing helpers in this file:

- `parseCreateOpenAiCodexOAuthSessionRequest(body)`
- `parseCompleteOpenAiCodexOAuthRequest(body)`
- `parseOpenAiCodexCallbackUrl(callbackUrl)`

Expected backend parsing behavior:

```ts
type ParsedOpenAiCodexCompletionInput = {
  code: string;
  state: string;
};
```

Validation details:
- Reject empty body with `OpenAI Codex sign-in completion is missing the callback data.`
- Reject malformed `callbackUrl` with `OpenAI Codex callback URL is invalid.`
- Reject callback URL without `code` with `OpenAI Codex callback is missing the authorization code.`
- Reject callback URL without `state` with `OpenAI Codex callback is missing the OAuth state.`
- If callback URL contains OAuth `error`, map it through the same friendly-error pipeline used for token exchange failures.

#### Change 4: claimed-session flow

`requireClaimedOpenAiCodexOAuthSession(state)` should become state-driven and session-owned.

New behavior:
- hash incoming `state`
- delete expired sessions
- atomically claim session by state hash and provider type
- use `session.redirectUri` from the repository record for token exchange
- reject replay before a second token exchange starts

Implementation detail:
- The repository claim method currently also checks `redirectUri`.
- Update repository interfaces and implementations so claim uses `stateHash + providerType + consumedAt + now`, not a browser-provided redirect URI.

New repository contract:

```ts
claimOAuthSessionByStateHash(
  stateHash: string,
  providerType: OpenAiCodexOAuthSession['providerType'],
  consumedAt: string,
  now: string
): Promise<OpenAiCodexOAuthSession | null>;
```

This is the main server-side ownership improvement in this spec.

#### Change 5: completion flow logic

Completion sequence in `POST /openai-codex/oauth/complete`:

1. Parse manual input.
2. Claim session by state hash.
3. Exchange code using `session.codeVerifier` and `session.redirectUri`.
4. Extract `email` and optional `accountId` from `id_token`.
5. Create provider `openai-codex:${email.toLowerCase()}`.
6. Sync models.
7. Return sanitized provider + models.

No token bundle may be returned to the browser.

#### Change 6: error mapping

Friendly error handling must cover:
- callback URL contains `error=access_denied&error_description=missing_codex_entitlement`
- token exchange returns `missing_codex_entitlement`
- expired session
- replayed session
- malformed callback URL
- missing callback values

Use `OpenAiCodexExchangeError` as the single route-level error type.

### File: `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`

Update the repository interface for session claiming so the browser no longer supplies `redirectUri`.

#### Exact change

From:

```ts
claimOAuthSessionByStateHash(
  stateHash: string,
  redirectUri: string,
  providerType: OpenAiCodexOAuthSession['providerType'],
  consumedAt: string,
  now: string
): Promise<OpenAiCodexOAuthSession | null>;
```

To:

```ts
claimOAuthSessionByStateHash(
  stateHash: string,
  providerType: OpenAiCodexOAuthSession['providerType'],
  consumedAt: string,
  now: string
): Promise<OpenAiCodexOAuthSession | null>;
```

### File: `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts`

Update the in-memory claim implementation to:
- stop checking browser-provided redirect URI,
- continue checking provider type,
- continue checking `consumedAt`,
- continue checking expiry,
- atomically mark claimed session as consumed before token exchange proceeds.

### File: `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts`

Update the Postgres claim implementation to match the new repository interface.

Required query behavior:
- match `state_hash`
- match `provider_type`
- require `consumed_at IS NULL`
- require `expires_at > now`
- set `consumed_at = $consumedAt` in the same statement
- return the claimed row if successful

No schema change is required.

## Frontend design

### File: `frontend/src/api/kernel.ts`

Update the API contracts for `openai-codex`.

#### Exact frontend types

```ts
export interface CreateOpenAiCodexOAuthSessionRequest {
  origin: string;
}

export interface CreateOpenAiCodexOAuthSessionResponse {
  authUrl: string;
  expiresAt: string;
  redirectUri: string;
  mode: 'manual';
}

export type CompleteOpenAiCodexOAuthRequest =
  | { callbackUrl: string }
  | { code: string; state: string };
```

Implementation notes:
- keep API functions in this file
- no direct browser fetch in components
- completion response shape stays unchanged so downstream cache invalidation is stable

### File: `frontend/src/hooks/useProviders.ts`

Keep using React Query mutations.

Expected updates:
- `useCreateOpenAiCodexOAuthSession()` stays in place
- `useCompleteOpenAiCodexOAuth()` stays in place
- hook names do not need renaming because route names remain unchanged

### File: `frontend/src/pages/ModelProviders.tsx`

This page becomes the main manual completion UI.

#### Replace current behavior

Current `startOpenAiCodexFlow()` redirects immediately with `window.location.assign(authUrl)`.

New behavior:
- call start-session mutation
- store returned session metadata in local React state
- render a guided manual panel with:
  - readonly auth URL field
  - button to open the auth URL in a new tab/window
  - readonly redirect URI field
  - expiry time text
  - textarea for pasted callback URL
  - fallback inputs for `code` and `state`
  - submit button to complete sign-in
  - clear/reset button to discard the pending session UI

#### Local state to add

```ts
type PendingOpenAiCodexManualSession = {
  authUrl: string;
  expiresAt: string;
  redirectUri: string;
  mode: 'manual';
};
```

Suggested component state:
- `pendingCodexSession: PendingOpenAiCodexManualSession | null`
- `manualCallbackUrl: string`
- `manualCode: string`
- `manualState: string`
- `manualAuthError: string | null`

#### UX rules
- Do not auto-navigate away from the provider page on start.
- Opening the auth link should use `window.open(authUrl, '_blank', 'noopener,noreferrer')`.
- If the user pasted a callback URL, submit `{ callbackUrl }` only.
- Otherwise, if both `code` and `state` are present, submit `{ code, state }`.
- Otherwise show a friendly validation error.
- On success:
  - clear pending manual state,
  - invalidate `['providers']` and `['provider-catalog', provider.id]`,
  - keep current navigation behavior to `/?tab=models` if desired.

#### Keep
- `openai` API-key form path unchanged
- existing provider list/catalog behavior unchanged

### File: `frontend/src/pages/OAuthCallbackHandler.tsx`

This page becomes a manual helper screen.

#### Remove
- automatic `completeOpenAiCodexOAuthMutation.mutateAsync(...)`
- provider-type sessionStorage gate as a hard requirement for completion

#### New behavior
- read `window.location.href`
- parse `code`, `state`, `error`, and `error_description`
- render one of two screens:

1. **Success helper screen**
   - title: OpenAI Codex authorization received
   - show full returned URL in readonly text area
   - show extracted `code` and `state`
   - instruct user to copy the full URL or the values back into Model Providers

2. **Failure helper screen**
   - if `missing_codex_entitlement`, show workspace-admin guidance
   - if `error` exists, show a friendly OAuth failure message
   - if `code` or `state` missing, say the callback is incomplete

#### Important constraint
- This page does not call the backend.
- This page does not store token data.
- This page may offer copy buttons, but storing the callback payload in sessionStorage is not required for this spec.

### File: `frontend/src/App.tsx`

No route path change is needed.

Keep:

```tsx
<Route path="/oauth/callback" element={<OAuthCallbackHandler />} />
```

## Tests

### File: `core/kernel/src/modules/providers/routes/__tests__/providerRoutes.oauth.test.ts`

Update and extend route tests.

Required test cases:
- creates a backend-owned session and returns `mode: 'manual'` plus `redirectUri`
- completes using `{ callbackUrl }`
- completes using `{ code, state }`
- rejects replay before second token exchange starts
- rejects expired sessions
- rejects malformed callback URL
- rejects callback URL missing `code`
- rejects callback URL missing `state`
- maps `missing_codex_entitlement` from callback URL error params
- maps `missing_codex_entitlement` from token endpoint response
- keeps oauth token bundles out of browser responses

### File: `core/kernel/src/modules/providers/infrastructure/repositories/__tests__/provider.repository.memory.test.ts`

Update claim-session tests for the new repository signature and redirect-URI ownership change.

### File: `core/kernel/src/modules/providers/infrastructure/repositories/__tests__/provider.repository.postgres.test.ts`

Update claim-session tests for the new repository signature and atomic consume behavior.

### File: `frontend/src/pages/__tests__/codexOAuthFlow.test.tsx`

Update frontend tests to cover:
- start flow creates pending manual session without direct fetch in component
- start flow does not redirect current page automatically
- callback helper page renders copyable success data from query params
- callback helper page renders friendly missing-state / OAuth-error messages
- provider page completion submits `{ callbackUrl }` when callback URL is present
- provider page completion submits `{ code, state }` fallback when direct values are used

## Documentation updates

### Files to update
- `docs/suporte/openai-codex-setup.md`
- `docs/suporte/openai-codex-auth-status.md`
- `docs/local-dev.md`

Required doc changes:
- describe the implemented flow as manual copy-return / headless-style
- keep `OPENAI_CODEX_WEB_CLIENT_ID` called out as required
- explain that `/oauth/callback` now acts as a helper page where the user copies the returned URL or values back into the provider UI

## Files likely touched

### Backend
- `core/kernel/src/modules/providers/routes/providerRoutes.ts`
- `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`
- `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts`
- `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts`
- `core/kernel/src/modules/providers/routes/__tests__/providerRoutes.oauth.test.ts`
- `core/kernel/src/modules/providers/infrastructure/repositories/__tests__/provider.repository.memory.test.ts`
- `core/kernel/src/modules/providers/infrastructure/repositories/__tests__/provider.repository.postgres.test.ts`

### Frontend
- `frontend/src/api/kernel.ts`
- `frontend/src/hooks/useProviders.ts`
- `frontend/src/pages/ModelProviders.tsx`
- `frontend/src/pages/OAuthCallbackHandler.tsx`
- `frontend/src/pages/__tests__/codexOAuthFlow.test.tsx`

### Docs
- `docs/suporte/openai-codex-setup.md`
- `docs/suporte/openai-codex-auth-status.md`
- `docs/local-dev.md`

## Verification expectations

After implementation:
- backend TypeScript must compile: `cd core/kernel && npx tsc --noEmit`
- frontend TypeScript must compile: `cd frontend && npx tsc --noEmit`
- updated backend/provider/frontend tests must pass

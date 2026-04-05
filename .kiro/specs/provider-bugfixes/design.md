# Provider Bugfixes — Design

## Overview

This spec keeps the original provider-management bugfix scope, but corrects the OpenAI auth direction.

- `openai` stays the standard API-key provider.
- `openai-codex` becomes the separate sign-in/OAuth-style variant.
- Any callback/exchange flow belongs to `openai-codex`, not to generic `openai`.
- The reused OpenClaw/OpenAI Codex client is treated as CLI/loopback-only for this spec and is explicitly incompatible with this repo's SPA/web callback route at `/oauth/callback`.
- Therefore `openai-codex` requires a repo-owned valid web OAuth client registration before any browser authorize flow can be wired for this repo.

This correction is required because the previous Phase 7 direction treated generic `openai` as if browser/app OAuth were its default auth path. That assumption must not remain in the final implementation.

For `openai-codex`, implementation order now starts even earlier: configuration and UX guardrails must land before auth-request wiring. No more coding should proceed under the old OpenClaw-loopback assumption.

---

## Phase 1: Backend — Add Pino Logging to ProviderOrchestratorService

### 1.1 Add Logger to ProviderOrchestratorService

**File:** `core/kernel/src/modules/providers/services/providerOrchestratorService.ts`

Add `pino({ name: 'ProviderOrchestratorService' })` as a class logger and use it in create/delete/sync flows.

### 1.2 Required Logging Coverage

The service must log:
- create start / duplicate / success
- delete start / not found / delete success
- sync start / provider resolved / models fetched / sync success

---

## Phase 2: Frontend — Fix Sync Race Condition in `ModelProviders.tsx`

### 2.1 Query Invalidation Pattern

**File:** `frontend/src/pages/ModelProviders.tsx`

The sync handler must stop relying on an inline `catalogQuery.refetch()` sequence that can race stale state.

Use the existing TanStack Query invalidation pattern instead:
- set the active provider before the mutation path depends on it
- invalidate the relevant catalog query on success
- clear loading state on settled
- surface errors through existing UI error state

---

## Phase 3: `openai-codex` Config and UX Guardrails — First Priority

### 3.1 Product Separation Rule

Before any implementation work in this phase:

- generic `openai` must remain API-key-only in UI, config, and provider type handling
- `openai-codex` must be treated as a distinct provider variant/surface
- no file may describe the `openai-codex` sign-in flow as the default OpenAI Platform auth path
- no file may assume the OpenClaw/CLI loopback OAuth client can be reused for this repo's browser callback flow

### 3.2 Valid Client Registration Rule

Before any authorize URL is built, the implementation must use a repo-owned valid web OAuth client registration for `openai-codex`.

Required properties:
- intended for browser/web callback usage for this repo
- allowed redirect URI matches this repo's frontend callback architecture: `${window.location.origin}/oauth/callback`
- dev registration includes `http://localhost:5173/oauth/callback`
- the same registration is used by both frontend authorize-start logic and backend token exchange logic

Explicit rejection:
- do not reuse the OpenClaw/OpenAI Codex CLI loopback client
- do not use loopback-only redirect URIs such as `http://localhost:1455/auth/callback` for this repo flow

### 3.3 Missing-Config UX Guardrail

**File:** `frontend/src/pages/ModelProviders.tsx`

If valid `openai-codex` web-client configuration is missing or incomplete, the UI must not attempt external sign-in.

Required behavior:
- disable or intercept the sign-in action safely
- show a clear message that `openai-codex` requires a repo-owned web OAuth client registration for `/oauth/callback`
- do not show a misleading browser redirect or generic provider error
- do not imply that generic `openai` should be used with sign-in

### 3.4 Frontend Start Flow: Build the Web-Registered Authorize URL

**File:** `frontend/src/pages/ModelProviders.tsx`

The `openai-codex` sign-in button must first do one thing correctly: generate PKCE/state values and open the external authorize page.

Authorize endpoint:

```text
https://auth.openai.com/oauth/authorize
```

Required query parameters for the start URL:

```text
response_type=code
client_id=<repo-owned valid web OAuth client id for openai-codex>
redirect_uri=${window.location.origin}/oauth/callback
scope=openid profile email offline_access
code_challenge=<pkce-s256-challenge>
code_challenge_method=S256
state=<opaque-random-state>
id_token_add_organizations=true
codex_cli_simplified_flow=true
originator=pi
```

Required start-flow rules:
- generate a PKCE `code_verifier` and derived S256 `code_challenge`
- generate a separate random `state`
- store `oauth_code_verifier` in `sessionStorage`
- store the `state` value in `sessionStorage` for callback validation
- redirect/open the browser to the fully composed authorize URL immediately after generation

### 3.5 Config Decision: Explicit Web Client, No Loopback Fallback

To keep this bugfix narrow while matching the confirmed architecture, this repo must require explicit valid web-client configuration for `openai-codex` and must not silently fall back to the OpenClaw/CLI loopback client.

Minimal spec decision:
- define explicit repo-owned `openai-codex` web OAuth client configuration
- use that same configuration for the frontend authorize step and backend exchange step
- if config is missing, block the sign-in attempt gracefully instead of trying a best-effort redirect
- do not reuse this client configuration or naming for generic `openai`

### 3.6 Backend Route: Add Explicit `openai-codex` Exchange Endpoint

**File:** `core/kernel/src/modules/providers/routes/providerRoutes.ts`

Add a route under `/api/providers`:

```text
POST /api/providers/oauth/openai-codex/exchange
```

**Request body:**

```typescript
type OpenAiCodexExchangeRequest = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
};
```

**Validation rules:**
- `code` is required
- `codeVerifier` is required
- `redirectUri` is required
- `redirectUri` must be passed through from `${window.location.origin}/oauth/callback`

The backend exchange step must use the same repo-owned valid web OAuth client configuration chosen in Phase 3.2. This phase must not reintroduce a separate frontend/backend client mismatch.

### 3.7 Backend Route Behavior

The backend owns the exchange step for the `openai-codex` callback flow.

Upstream auth endpoints for this variant are:

```text
Authorize: https://auth.openai.com/oauth/authorize
Token exchange: https://auth0.openai.com/oauth/token
```

These endpoints are scoped in this spec to the `openai-codex` sign-in variant only. They must not be described or implemented as the default auth path for generic `openai`.

Two rules are mandatory:

1. The browser must not perform the token exchange directly.
2. The exchange route must be specific to `openai-codex`, not generic `openai`.

### 3.8 Backend Route Success Path

After a valid upstream token/access artifact is obtained, the same backend request must:

1. Create the provider as `type: 'openai-codex'`
2. Use a distinct persisted provider name for the same variant, such as `openai-codex`
3. Synchronize models before returning success
4. Return `201` with the created provider and synced models

The backend must not create this provider as `type: 'openai'`.

### 3.9 Backend Route Error Mapping

- invalid request body → `400`
- upstream exchange failure with usable auth/provider message → `400`
- upstream/network failure without usable message → `502`
- duplicate `openai-codex` provider conflict → preserve existing conflict behavior (`409`)

---

## Phase 4: Frontend — Distinguish `openai` vs `openai-codex`

### 4.1 Provider Selection UI Must Be Explicit

**File:** `frontend/src/pages/ModelProviders.tsx`

The UI must expose two distinct options:

- `OpenAI` — API key
- `OpenAI Codex` — Sign in

Minimum UI rules:
- generic `openai` does not show or trigger the sign-in callback flow
- `openai-codex` does not masquerade as the generic OpenAI Platform provider
- button labels, descriptions, and helper text must make the difference obvious before the user clicks

### 4.2 Generic `openai` Form

The `openai` add flow remains the existing API-key form. This phase must not add browser/app OAuth to that surface.

### 4.3 `openai-codex` Authorize Step

The `openai-codex` sign-in UI builds the external authorize URL, stores PKCE/state values in `sessionStorage`, and opens the external auth page before any callback/exchange work is considered complete.

Authorize endpoint:

```text
https://auth.openai.com/oauth/authorize
```

Start-flow parameters must include:
- `response_type=code`
- `client_id` from the repo-owned valid web OAuth client registration for `openai-codex`
- `redirect_uri=${window.location.origin}/oauth/callback`
- `scope=openid profile email offline_access`
- `code_challenge`
- `code_challenge_method=S256`
- `state`
- `id_token_add_organizations=true`
- `codex_cli_simplified_flow=true`
- `originator=pi`

The frontend must not attempt this flow unless valid repo-owned web-client config is present, and it must not fall back to the OpenClaw/CLI loopback client.

The redirect URI must always be:

```typescript
const redirectUri = `${window.location.origin}/oauth/callback`;
```

### 4.4 `OAuthCallbackHandler.tsx` Responsibility

**File:** `frontend/src/pages/OAuthCallbackHandler.tsx`

The callback handler must:
- detect that the callback belongs to the `openai-codex` flow
- call one frontend helper that POSTs to `/api/providers/oauth/openai-codex/exchange`
- stop owning direct provider creation/sync for the `openai-codex` sign-in path
- keep `oauth_code_verifier` until end-to-end success
- validate the returned `state` against the `sessionStorage` value before calling the backend exchange helper
- render backend-returned errors inline when completion fails

### 4.5 Query Invalidation and Navigation

On successful `openai-codex` completion:
- invalidate the providers query
- optionally invalidate the returned provider's catalog query using the returned provider ID
- remove `oauth_code_verifier`
- remove the stored `state` value
- navigate to `/?tab=models`

On failure:
- do not remove `oauth_code_verifier`
- do not remove the stored `state` value
- do not navigate away

---

## Phase 5: Frontend — Navigation Target Must Exist

### 5.1 `App.tsx` Must Support `/?tab=models`

**File:** `frontend/src/App.tsx`

The main app must support loading the Models tab from a query-string target.

Rules:
- `OAuthCallbackHandler` navigates to `/?tab=models`
- `MainApp` reads the `tab` search parameter on load
- allowed values: `dashboard`, `agents`, `costs`, `models`, `router`
- invalid or missing values fall back to `dashboard`

---

## Phase 6: Additional Bug Fixes

### 6.1 Delete Freeze

**File:** `frontend/src/pages/ModelProviders.tsx`

If the deleted provider was active, clear `activeProviderId`.

### 6.2 Create Health Handling

**File:** `core/kernel/src/modules/providers/routes/providerRoutes.ts`

Health-check failure must not block provider creation.

### 6.3 Provider List Refresh After Create

**File:** `frontend/src/pages/ModelProviders.tsx`

Invalidate the providers query after successful create.

---

## File Change Summary

| File | Change Type | Notes |
|------|-------------|-------|
| `core/kernel/src/modules/providers/services/providerOrchestratorService.ts` | Add logging | Existing bugfix scope retained |
| `core/kernel/src/modules/providers/routes/providerRoutes.ts` | Add `openai-codex` backend-assisted exchange route + health-check isolation | Must use the same repo-owned valid web OAuth client configuration as the start flow |
| `frontend/src/api/kernel.ts` | Add `completeOpenAiCodexOAuth()` helper | Must POST to `/api/providers/oauth/openai-codex/exchange` |
| `frontend/src/pages/ModelProviders.tsx` | Separate `openai` API-key UX from `openai-codex` sign-in UX | First-priority fix: clicking sign in must open the correct authorize URL |
| `frontend/src/pages/OAuthCallbackHandler.tsx` | Replace browser-owned completion with backend completion call | Specific to `openai-codex` |
| `frontend/src/App.tsx` | Support `/?tab=models` | Required after successful sign-in completion |

---

## Verification

After implementation, verification must prove both separation and function:

1. Missing or incomplete `openai-codex` web-client config produces a clear non-broken UX and does not launch sign-in.
2. Valid `openai-codex` config is repo-owned, web-capable, and not the OpenClaw/CLI loopback registration.
3. Clicking `openai-codex` sign in opens `https://auth.openai.com/oauth/authorize`.
4. The authorize URL contains the required params, including PKCE, `state`, `id_token_add_organizations=true`, `codex_cli_simplified_flow=true`, and `originator=pi`.
5. Generic `openai` can still be created through the API-key flow.
6. Generic `openai` does not trigger browser/app OAuth.
7. `openai-codex` returns through `/oauth/callback`.
8. The frontend calls `POST /api/providers/oauth/openai-codex/exchange`.
9. The browser does not exchange tokens directly.
10. The backend creates `type: 'openai-codex'`, syncs models, and returns success.
11. The app lands on `/?tab=models`.
12. The two variants remain distinct in UI labels, config names, and persisted provider type.

# Provider Bugfixes — Tasks

## Preamble

All tasks are **mandatory** unless marked with `*`.

For this corrected spec, all OpenAI sign-in work must target `openai-codex` only. Any prior completion status tied to the rejected "generic `openai` uses OAuth" direction is no longer valid for compliant implementation.

No further coding may proceed under the rejected assumption that this repo can reuse the OpenClaw/CLI loopback OAuth client for the browser callback flow.

---

## Phase 1: Backend — Logging

### Task 1.1: Add Pino Logger to ProviderOrchestratorService
- [x] Add `import pino from 'pino';` to imports
- [x] Add `private readonly log = pino({ name: 'ProviderOrchestratorService' });` as class field

### Task 1.2: Add Logs in createProvider
- [x] Add log at method start
- [x] Add log on existing provider conflict
- [x] Add log on success

### Task 1.3: Add Logs in deleteProvider
- [x] Add log at method start
- [x] Add log when provider not found
- [x] Add log when provider found
- [x] Add log on success

### Task 1.4: Add Logs in syncModels
- [x] Add log at method start
- [x] Add log after provider resolution
- [x] Add log after models fetched
- [x] Add log on success

---

## Phase 2: Frontend — Sync Race Condition

### Task 2.1: Fix syncModels Handler in `ModelProviders.tsx`
- [x] Remove direct stale-state refetch sequencing from the handler
- [x] Move active-provider state update before the mutation depends on it
- [x] Use query invalidation via the supported TanStack Query pattern
- [x] Surface sync errors through existing UI state
- [x] Clear loading state on settled

---

## Phase 3: Correct Product Direction for OpenAI Providers

### Task 3.1: Re-state Generic `openai` as API-Key Only
- [x] Update provider-management UI/config requirements so generic `openai` is API-key only
- [x] Remove any implementation path that starts browser/app OAuth for generic `openai`
- [x] Ensure generic `openai` create flow continues to use the existing API-key submission path

### Task 3.2: Introduce Separate `openai-codex` Variant
- [x] Add `openai-codex` as a distinct provider type/variant in the provider-management architecture
- [x] Ensure persisted provider type/name for this path is `openai-codex`, not `openai`
- [x] Keep the scope limited to provider management/auth UX changes needed for this separation

### Task 3.3: Make the UI Unambiguous
- [x] Show separate provider choices for `openai` and `openai-codex`
- [x] Label generic `openai` as API key
- [x] Label `openai-codex` as sign in
- [x] Ensure helper text/descriptions do not imply that Codex sign-in is the default auth path for generic OpenAI Platform usage

---

## Phase 4: `openai-codex` Configuration and UX Guardrails (First Priority)

### Task 4.1: Replace the Rejected Loopback Assumption in Spec/Implementation Direction
- [x] Stop treating the OpenClaw/CLI loopback OAuth client as reusable for this repo
- [x] Require a repo-owned valid web OAuth client registration for `openai-codex`
- [x] Require dev redirect support for `http://localhost:5173/oauth/callback`
- [x] Ensure this rule is explicit anywhere `openai-codex` auth config is described

### Task 4.2: Add Graceful Missing-Config UX Before Auth Wiring
- [x] If valid `openai-codex` web-client config is missing, do not launch external sign-in
- [x] Show a clear message that `openai-codex` requires a repo-owned web OAuth client registration for `/oauth/callback`
- [x] Ensure the missing-config UX does not imply that generic `openai` uses sign-in

### Task 4.3: Verify Guardrails Before Any Auth Request Wiring
- [ ] Verify missing or incomplete `openai-codex` web-client config does not launch a broken sign-in attempt
- [ ] Verify the UI message clearly explains the required repo-owned web callback registration
- [ ] Verify no implementation path still references the OpenClaw/CLI loopback callback assumption for this repo

---

## Phase 5: `openai-codex` Login Start

### Task 5.1: Fix the `openai-codex` Sign-In Button to Open the Correct Auth Page
- [x] Update the `openai-codex` start flow in `frontend/src/pages/ModelProviders.tsx` only after Phase 4 guardrails are in place
- [x] Use `https://auth.openai.com/oauth/authorize` as the authorize endpoint
- [x] Build the authorize URL with these required params: `response_type=code`, `client_id`, `redirect_uri`, `scope=openid profile email offline_access`, `code_challenge`, `code_challenge_method=S256`, `state`, `id_token_add_organizations=true`, `codex_cli_simplified_flow=true`, `originator=pi`
- [x] Generate a PKCE verifier/challenge pair before navigation
- [x] Generate and persist a `state` value before navigation
- [x] Open the external auth page immediately when the user clicks sign in

### Task 5.2: Keep Auth Client Configuration Explicit and Web-Compatible
- [x] Use only the repo-owned valid web OAuth client registration for `openai-codex`
- [x] Use the same client registration for the later backend exchange step so frontend/backend do not drift
- [x] Do not silently fall back to the OpenClaw/CLI loopback client

### Task 5.3: Verify Login Start Before Any Callback Analysis
- [ ] Click the `openai-codex` sign-in button from the provider UI
- [ ] Verify the browser opens `https://auth.openai.com/oauth/authorize`
- [ ] Verify the generated URL contains the required authorize params
- [ ] Verify `redirect_uri` uses `${window.location.origin}/oauth/callback`
- [ ] Verify `oauth_code_verifier` and `state` are persisted before navigation

---

## Phase 6: `openai-codex` Backend-Assisted Sign-In Completion

### Task 6.1: Add Backend `openai-codex` Exchange Route
- [x] Add `POST /api/providers/oauth/openai-codex/exchange` in `core/kernel/src/modules/providers/routes/providerRoutes.ts`
- [x] Accept body `{ code, codeVerifier, redirectUri }`
- [x] Validate all three fields before any upstream exchange call
- [x] Use the same repo-owned valid web OAuth client registration chosen in Phase 4/5 instead of any loopback client assumption

### Task 6.2: Perform Exchange on the Backend Only
- [x] Keep the browser from performing the token/code exchange directly
- [x] Keep the exchange route specific to `openai-codex`
- [x] Map validation/upstream/network failures to explicit API errors

### Task 6.3: Create and Sync `openai-codex` in the Backend Completion Route
- [x] After successful exchange, call provider creation with `type: 'openai-codex'`
- [x] Use a distinct provider name for the same variant, such as `openai-codex`
- [x] Call `syncModels(provider.id)` before returning success
- [x] Return `201` with `{ provider, models }`
- [x] Preserve `409` conflict behavior if `openai-codex` already exists

---

## Phase 7: Frontend `openai-codex` Callback Flow

### Task 7.1: Add Frontend Helper for `openai-codex` Completion
- [x] Add one frontend API helper that POSTs to `/api/providers/oauth/openai-codex/exchange`
- [x] Keep this helper specific to `openai-codex`

### Task 7.2: Update `OAuthCallbackHandler.tsx`
- [x] Remove direct browser-owned completion logic for the OpenAI sign-in path
- [x] Detect and complete the `openai-codex` callback flow through the backend helper
- [x] Validate the returned `state` against the stored session value before backend completion
- [x] Do not call `createProvider()` directly in the callback for `openai-codex`
- [x] Do not call `syncProviderModels()` directly in the callback for `openai-codex`

### Task 7.3: Preserve Session Storage Until End-to-End Success
- [x] Keep `oauth_code_verifier` in `sessionStorage` when exchange, create, or sync fails
- [x] Keep the stored `state` value in `sessionStorage` when callback validation or completion fails
- [x] Remove both values only after `/api/providers/oauth/openai-codex/exchange` succeeds

### Task 7.4: Invalidate Queries and Navigate Correctly
- [x] Invalidate the providers query after successful `openai-codex` completion
- [x] If needed, invalidate the returned provider catalog using the returned provider ID
- [x] Navigate to `/?tab=models`

---

## Phase 8: Frontend Config and Navigation

### Task 8.1: Keep Codex Config Separate from Generic OpenAI Config
- [x] Ensure generic `openai` API-key flow does not depend on codex sign-in config
- [x] Keep `openai-codex` web OAuth client config isolated from generic `openai` API-key config
- [x] Ensure no loopback-only client config is described as valid for this repo callback flow

### Task 8.2: Use Dynamic redirect_uri
- [x] Build redirect URI with `${window.location.origin}/oauth/callback`
- [x] Remove any hardcoded localhost callback URI from the `openai-codex` flow except as an explicit example of the valid dev web callback `http://localhost:5173/oauth/callback`

### Task 8.3: Support `/?tab=models`
- [x] Update `frontend/src/App.tsx` so the main app reads `tab` from the query string
- [x] Support only `dashboard | agents | costs | models | router`
- [x] Fall back to `dashboard` when invalid or absent

---

## Phase 9: Additional Bug Fixes

### Task 9.1: Fix Delete Freeze
- [x] Clear `activeProviderId` when deleting the active provider

### Task 9.2: Fix HealthCheck Failure Breaking Create
- [x] Ensure health-check failure does not fail provider creation
- [x] Return `health: 'unknown'` when health check fails

### Task 9.3: Fix Provider List Not Refreshing After Create
- [x] Invalidate the providers query after successful create

---

## Phase 10: Verification

### Task 10.1: Verify Config Guardrails First
- [ ] Verify missing or incomplete `openai-codex` web-client config does not launch sign-in
- [ ] Verify the UI shows the required repo-owned web-client registration message
- [ ] Verify no path still relies on the OpenClaw/CLI loopback client assumption

### Task 10.2: Verify `openai-codex` Login Start After Guardrails
- [ ] Start the `openai-codex` sign-in flow from the provider UI with valid web-client config present
- [ ] Verify clicking sign in actually opens `https://auth.openai.com/oauth/authorize`
- [ ] Verify the authorize URL contains `response_type=code`, `client_id`, dynamic `redirect_uri`, `scope=openid profile email offline_access`, `code_challenge`, `code_challenge_method=S256`, `state`, `id_token_add_organizations=true`, `codex_cli_simplified_flow=true`, and `originator=pi`
- [ ] Verify the callback target matches this repo's `/oauth/callback` architecture

### Task 10.3: Verify Generic OpenAI API-Key Flow
- [-] Create an `openai` provider through the API-key UI
- [-] Verify the provider is created successfully
- [-] Verify the generic `openai` path does not trigger sign-in/OAuth

### Task 10.4: Verify `openai-codex` Callback/Completion Flow
- [-] Start the `openai-codex` sign-in flow from the provider UI
- [-] Verify the browser returns to `/oauth/callback`
- [-] Verify the frontend calls `POST /api/providers/oauth/openai-codex/exchange`
- [-] Verify the browser does not perform token exchange directly
- [-] Verify the backend creates `type: 'openai-codex'`
- [-] Verify the provider appears already synced
- [-] Verify the app lands on `/?tab=models`

### Task 10.5: Verify UI Separation
- [-] Verify the UI shows `openai` and `openai-codex` as separate choices
- [-] Verify labels/help text make the auth difference clear
- [-] Verify generic `openai` remains independent from `openai-codex` sign-in config

---

## Completion Checklist

- [ ] All mandatory tasks completed
- [x] Generic `openai` remains API-key only
- [x] `openai-codex` exists as a separate sign-in variant
- [ ] Config/UX guardrails are implemented and verified before auth-request wiring
- [ ] The first-priority `openai-codex` login button fix is verified before callback-completion verification
- [x] UI/auth/config separation is explicit
- [x] Backend-assisted callback completion is specific to `openai-codex`
- [x] Browser-owned token exchange is removed from the `openai-codex` callback path
- [ ] Navigation to `/?tab=models` verified
- [ ] Delete/sync/create bugfix behavior still verified

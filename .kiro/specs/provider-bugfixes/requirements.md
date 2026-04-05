# Provider Bugfixes — Requirements

## Context

Four bugs were identified during investigation that prevent proper operation of the provider management system.

This spec also corrects the product direction for OpenAI provider auth.

For `openai-codex`, the confirmed architecture constraint is now explicit: the reused OpenClaw/OpenAI Codex client is tied to CLI/loopback redirect URIs such as `http://localhost:1455/auth/callback` and must not be reused for this repo's browser callback architecture at `http://localhost:5173/oauth/callback` (or the same `/oauth/callback` path on another origin). Callback/exchange behavior remains in scope, but only after configuration and UX guardrails enforce this constraint.

1. **Delete not working** — The delete operation appears to execute without errors, but the provider remains visible in the list. No logging exists to diagnose the issue.
2. **Sync race condition** — When syncing models, `catalogQuery.refetch()` is called before state updates, causing the UI to display stale data.
3. **OAuth callback missing sync** — After OAuth-based provider creation completes, the model catalog is never synchronized, leaving the provider with zero models.
4. **Wrong OpenAI auth architecture** — Phase 7 previously assumed generic `openai` should use browser/app OAuth. That direction is rejected. `openai` must remain API-key-based, and the sign-in flow must live under a separate `openai-codex` provider variant.

## Product Direction Correction

- `openai` remains the standard OpenAI Platform provider and is **API-key only**.
- `openai-codex` is a **separate provider variant** for the Codex/ChatGPT-style sign-in flow.
- Generic third-party OpenAI Platform OAuth for custom apps is **not** the default architecture for `openai` and must not be implied anywhere in requirements, design, UI, config, or tasks.
- The OpenClaw/CLI loopback OAuth client must be treated as incompatible with this repo's SPA/web callback architecture and must not be reused for `openai-codex` here.
- `openai-codex` requires a repo-owned valid web OAuth client registration whose allowed redirect URIs include this repo's frontend callback architecture (`${window.location.origin}/oauth/callback`; dev example: `http://localhost:5173/oauth/callback`).
- The UI must expose two clearly different provider choices/forms:
  - `openai` → API key
  - `openai-codex` → sign in / OAuth-style completion

## Bug Descriptions

### Bug 1: Delete Provider Not Working

**Symptom:** Clicking "Delete" on a provider removes it from the backend (no error thrown), but the UI continues to show the provider in the list.

**Impact:** Providers cannot be removed via the UI. The backend state becomes inconsistent with the frontend display.

**Root Cause (Preliminary):** Either:
- An ID mismatch between what the UI sends and what the repository expects
- A caching issue where the repository's in-memory state is not properly cleared
- An async issue where the delete completes but the list refresh doesn't pick up the change

**Investigation Reference:** `ref:unknown-amaranth-monkey`

### Bug 2: Sync Race Condition

**Symptom:** Clicking "Sync" on a provider triggers model synchronization, but the catalog view shows an empty list or the previous state.

**Impact:** Users must click Sync multiple times or refresh the page to see their models.

**Root Cause:** In `ModelProviders.tsx`, the mutation result is not invalidated through the supported TanStack Query flow, so the catalog view can render stale state.

**Investigation Reference:** `ref:chubby-fuchsia-hookworm`

### Bug 3: OAuth Callback Missing Model Sync

**Symptom:** After completing the OAuth/sign-in flow for the OpenAI Codex variant, the provider appears in the list but shows 0 models.

**Impact:** Users must manually click "Sync" after OAuth-based provider creation for models to appear.

**Root Cause:** The callback flow creates the provider but does not complete the initial model synchronization before returning the user to the main UI.

**Investigation Reference:** `ref:capable-harlequin-tern`

### Bug 4: OpenAI Provider/Auth Ambiguity

**Symptom:** The current spec and implementation direction blur generic `openai` and the sign-in-based OpenAI surface, causing broken UX and incorrect architectural assumptions.

**Impact:**
- Users cannot reliably understand whether they should use API key or sign-in
- The UI/config surface is ambiguous
- Implementation would incorrectly treat generic OpenAI Platform auth as OAuth-first

**Confirmed Direction:**
- `openai` is the API-key provider
- `openai-codex` is the separate sign-in provider
- Any OAuth callback, backend exchange, or special sign-in UX belongs to `openai-codex`, not `openai`
- The app must not describe `openai-codex` as the default OpenAI Platform auth path
- The old assumption that this repo can reuse the OpenClaw/CLI loopback OAuth client is rejected
- `openai-codex` browser sign-in must only proceed when a repo-owned valid web OAuth client registration exists for the frontend `/oauth/callback` architecture

## Acceptance Criteria

### AC1: Delete Works
- **Given** a provider exists in the list
- **When** the user clicks "Delete" and confirms
- **Then** the provider is removed from the list immediately
- **And** the backend logs show: start → provider found → delete success

### AC2: Sync Displays Models
- **Given** a provider exists but has no models synced
- **When** the user clicks "Sync"
- **Then** models appear in the catalog within 2 seconds
- **And** the backend logs show: start → provider resolution → model count → success

### AC3: OpenAI Codex Sign-In Starts by Opening the Correct Auth Page
- **Given** the provider selection UI shows the `openai-codex` sign-in action
- **And** valid repo-owned web OAuth client configuration for `openai-codex` is present
- **When** the user clicks that sign-in action
- **Then** the browser opens the external authorize page at `https://auth.openai.com/oauth/authorize`
- **And** the authorize URL includes all required query parameters for the `openai-codex` start flow:
  - `response_type=code`
  - `client_id`
  - `redirect_uri=${window.location.origin}/oauth/callback`
  - `scope=openid profile email offline_access`
  - `code_challenge`
  - `code_challenge_method=S256`
  - `state`
  - `id_token_add_organizations=true`
  - `codex_cli_simplified_flow=true`
  - `originator=pi`
- **And** the flow generates PKCE values and a `state` value before navigation

### AC3A: OpenAI Codex Sign-In Is Gracefully Disabled Without Valid Web Client Configuration
- **Given** the provider selection UI shows the `openai-codex` sign-in action
- **And** valid repo-owned web OAuth client configuration for `openai-codex` is missing or incomplete
- **When** the user attempts to start sign-in
- **Then** the app does not launch a broken or misleading external sign-in attempt
- **And** the UI shows a clear message that `openai-codex` requires a repo-owned web OAuth client registration for `${window.location.origin}/oauth/callback`
- **And** the message does not suggest that generic `openai` uses sign-in instead of API key

### AC4: OpenAI Codex Sign-In Synchronizes Automatically
- **Given** the user completes the sign-in/OAuth flow for `openai-codex`
- **When** the callback is processed successfully
- **Then** the `openai-codex` provider appears in the list with models already synced
- **And** no manual "Sync" click is required

### AC5: Logs Visible
- **Given** any provider operation (create, delete, sync)
- **When** the operation executes
- **Then** pino logger output appears in the backend console with appropriate log level
- **And** logs include: operation name, provider identifier, outcome (success/error), duration

### AC6: OpenAI Codex redirect_uri Uses Dynamic Origin
- **Given** the user is not on localhost
- **When** the `openai-codex` authorize URL and callback exchange are built
- **Then** the `redirect_uri` uses the actual origin via `${window.location.origin}/oauth/callback`
- **And** no hardcoded localhost callback URI remains in the `openai-codex` sign-in flow

### AC7: OpenAI Codex Login Start Requires Valid Repo-Owned Web Client Configuration
- **Given** the `openai-codex` sign-in flow is available in the frontend
- **When** the user clicks sign in
- **Then** the authorize URL is built only from explicitly configured repo-owned valid web OAuth client settings for `openai-codex`
- **And** the implementation does not silently fall back to the OpenClaw/CLI loopback client
- **And** if the required config is missing, the app follows the graceful UX behavior in AC3A

### AC8: Session Storage Cleaned Only After Successful Codex Completion
- **Given** the OAuth/sign-in flow returns to `/oauth/callback`
- **When** backend-assisted exchange, provider creation, or model sync fails
- **Then** `oauth_code_verifier` remains in `sessionStorage` for retry/debugging
- **And** the stored `state` value also remains available for validation/retry debugging
- **And** both values are removed only after the backend-assisted `openai-codex` completion succeeds end-to-end

### AC9: Delete and Create Show Errors
- **Given** `deleteProvider` or `createProvider` mutation fails
- **When** the error occurs
- **Then** `ToastNotification` displays the error message

### AC10: Delete Clears Active Provider If Needed
- **Given** a provider is the active provider
- **When** the user deletes that provider
- **Then** `activeProviderId` is set to `null`

### AC11: HealthCheck Failure Doesn't Block Create
- **Given** a provider is being created
- **When** `healthCheck` fails
- **Then** the provider is still created successfully
- **And** the response includes `health: 'unknown'`

### AC12: Provider List Refreshes After Create
- **Given** a new provider is created
- **When** the creation succeeds
- **Then** the providers query is invalidated via the supported TanStack Query invalidation flow used by this project
- **And** the new provider appears in the list

### AC13: OpenAI Remains API-Key Only
- **Given** the provider selection UI is rendered
- **When** the user chooses generic `openai`
- **Then** the UI presents API-key entry only
- **And** it does not start browser/app OAuth for generic `openai`
- **And** no requirement/design/task describes generic `openai` as using sign-in by default

### AC14: OpenAI Codex Uses a Distinct Backend-Assisted Exchange Path
- **Given** the browser returns to `/oauth/callback` with an authorization `code` for the `openai-codex` sign-in flow
- **When** the callback handler completes the `openai-codex` flow
- **Then** the browser sends the `code`, `code_verifier`, and `redirect_uri` to a backend endpoint under `/api/providers`
- **And** that endpoint is specific to `openai-codex`
- **And** no frontend page performs token exchange directly against an external OpenAI auth endpoint

### AC15: Codex Login-Start and Exchange Config Are Explicit and Separate from Generic OpenAI
- **Given** the `openai-codex` sign-in flow is implemented
- **When** the user starts sign-in from `ModelProviders.tsx`
- **Then** the browser authorize step uses `https://auth.openai.com/oauth/authorize`
- **And** both the frontend authorize step and backend exchange step use the same repo-owned valid web OAuth client registration chosen for `openai-codex`
- **And** that registration is valid for the frontend `/oauth/callback` architecture, including the dev callback `http://localhost:5173/oauth/callback`
- **And** the implementation does not reuse the OpenClaw/CLI loopback client registration
- **And** the backend exchange step uses `https://auth0.openai.com/oauth/token`
- **And** these config names are not reused to describe generic `openai` API-key auth

### AC16: Post-Auth Navigation Uses a Valid Route
- **Given** `openai-codex` completion succeeds
- **When** the callback handler finishes
- **Then** the app navigates to `/?tab=models`
- **And** the main application renders the Models tab instead of an undefined `/providers` route

### AC17: Backend Completion Owns `openai-codex` Creation and Initial Sync
- **Given** the backend receives a valid `openai-codex` exchange request
- **When** token exchange succeeds
- **Then** the backend creates the `openai-codex` provider
- **And** the backend synchronizes models before returning success
- **And** the frontend callback handler does not call `createProvider()` or `syncProviderModels()` directly for the `openai-codex` path

### AC18: Codex Start-Flow State and PKCE Storage Are Explicit
- **Given** the user starts `openai-codex` sign-in
- **When** the authorize URL is generated
- **Then** the app stores the PKCE `code_verifier` in `sessionStorage`
- **And** the app stores the generated `state` value in `sessionStorage` for callback validation
- **And** neither value is omitted from the start flow

### AC19: Provider Choice Is Unambiguous in the UI
- **Given** the provider management UI offers both OpenAI-related options
- **When** the user reviews the available add/connect actions
- **Then** the UI clearly distinguishes `openai` from `openai-codex`
- **And** labels/help text make clear that `openai` is API key and `openai-codex` is sign in
- **And** the user is not forced through the wrong auth path because of naming ambiguity

### AC20: Verification Covers Variant Separation
- **Given** the bugfix implementation is complete
- **When** verification is performed
- **Then** it confirms generic `openai` creation still works via API key
- **And** it confirms the `openai-codex` sign-in round-trip works through the backend-assisted callback path
- **And** it confirms the two variants remain separate in provider type, UI, and config naming

## Constraints

- Backend logging must use existing pino infrastructure
- Frontend changes must not redesign unrelated providers
- No new dependencies may be added
- Existing passing tests must not be modified
- Scope stays limited to provider management/auth UX changes needed to separate `openai` from `openai-codex`, with first priority on making the `openai-codex` login button open the correct external auth page
- This spec must not rely on undocumented generic OpenAI Platform OAuth as the architecture for base `openai`
- No implementation work may proceed under the rejected assumption that the OpenClaw/CLI loopback client can service this repo's SPA/browser callback flow

## Dependencies

None — this remains a tightly scoped provider-management bugfix/spec-correction change.

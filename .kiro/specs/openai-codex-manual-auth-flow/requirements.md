# Requirements: OpenAI Codex Manual Authentication Flow

## Problem

The repository currently implements `openai-codex` sign-in as a browser callback flow backed by a BYO web OAuth client configured through `OPENAI_CODEX_WEB_CLIENT_ID`.

That implementation works for a web redirect experience, but it is a documented limitation for users who expect a Codex-style manual or headless login flow. The desired direction is a CLI-like pattern where the system generates an authorization link, the user opens it manually, completes login and consent, and then pastes the returned callback URL or the extracted `code` + `state` back into the application to finish authentication.

## Goal

Replace the current auto-completing browser callback experience for `openai-codex` with a manual completion flow that:

1. keeps the existing `openai` API-key flow unchanged,
2. reuses the current provider repository and OAuth session patterns,
3. keeps PKCE, state ownership, and token exchange on the server, and
4. gives the frontend a guided, user-friendly manual completion UX without exposing stored token bundles to the browser.

## Scope

This spec covers backend and frontend changes for the `openai-codex` provider variant only, including:

- backend route contract changes under `core/kernel/src/modules/providers/`
- frontend provider onboarding UI under `frontend/src/`
- session validation, manual completion parsing, and OAuth error handling
- tests and supporting documentation updates required by the new flow

## Out of Scope

- Any behavior change for the `openai` provider variant
- Replacing the provider repository architecture or adding new auth dependencies
- Storing OAuth token bundles in browser storage
- Introducing generic OAuth abstractions for non-Codex providers
- Removing historical documentation/specs

## Functional Requirements

### FR1: Manual start flow for `openai-codex`
- Selecting `openai-codex` in `frontend/src/pages/ModelProviders.tsx` MUST present a manual sign-in UX instead of immediately redirecting the current browser tab.
- Starting the flow MUST call the existing frontend hook/API layer, not `fetch` directly from the component.
- `POST /api/providers/openai-codex/oauth/sessions` MUST remain the start endpoint.
- The start endpoint MUST continue creating a backend-owned OAuth session with server-generated `state`, server-generated PKCE verifier/challenge, TTL, and backend-controlled redirect URI.
- The start endpoint response MUST include the authorization URL and enough metadata for the frontend to show manual instructions.

### FR2: Manual completion input
- The application MUST allow the user to finish sign-in by pasting either:
  1. the full returned callback URL, or
  2. the `code` and `state` values separately.
- `POST /api/providers/openai-codex/oauth/complete` MUST remain the completion endpoint.
- The completion endpoint MUST accept a manual-completion payload that supports both input modes above.
- The completion endpoint MUST NOT require the browser to send back `code_verifier`, `refresh_token`, access token data, or a browser-owned redirect URI.

### FR3: Existing callback page becomes a manual helper, not an auto-completer
- `frontend/src/pages/OAuthCallbackHandler.tsx` MUST stop auto-posting the callback to the backend.
- The callback page MUST read the returned query parameters and render a user-facing helper screen that:
  - confirms the redirect was received,
  - shows the full returned URL and extracted `code` / `state` values,
  - instructs the user to copy one of those formats back into the provider screen, and
  - shows friendly failure text when the callback contains `error` or is missing required values.
- The callback page MUST NOT perform token exchange itself.

### FR4: Server-side session ownership and guardrails
- The backend MUST remain the owner of OAuth session state, PKCE verifier, redirect URI, and token exchange.
- Completion MUST look up the session using the server-stored state hash and MUST use the stored redirect URI and stored PKCE verifier for token exchange.
- The completion endpoint MUST reject attempts to override redirect URI from the browser.
- OAuth sessions MUST remain one-time use.
- OAuth sessions MUST expire after a bounded TTL and expired sessions MUST be purged before completion.
- Replay attempts MUST be rejected before a second token exchange can begin.

### FR5: `openai` stays separate from `openai-codex`
- No route, UI, or validation change for the plain `openai` API-key provider may be coupled into this work.
- The frontend MUST continue describing `openai` as API-key based and `openai-codex` as the separate sign-in variant.

### FR6: Validation and error handling
- The backend MUST validate manual completion payloads and return user-friendly 4xx errors for:
  - missing callback URL,
  - invalid callback URL format,
  - missing authorization code,
  - missing OAuth state,
  - expired or unknown session,
  - already-consumed session,
  - invalid provider variant,
  - `missing_codex_entitlement`, and
  - token exchange failures.
- The frontend MUST surface these errors without exposing raw token data.
- Components MUST continue to use the hook/API layer; no direct `fetch` in page components.

### FR7: Browser data handling
- The stored provider token bundle MUST continue to stay server-side only and MUST NOT be included in provider create/list responses.
- The frontend MUST NOT persist OAuth token bundles in browser state or storage.
- The frontend SHOULD avoid persisting pasted callback URL, `code`, or `state` beyond transient component state unless required for current-page UX.

### FR8: Configuration requirement
- `OPENAI_CODEX_WEB_CLIENT_ID` MUST remain required for `openai-codex` in this design.
- Rationale: this manual flow still uses the repository’s existing BYO OAuth client model and existing `/oauth/callback` redirect shape; only the user interaction changes from automatic completion to manual completion.
- The implementation MUST NOT claim that the manual flow removes the client-ID requirement unless a different OAuth client strategy is explicitly implemented in design and code, which is out of scope for this spec.

### FR9: Documentation updates for the new implemented behavior
- Support docs for OpenAI Codex MUST be updated to describe the new manual completion behavior once implemented.
- Documentation MUST clearly state that the repository still uses a BYO OAuth client via `OPENAI_CODEX_WEB_CLIENT_ID`, but now completes authentication through a manual/headless-style copy-return UX.

## Non-Functional Requirements

### NFR1: Architecture fit
- The implementation MUST reuse the current provider repository interfaces and memory/Postgres repository implementations rather than introducing a new session store.
- The implementation MUST stay within the current providers module layout under `core/kernel/src/modules/providers/`.
- The frontend MUST keep API calls in `frontend/src/api/kernel.ts` and React Query hooks in `frontend/src/hooks/useProviders.ts`.

### NFR2: Security
- State validation MUST be server-side.
- PKCE verifier generation and storage MUST remain server-side.
- Manual completion MUST not rely on trusting browser-provided redirect URI.
- Browser-facing responses MUST remain sanitized so `apiKeyEnc` is never exposed.

### NFR3: Test coverage
- Backend route tests MUST cover start, completion by callback URL, completion by `code` + `state`, expiry, replay rejection, invalid input, and friendly entitlement errors.
- Frontend tests MUST cover the manual start UX, callback helper rendering, and manual completion submission through hooks.

### NFR4: Task quality
- `tasks.md` MUST contain ordered, actionable tasks.
- All tasks MUST begin unchecked.
- Tasks MUST separate backend, frontend, docs, and verification work.

## Acceptance Criteria

1. `.kiro/specs/openai-codex-manual-auth-flow/requirements.md`, `design.md`, and `tasks.md` exist.
2. The spec preserves the current repository separation between `openai` and `openai-codex`.
3. The design keeps `POST /api/providers/openai-codex/oauth/sessions` and `POST /api/providers/openai-codex/oauth/complete` as the implementation endpoints.
4. The design changes `openai-codex` completion to a manual paste-back flow and removes auto-completion from `OAuthCallbackHandler.tsx`.
5. The design keeps PKCE, state, redirect URI ownership, TTL, and one-time session enforcement on the server.
6. The design explicitly states that `OPENAI_CODEX_WEB_CLIENT_ID` remains required.
7. The design identifies the exact backend files, frontend files, docs, and tests likely to be touched.
8. The tasks are ordered, actionable, and all start unchecked.

# Requirements: OpenAI Codex Backend Hardening

## Problem

The current `openai-codex` flow still exposes browser-owned OAuth concerns that should be owned by the backend for this repo's web callback architecture.

`docs/suporte/logincodex.md` and the recent review findings point to the same hardening gaps:

1. OAuth session bootstrap is not backend-owned end to end.
2. `state` and PKCE validation are not backed by a server-side session with TTL and one-time use semantics.
3. Redirect and callback validation is too permissive for a security-sensitive flow.
4. `ModelProviders.tsx` still performs a direct `fetch(...)` instead of using the frontend API/hook layer.
5. The browser can currently send a `refreshToken` back to the backend, which is explicitly out of bounds for this flow.
6. `openai` and `openai-codex` must remain separate provider variants with different auth rules.

This spec hardens only the `openai-codex` sign-in variant. Generic `openai` remains API-key only.

## Acceptance Criteria

### AC1: Backend-Assisted OAuth Session Creation
- The `openai-codex` sign-in start flow MUST begin with a backend endpoint under `/api/providers`.
- The backend MUST generate the OAuth `state`, PKCE verifier/challenge, redirect URI, expiration, and authorize URL.
- The frontend MUST start the flow through `frontend/src/api/kernel.ts` and hooks in `frontend/src/hooks/`, not by building the authorize URL directly inside the React page.
- The start response MUST return only non-secret data needed by the browser, such as `authUrl` and `expiresAt`.

### AC2: Server-Side State and PKCE Session Validation
- The backend MUST persist an OAuth session record for `openai-codex` before redirecting the browser.
- The session record MUST include enough server-side data to validate `state`, PKCE, redirect URI, provider variant, expiration, and one-time use.
- Each session MUST have a short TTL.
- Each session MUST be consumable exactly once.
- Expired, missing, reused, or mismatched sessions MUST be rejected before token exchange.

### AC3: Explicit Redirect and Callback Guardrails
- The backend MUST validate that the callback flow is only used for `openai-codex`.
- The backend MUST reject callback completion when `code` or `state` is missing.
- The backend MUST validate the redirect URI against the repo's browser callback path `/oauth/callback`.
- The backend MUST not accept loopback/CLI callback assumptions for this repo.
- The frontend callback handler MUST refuse to continue if the stored provider variant is not `openai-codex`.

### AC4: No Direct Fetch in React Components
- `frontend/src/pages/ModelProviders.tsx` MUST NOT call `fetch(...)` directly for the Codex OAuth flow.
- The page MUST use frontend API helpers in `frontend/src/api/kernel.ts` and hooks in `frontend/src/hooks/useProviders.ts` or an equivalent existing hooks file.
- The callback page MUST also use the frontend API/helper layer for backend completion.

### AC5: Frontend Never Sends a Refresh Token
- No frontend request body for `openai-codex` MAY include `refreshToken`.
- No public browser flow MAY require the browser to read, store, or resend `refresh_token`, `access_token`, or `id_token`.
- Frontend response types for `openai-codex` completion MUST NOT expose refresh tokens back to the UI.

### AC6: Backend-Managed Refresh Uses Stored Secret Only
- The backend MUST store the `openai-codex` token bundle server-side only.
- Any refresh behavior MUST load the stored refresh token from backend persistence.
- If a refresh route remains for support or runtime use, it MUST identify the provider/session server-side and MUST NOT accept a raw refresh token from the caller.
- Refresh token rotation MUST update the stored secret atomically when OpenAI returns a replacement refresh token.

### AC7: Preserve Variant Separation
- Generic `openai` MUST remain API-key only.
- `openai-codex` MUST remain a separate sign-in variant.
- No requirement, route, config name, or UI copy in this feature may blur the two variants.

### AC8: User-Friendly OAuth Error Handling
- The backend MUST map known OAuth failures to clear user-facing errors.
- At minimum, the flow MUST handle:
  - invalid or expired OAuth session
  - reused session/state mismatch
  - missing authorization code
  - upstream token exchange failure
  - `missing_codex_entitlement`
- The frontend MUST display these errors without exposing secrets or raw token payloads.

### AC9: Existing Provider Behavior Stays Compatible
- Existing API-key creation for generic `openai` MUST continue to work.
- Existing non-Codex providers MUST not require OAuth-session changes.
- The `openai-codex` provider MUST still be created as `type: 'openai-codex'` and named with a distinct Codex variant identity.

### AC10: Verification Is Part of the Change
- Verification tasks MUST cover backend session creation, server-side session consumption, callback guardrails, frontend hook usage, refresh-token ownership rules, and variant separation.
- Verification MUST include both repository modes used by this module: in-memory and PostgreSQL-backed behavior where applicable.
- Verification MUST include TypeScript compilation for backend and frontend.

## Constraints

- No application code is changed by this spec itself.
- No new dependency may be introduced unless it already exists in the repo.
- Backend work must stay inside the existing Fastify/providers architecture under `core/kernel/src/modules/providers/`.
- Frontend work must stay inside the existing React Query + `api/kernel.ts` pattern.
- Sensitive values (`code`, PKCE verifier, access token, refresh token, id token) must never become browser-owned data beyond the authorization `code` and `state` returned in the callback URL.

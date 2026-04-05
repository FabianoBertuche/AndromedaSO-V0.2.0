# Tasks: OpenAI Codex Backend Hardening

- [x] 1. Extend the providers backend persistence layer for server-side Codex OAuth sessions.
  - Add the OAuth-session model and repository methods in `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`.
  - Implement the new session storage methods in both `provider.repository.memory.ts` and `provider.repository.postgres.ts`.
  - Add PostgreSQL initialization for the OAuth-session table and indexes needed for TTL lookup and one-time-use validation.

- [x] 2. Implement backend-assisted Codex OAuth session creation in `core/kernel/src/modules/providers/routes/providerRoutes.ts`.
  - Add `POST /api/providers/openai-codex/oauth/sessions`.
  - Generate `state`, PKCE verifier/challenge, `redirectUri`, expiration, and `authUrl` on the server.
  - Persist the session with TTL and provider-variant metadata.

- [x] 3. Replace the current Codex callback completion contract with server-side session validation.
  - Update the completion route to accept only `code`, `state`, and `redirectUri`.
  - Validate session existence, TTL, one-time use, callback path, redirect URI, and provider variant before token exchange.
  - Mark the session as consumed only on the successful completion path.

- [x] 4. Remove browser-owned refresh-token behavior from the backend contract.
  - Eliminate any public backend request shape that accepts `refreshToken` from the frontend.
  - Update refresh logic so it loads the stored secret from `apiKeyEnc` server-side only.
  - Preserve `openai-codex` provider creation and sync behavior after successful exchange.

- [x] 5. Harden OAuth error handling and guardrails in the backend.
  - Map invalid session, expired session, reused session, missing code/state, token-exchange failure, and `missing_codex_entitlement` to user-friendly errors.
  - Ensure logs redact all OAuth secrets and artifacts.
  - Keep generic `openai` out of the Codex OAuth route surface.

- [x] 6. Update frontend API contracts in `frontend/src/api/kernel.ts`.
  - Add the start-session helper for `openai-codex`.
  - Update the completion helper to use `code`, `state`, and `redirectUri` only.
  - Remove or rewrite any frontend refresh helper so it never accepts `refreshToken`.

- [x] 7. Move Codex OAuth browser flows to the frontend hook layer.
  - Add React Query mutations in `frontend/src/hooks/useProviders.ts` for session creation and callback completion.
  - Keep the implementation aligned with the existing providers query invalidation pattern.

- [x] 8. Refactor `frontend/src/pages/ModelProviders.tsx` to use the API/hook layer only.
  - Remove the direct `fetch(...)` call for Codex configuration/start.
  - Stop storing PKCE verifier in `sessionStorage`.
  - Start the flow through the backend-created `authUrl` while keeping `openai` as API-key only and `openai-codex` as sign-in only.

- [x] 9. Refactor `frontend/src/pages/OAuthCallbackHandler.tsx` for backend-validated completion.
  - Keep only `code`, `state`, and provider-variant guardrails in the browser.
  - Complete the flow through the new frontend hook/API helper.
  - Preserve friendly error rendering and success navigation to `/?tab=models`.

- [x] 10. Add verification coverage for the hardened flow.
  - Add backend tests for session creation, expiration, one-time use, callback guardrails, and refresh-token ownership.
  - Add frontend tests proving no direct component fetch remains for Codex OAuth and no refresh token is sent from the browser.
  - Verify generic `openai` still works as API-key only and `openai-codex` remains the separate sign-in variant.

- [x] 11. Run mandatory verification before closing the change.
  - Run backend TypeScript compilation: `cd core/kernel && npx tsc --noEmit`.
  - Run frontend TypeScript compilation: `cd frontend && npx tsc --noEmit`.
  - Run the targeted backend/frontend tests added for this spec.

# Tasks: OpenAI Codex Manual Authentication Flow

## 1. Update backend session ownership and manual completion contracts
- [x] Update `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts` so `claimOAuthSessionByStateHash` no longer accepts a browser-provided `redirectUri`.
- [x] Update `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts` to claim sessions by `stateHash + providerType`, enforce expiry/one-time use, and mark the session consumed atomically.
- [x] Update `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts` to match the new claim signature and consume the row atomically without trusting a request `redirectUri`.
- [x] Verify repository tests cover the new claim behavior in both memory and Postgres implementations.
- [x] Verify: `cd core/kernel && npx tsc --noEmit`

## 2. Update backend OpenAI Codex routes for manual auth
- [x] Update `core/kernel/src/modules/providers/routes/providerRoutes.ts` so `POST /api/providers/openai-codex/oauth/sessions` returns `authUrl`, `expiresAt`, `redirectUri`, and `mode: 'manual'`.
- [x] Replace the completion request parser so `POST /api/providers/openai-codex/oauth/complete` accepts either `{ callbackUrl }` or `{ code, state }`.
- [x] Add callback-URL parsing that extracts `code`, `state`, `error`, and `error_description` and maps friendly OAuth errors.
- [x] Change completion flow to use the claimed session’s stored `redirectUri` and `codeVerifier` for token exchange.
- [x] Keep `OPENAI_CODEX_WEB_CLIENT_ID` as the required client ID source and preserve the existing `openai` provider behavior unchanged.
- [x] Verify: `cd core/kernel && npx tsc --noEmit`

## 3. Expand backend route test coverage
- [x] Update `core/kernel/src/modules/providers/routes/__tests__/providerRoutes.oauth.test.ts` for the new start-session response contract.
- [x] Add a test that completes sign-in with a pasted `callbackUrl`.
- [x] Add a test that completes sign-in with pasted `code` and `state`.
- [x] Add tests for malformed callback URL, missing `code`, missing `state`, expired session, and replay rejection.
- [x] Add coverage for friendly `missing_codex_entitlement` handling from both callback error params and token endpoint responses.
- [x] Keep assertions that provider responses never expose `apiKeyEnc`.
- [x] Verify: `cd core/kernel && npm run test -- providerRoutes.oauth.test.ts`

## 4. Update frontend API and hook contracts
- [x] Update `frontend/src/api/kernel.ts` types and functions for the new manual session response and manual completion request union.
- [x] Keep all provider API calls inside `frontend/src/api/kernel.ts`.
- [x] Update `frontend/src/hooks/useProviders.ts` so the existing Codex mutations continue to wrap the updated API functions.
- [x] Verify: `cd frontend && npx tsc --noEmit`

## 5. Replace automatic frontend callback completion with manual UX
- [x] Update `frontend/src/pages/ModelProviders.tsx` so starting `openai-codex` sign-in creates a pending manual session instead of redirecting the current page automatically.
- [x] Add guided manual-auth UI in `ModelProviders.tsx` with auth-link instructions, redirect URI display, callback URL textarea, `code` input, `state` input, submit action, and reset action.
- [x] Ensure the component completes auth only through the existing hook layer and never uses direct `fetch`.
- [x] Keep the plain `openai` API-key form flow unchanged.
- [x] Verify: `cd frontend && npx tsc --noEmit`

## 6. Turn the callback page into a copy-helper screen
- [x] Update `frontend/src/pages/OAuthCallbackHandler.tsx` so it no longer posts to `/api/providers/openai-codex/oauth/complete` automatically.
- [x] Render a success helper view that shows the full returned URL plus extracted `code` and `state`.
- [x] Render friendly failure states for OAuth errors, missing values, and `missing_codex_entitlement`.
- [x] Keep the route registration in `frontend/src/App.tsx` unchanged unless TypeScript requires minimal route-related adjustments.
- [x] Verify: `cd frontend && npx tsc --noEmit`

## 7. Expand frontend test coverage
- [x] Update `frontend/src/pages/__tests__/codexOAuthFlow.test.tsx` for the manual start flow and non-redirecting provider-page behavior.
- [x] Add callback-helper assertions for success rendering with copyable callback data.
- [x] Add callback-helper assertions for missing-state and OAuth-error messages.
- [x] Add provider-page completion assertions for `{ callbackUrl }` submission.
- [x] Add provider-page completion assertions for `{ code, state }` fallback submission.
- [x] Verify: `cd frontend && npm run test -- codexOAuthFlow.test.tsx`

## 8. Update support documentation for the implemented manual flow
- [x] Update `docs/suporte/openai-codex-setup.md` to describe the manual link/copy-return completion flow.
- [x] Update `docs/suporte/openai-codex-auth-status.md` to state that the implemented repo behavior is now manual/headless-style while still requiring `OPENAI_CODEX_WEB_CLIENT_ID`.
- [x] Update `docs/local-dev.md` so local setup instructions mention the callback helper page and paste-back completion step.

## 9. Final verification
- [x] Verify backend compile: `cd core/kernel && npx tsc --noEmit`
- [x] Verify frontend compile: `cd frontend && npx tsc --noEmit`
- [x] Verify backend tests covering providers OAuth/manual flow pass.
- [x] Verify frontend tests covering Codex manual auth flow pass.

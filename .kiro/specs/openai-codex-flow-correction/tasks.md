# Tasks: OpenAI Codex OAuth Flow Correction

## Task 1: Create spec files
- [x] Create `.kiro/specs/openai-codex-flow-correction/requirements.md`
- [x] Create `.kiro/specs/openai-codex-flow-correction/design.md`
- [x] Create `.kiro/specs/openai-codex-flow-correction/tasks.md`

## Task 2: Fix token endpoint in backend
- [x] Change `https://auth0.openai.com/oauth/token` → `https://auth.openai.com/oauth/token` in `core/kernel/src/modules/providers/routes/providerRoutes.ts`

## Task 3: Fix OAuth scopes in frontend
- [x] Change `OPENAI_CODEX_SCOPE` in `frontend/src/pages/ModelProviders.tsx` to include `api.connectors.read api.connectors.invoke`

## Task 4: Implement JWT decoding and token response handling in backend
- [x] Add `OpenAiCodexTokenResponse` type
- [x] Add `decodeJwtPayload()` helper function
- [x] Add `extractEmailFromIdToken()` helper function
- [x] Modify `exchangeOpenAiCodexAuthorizationCode()` to return full token response instead of just access_token

## Task 5: Handle `missing_codex_entitlement` error in backend
- [x] Add error detection in `exchangeOpenAiCodexAuthorizationCode()` for `access_denied` + `missing_codex_entitlement`
- [x] Return user-friendly message with status 403

## Task 6: Update provider creation to use email-based name and store all tokens
- [x] Decode id_token to extract email in the exchange handler
- [x] Create provider with name `openai-codex:<email>`
- [x] Store tokens as JSON string in apiKey field

## Task 7: Add refresh token endpoint in backend
- [x] Add `POST /oauth/openai-codex/refresh` route
- [x] Implement refresh token exchange with `https://auth.openai.com/oauth/token`
- [x] Update provider's stored tokens with new values

## Task 8: Update frontend API types
- [x] Update `CompleteOpenAiCodexOAuthResponse` to include optional `refreshToken` and `idToken`
- [x] Add `RefreshOpenAiCodexTokenRequest` and `RefreshOpenAiCodexTokenResponse` types
- [x] Add `refreshOpenAiCodexToken()` function

## Task 9: Verify compilation
- [x] Backend: `cd core/kernel && npx tsc --noEmit` — PASS
- [x] Frontend: `cd frontend && npx tsc --noEmit` — PASS

# Tasks: OpenAI Codex Hardcoded Client ID

## Task 1: Update backend providerRoutes.ts
- [x] Add `OPENAI_CODEX_CLIENT_ID = 'app_EMoamEEZ7brann'` constant
- [x] Remove `OpenAiCodexWebClientConfig` type
- [x] Remove `parseConfiguredOrigins()` function
- [x] Remove `getOpenAiCodexWebClientConfig()` function
- [x] Remove `OPENAI_CODEX_CONFIG_REQUIRED_MESSAGE` constant
- [x] Simplify `buildOpenAiCodexOAuthConfigResponse()` to always return ready with hardcoded client ID
- [x] Simplify `parseOpenAiCodexExchangeRequest()` to remove origin validation
- [x] Update `exchangeOpenAiCodexAuthorizationCode()` to use hardcoded client ID
- [x] Verify: `cd core/kernel && npx tsc --noEmit` — PASS

## Task 2: Update frontend ModelProviders.tsx
- [x] Add `OPENAI_CODEX_CLIENT_ID` and `OPENAI_CODEX_CALLBACK_PATH` constants
- [x] Remove `fetchOpenAiCodexOAuthConfig` import
- [x] Remove `openAiCodexOAuthConfigQuery`, `openAiCodexOAuthConfig`, `openAiCodexOAuthMessage`, `canStartOpenAiCodexFlow`
- [x] Simplify `startOpenAiCodexFlow()` to use hardcoded client ID and dynamic redirect URI
- [x] Remove loading state JSX for "Checking OpenAI Codex web OAuth configuration..."
- [x] Remove error message JSX block
- [x] Remove `disabled={!canStartOpenAiCodexFlow}` from sign-in button
- [x] Verify: `cd frontend && npx tsc --noEmit` — PASS

## Task 3: Update kernel.ts
- [x] Remove `fetchOpenAiCodexOAuthConfig()` function
- [x] Remove `OpenAiCodexOAuthConfigResponse` type
- [x] Verify: `cd frontend && npx tsc --noEmit` — PASS

## Task 4: Update .env.example files
- [x] Remove `OPENAI_CODEX_WEB_CLIENT_ID` and `OPENAI_CODEX_ALLOWED_ORIGINS` from `core/kernel/.env.example`
- [x] Add comment about hardcoded client ID
- [x] Remove `VITE_OPENAI_CODEX_WEB_CLIENT_ID` and `VITE_OPENAI_CODEX_ALLOWED_ORIGINS` from `frontend/.env.example`
- [x] Add comment about hardcoded client ID

## Task 5: Final verification
- [x] Backend: `cd core/kernel && npx tsc --noEmit` — PASS
- [x] Frontend: `cd frontend && npx tsc --noEmit` — PASS

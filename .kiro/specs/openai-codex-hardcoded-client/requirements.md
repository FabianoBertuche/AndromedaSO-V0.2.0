# Requirements: OpenAI Codex Hardcoded Client ID

## Problem
The "Sign in with OpenAI Codex" button is blocked with the error: "OPENAI_CODEX_WEB_CLIENT_ID is required for openai-codex web OAuth."

The current code requires environment variables `OPENAI_CODEX_WEB_CLIENT_ID` and `OPENAI_CODEX_ALLOWED_ORIGINS` to be set. However, the reference implementation (openclaw/openclaw) uses a **hardcoded official OpenAI client ID** (`app_EMoamEEZ7brann`) — no environment variables are needed.

## Goal
Remove the dependency on environment variables for OpenAI Codex OAuth by using the official hardcoded client ID, matching the behavior of the reference implementation.

## Functional Requirements

### FR1: Backend OAuth config endpoint always returns ready
- `GET /api/providers/oauth/openai-codex/config` must always return `ready: true` with the hardcoded client ID
- No environment variables should be required for this endpoint to work

### FR2: Backend token exchange uses hardcoded client ID
- `POST /api/providers/oauth/openai-codex/exchange` must use the hardcoded client ID for token exchange
- Origin validation should be simplified to only validate the redirect URI path is `/oauth/callback`

### FR3: Frontend button always enabled
- The "Sign in with OpenAI Codex" button must always be enabled when `providerType === 'openai-codex'`
- No loading state for "Checking OpenAI Codex web OAuth configuration..."
- No error message when config is unavailable

### FR4: Environment variable files updated
- Remove `OPENAI_CODEX_WEB_CLIENT_ID` and `OPENAI_CODEX_ALLOWED_ORIGINS` from `core/kernel/.env.example`
- Remove `VITE_OPENAI_CODEX_WEB_CLIENT_ID` and `VITE_OPENAI_CODEX_ALLOWED_ORIGINS` from `frontend/.env.example`
- Add comment explaining the client ID is hardcoded (official OpenAI)

## Non-Functional Requirements

### NFR1: No breaking changes to API contracts
- The response shape of `GET /api/providers/oauth/openai-codex/config` remains the same
- The request/response shape of `POST /api/providers/oauth/openai-codex/exchange` remains the same

### NFR2: TypeScript compilation
- Both backend and frontend must compile without errors after changes

## Acceptance Criteria

1. ✅ `GET /api/providers/oauth/openai-codex/config` returns `ready: true` without any env vars
2. ✅ "Sign in with OpenAI Codex" button is always enabled when openai-codex provider is selected
3. ✅ No "Checking OpenAI Codex web OAuth configuration..." loading message
4. ✅ No environment variables required for OpenAI Codex OAuth flow
5. ✅ Backend `npx tsc --noEmit` passes
6. ✅ Frontend `npx tsc --noEmit` passes

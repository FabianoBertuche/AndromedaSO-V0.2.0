## Why

The backend API's POST /api/providers endpoint incorrectly prevents creating multiple providers of different types, causing the frontend "models not working" error. Users cannot add new AI providers (Ollama, Azure OpenAI, etc.) because the endpoint erroneously returns "Provider already exists" even when no provider of that type exists. Additionally, TypeScript errors in the test file need resolution to maintain code quality.

## What Changes

- **Fix POST /api/providers logic**: Update the provider creation endpoint to correctly check for duplicate providers by unique identifier (name + type combination) rather than blocking all creation when any provider exists
- **Fix TypeScript errors**: Resolve the 7 TypeScript compilation errors in `lifecycleOrchestrator.test.ts`
- **Optional**: Address browser cache issues (CORS headers, React Query cache invalidation)

## Capabilities

### New Capabilities
<!-- No new capabilities being introduced - this is a bug fix -->

### Modified Capabilities
- `provider-management`: The provider creation logic needs correction to allow multiple providers of different types while preventing true duplicates (same name + type)

## Impact

**Affected Code:**
- `core/kernel/src/routes/providers/index.ts` - POST endpoint logic
- `core/kernel/src/tests/unit/lifecycleOrchestrator.test.ts` - TypeScript errors

**Affected APIs:**
- POST /api/providers - will now correctly allow multiple providers of different types

**No Breaking Changes:**
- GET /api/providers, DELETE /api/providers, POST /api/providers/sync, GET /api/providers/catalog are all working correctly
- Frontend is already correctly implemented and compiles without errors

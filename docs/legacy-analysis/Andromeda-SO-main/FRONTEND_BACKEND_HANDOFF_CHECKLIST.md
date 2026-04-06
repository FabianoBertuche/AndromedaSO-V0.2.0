# Frontend / Backend Handoff Checklist

## Current state

- Frontend runs on `http://127.0.0.1:5173`
- API runs on `http://127.0.0.1:5000`
- API build passes in `packages/api`
- Full frontend E2E passes in `apps/web`
- Gateway chat returns real responses again
- Knowledge is wired to backend and loading real data
- Agents screen no longer bursts into `429` on initial load

## What was fixed

### 1. Knowledge integration

- Added `/api/knowledge` proxy in `apps/web/vite.config.ts`
- Mounted `knowledgeRouter` in `packages/api/src/app.ts`
- Fixed knowledge controller/use case tenant flow and delete route
- Reworked `apps/web/src/components/knowledge/KnowledgeView.tsx` to use the real API

## 2. Chat/gateway timeout

- Increased provider timeout in dev in `packages/api/src/infrastructure/resilience/CircuitBreakerFactory.ts`
- Disabled Ollama thinking mode in `packages/api/src/infrastructure/execution/LLMExecutionStrategy.ts`
- Result: gateway tasks now complete instead of failing with timeout

## 3. Agents loading / rate limiting

- Made rate limit configurable and less aggressive in dev in `packages/api/src/shared/middleware/rate-limit.middleware.ts`
- Changed `apps/web/src/components/agents/AgentManagementView.tsx` to load details lazily by tab

## 4. API build cleanup

- Fixed TypeScript issues in memory, communication, prisma soft-delete, and knowledge policy persistence
- Added `packages/api/tsconfig.json` so the API build is scoped correctly

## 5. E2E stabilization

- Updated E2E tests to use the real API port `5000`
- Updated fragile selectors to avoid duplicate `main`/button matches
- Full run passes with:

```bash
npx playwright test --trace=off --reporter=line
```

## Final validation

- API build:

```bash
npm run build
```

- Frontend E2E:

```bash
npx playwright test --trace=off --reporter=line
```

## Main files changed

- `packages/api/src/app.ts`
- `packages/api/src/infrastructure/execution/LLMExecutionStrategy.ts`
- `packages/api/src/infrastructure/resilience/CircuitBreakerFactory.ts`
- `packages/api/src/shared/middleware/rate-limit.middleware.ts`
- `packages/api/src/modules/knowledge/interfaces/http/KnowledgeController.ts`
- `packages/api/src/modules/knowledge/interfaces/http/knowledge.routes.ts`
- `packages/api/src/modules/memory/application/MemoryService.ts`
- `apps/web/src/components/knowledge/KnowledgeView.tsx`
- `apps/web/src/components/agents/AgentManagementView.tsx`
- `apps/web/e2e/console-real.spec.ts`
- `apps/web/e2e/integration.spec.ts`
- `apps/web/e2e/navigation.spec.ts`

## If work continues later

- Keep `apps/web/test-results/` out of commits
- If Playwright artifact writing flakes again, keep using `--trace=off`
- If local model latency changes, review `LLM_PROVIDER_TIMEOUT_MS`

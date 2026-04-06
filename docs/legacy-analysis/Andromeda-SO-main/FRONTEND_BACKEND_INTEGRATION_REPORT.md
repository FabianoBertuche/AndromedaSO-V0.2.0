# Frontend / Backend Integration Report

Date: 2026-03-20

## Final status

- Frontend is available at `http://127.0.0.1:5173`
- API is available at `http://127.0.0.1:5000`
- API build passes in `packages/api`
- Full frontend E2E passes in `apps/web`
- Gateway status shows `Gateway Online`
- Agents, models, memory, timelines, and knowledge load from backend
- Chat task creation and execution both work
- Knowledge routing/proxy is fixed
- Agent detail loading no longer triggers the previous `429` burst on initial load

## Resolution summary

- wired `Knowledge` between Vite proxy, API router, controller, and frontend view
- changed gateway model execution to use `think: false`, which removed the long local-model stall
- raised the provider timeout for dev and made it configurable
- reduced initial request burst in the `Agents` UI by lazy-loading tab data
- fixed API TypeScript build issues in memory, communication, knowledge policy persistence, and Prisma extension glue
- stabilized E2E selectors and endpoint assumptions to match the real app

## Final validation

- API build command passed:

```bash
npm run build
```

- Full frontend E2E passed:

```bash
npx playwright test --trace=off --reporter=line
```

- Final E2E result: `35 passed`

## What was verified

### Working

- `GET /v1/agents` returns `200`
- `GET /v1/model-center/models` returns `200`
- `GET /v1/memory` returns `200`
- Sidebar can show `Gateway Online`
- Console loads agents and models into selectors
- Model Center view opens
- Memory view opens
- Timeline view opens

### Failing or partially broken

- Chat execution:
  - `POST /v1/gateway/message` returns success and creates a task
  - `GET /v1/gateway/tasks/:taskId/status` returns `failed`
  - observed error: `Timed out after 15000ms`
- Knowledge:
  - frontend calls `/api/knowledge/collections`
  - request returns `404`
  - UI logs JSON parse error because HTML error page is returned
- Agents detail area:
  - several requests return `429 Too Many Requests`
  - caused by aggressive global rate limit

## Root causes found

### 1. Wrong assumption in E2E tests

Some tests had been written against an outdated API port, while the app is configured for port `5000`.

Relevant files:

- `apps/web/src/lib/runtime-config.ts`
- `packages/api/src/index.ts`
- `apps/web/vite.config.ts`

Notes:

- frontend fallback API port is `5000`
- API server listens on `process.env.PORT || 5000`

### 2. Gateway/chat times out during execution

Observed flow:

- task creation works
- task processing starts
- final task status becomes `failed`
- error string is `Timed out after 15000ms`

Likely source:

- circuit breaker default timeout is `15000ms`

Relevant files:

- `packages/api/src/infrastructure/resilience/CircuitBreakerFactory.ts`
- `packages/api/src/infrastructure/adapters/providers/OllamaProviderAdapter.ts`
- `packages/api/src/infrastructure/execution/LLMExecutionStrategy.ts`
- `packages/api/src/modules/communication/interfaces/http/communication.routes.ts`

Important detail:

- task creation is OK, so the problem is deeper in model execution / provider response time, not in the HTTP gateway entrypoint itself.

### 3. Knowledge screen is disconnected from backend

Frontend code uses:

- `/api/knowledge/collections`
- `/api/knowledge/collections/:id/documents`

But current setup has these issues:

- `apps/web/vite.config.ts` has no `/api/knowledge` proxy
- `packages/api/src/app.ts` imports `knowledgeRouter` but does not mount it under `/v1`

Relevant files:

- `apps/web/src/components/knowledge/KnowledgeView.tsx`
- `apps/web/vite.config.ts`
- `packages/api/src/app.ts`
- `packages/api/src/modules/knowledge/interfaces/http/knowledge.routes.ts`

### 4. Agent details trigger `429 Too Many Requests`

Global API rate limiter is very strict:

- `windowMs: 1000`
- `max: 10`

The Agents view loads many resources in parallel and quickly exceeds that limit.

Relevant files:

- `packages/api/src/shared/middleware/rate-limit.middleware.ts`
- `apps/web/src/components/agents/AgentManagementView.tsx`

## Browser evidence observed

### Console logs seen in frontend

- `WebSocket connection ... failed: WebSocket is closed before the connection is established.`
- many `429 Too Many Requests` errors in agent detail requests
- `Failed to fetch collections SyntaxError: Unexpected token '<'` in Knowledge view

### UI behavior seen

- `Gateway Online` visible in sidebar
- user message appears in console chat
- assistant response area eventually shows timeout text instead of a real answer
- Knowledge page shell renders, but live data does not load

## Suggested fixes

### Fix A - Wire Knowledge to backend properly

Option 1: keep current frontend paths and add a Vite proxy.

Example in `apps/web/vite.config.ts`:

```ts
'/api/knowledge': {
  target: apiTarget,
  changeOrigin: true,
  rewrite: (p) => p.replace(/^\/api\/knowledge/, '/v1/knowledge'),
}
```

Also mount the router in `packages/api/src/app.ts`:

```ts
v1Router.use('/knowledge', authMiddleware, tenantMiddleware, knowledgeRouter);
```

Option 2: change frontend fetches to call `/knowledge/...` and proxy that path instead.

Suggested validation after fix:

- open Knowledge view
- verify collections load without console errors
- create a collection
- open documents tab for a selected collection

### Fix B - Investigate and reduce chat timeout

Start with the simplest check:

- identify which model/provider is being selected during execution
- verify whether the provider itself is slow or unavailable

Possible first mitigation:

Increase circuit breaker timeout in `packages/api/src/infrastructure/resilience/CircuitBreakerFactory.ts`.

Current:

```ts
timeout: config?.timeout || 15000
```

Example temporary change:

```ts
timeout: config?.timeout || 45000
```

Better long-term options:

- make timeout configurable per environment
- set different timeouts for local vs cloud models
- log chosen provider/model before execution
- log duration of provider calls

Suggested validation after fix:

- send a short prompt from Console
- verify task status becomes `completed`
- verify assistant message contains model output instead of timeout text

### Fix C - Reduce `429` errors in Agents view

Option 1: relax rate limiting in development.

Example in `packages/api/src/shared/middleware/rate-limit.middleware.ts`:

```ts
export const globalRateLimiter = rateLimit({
  windowMs: 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Option 2: reduce parallel requests in `AgentManagementView`.

Ideas:

- fetch only core profile first
- lazy load tabs when opened
- stagger background requests
- add retry for `429`

Suggested validation after fix:

- open Agents view
- inspect browser console
- confirm no `429` for profile / behavior / safeguards / conformance calls

### Fix D - Make E2E reflect real behavior

Current guidance:

- tests should use port `5000`
- tests should verify real API endpoints that actually respond
- do not rely only on `/v1/health` if it is slow or blocked by downstream checks
- tests should distinguish between:
  - base connectivity working
  - task execution working
  - feature not yet wired

Good examples:

- agents loaded from `/v1/agents`
- models loaded from `/v1/model-center/models`
- memory loaded from `/v1/memory`
- knowledge explicitly flagged as not wired yet
- chat flow expected to fail until timeout issue is fixed

## Recommended order to continue later

1. Fix Knowledge routing and proxy
2. Fix gateway/chat timeout
3. Relax or redesign agent detail loading to avoid `429`
4. Rerun focused E2E
5. Expand E2E only after backend-dependent flows are stable

## Useful manual checks

### API

```bash
node -e "fetch('http://127.0.0.1:5000/v1/agents',{headers:{Authorization:'Bearer andromeda_dev_web_token'}}).then(async r=>{console.log(r.status);console.log(await r.text())})"
```

```bash
node -e "fetch('http://127.0.0.1:5000/v1/model-center/models',{headers:{Authorization:'Bearer andromeda_dev_web_token'}}).then(async r=>{console.log(r.status);console.log(await r.text())})"
```

```bash
node -e "fetch('http://127.0.0.1:5000/v1/gateway/message',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer andromeda_dev_web_token'},body:JSON.stringify({channel:'web',session:{id:'session-manual'},content:{type:'text',text:'Reply with OK'},metadata:{activityType:'chat.general'}})}).then(async r=>{console.log(r.status);console.log(await r.text())})"
```

### Frontend

- Open `http://127.0.0.1:5173`
- Check sidebar status
- Open DevTools console
- Navigate: Console -> Agents -> Timeline -> Model Center -> Memory -> Knowledge
- Watch for `429`, `404`, JSON parse errors, and timeout text

## Files already touched during this investigation

- `apps/web/e2e/console-real.spec.ts`
- `apps/web/e2e/integration.spec.ts`
- `apps/web/e2e/homepage.spec.ts`

These test changes are diagnostic and may still need cleanup once the backend issues are fixed.

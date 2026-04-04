# Tech Stack

## Backend — `core/kernel`

- **Runtime**: Node.js 20, TypeScript 5.4 (ESNext modules, strict mode)
- **HTTP Framework**: Fastify 4.25
- **Validation**: Zod
- **ORM**: Drizzle ORM + drizzle-kit (migrations)
- **Database**: PostgreSQL 15 + pgvector
- **Cache**: Redis 7 via ioredis
- **Logging**: Pino (structured JSON logs, named loggers per module)
- **Metrics**: prom-client (Prometheus)
- **Config**: dotenv, Zod-validated environment via `validateEnvironment.ts`

## Frontend — `frontend/`

- **Framework**: React 18 + Vite 5
- **Styling**: TailwindCSS 3 + PostCSS
- **Data Fetching**: TanStack React Query 5
- **Charts**: Recharts
- **Flow Diagrams**: @xyflow/react

## Testing

- **Framework**: Vitest (both kernel and frontend)
- **HTTP Integration**: Supertest + Fastify `server.inject()`
- **Containers**: Testcontainers (for DB integration tests)
- **Frontend**: @testing-library/react + jsdom

## Linting / Formatting

- ESLint with `@typescript-eslint` (config at `core/kernel/.eslintrc.json`)
- Prettier (`.prettierignore` at root)
- Rule: `no-console: warn`, `@typescript-eslint/no-explicit-any: off`

## Path Aliases (kernel)

```json
"@core/*" → "src/*"
```

## Common Commands

### Infra (Docker — apenas PostgreSQL e Redis)

```bash
# Subir infraestrutura de desenvolvimento
docker-compose -f docker-compose.infra.yml up -d

# Parar infraestrutura
docker-compose -f docker-compose.infra.yml down

# Resetar banco (apaga dados)
docker-compose -f docker-compose.infra.yml down -v && docker-compose -f docker-compose.infra.yml up -d
```

### Kernel (`core/kernel/`)

```bash
npm run dev            # tsx --watch (hot-reload, desenvolvimento local)
npm run build          # tsc compile → dist/
npm run start          # auto-detect port and start
npm run start:local    # start on preferred ports 4010/4020/4030
npm run start:fixed    # tsx src/index.ts (no port negotiation)
npm run test           # vitest run (single pass)
npm run test:watch     # vitest watch mode
npm run lint           # eslint . --ext .ts
npm run migrate        # drizzle-kit migrate
npm run benchmark      # autocannon load test against /api/metrics
```

### Frontend (`frontend/`)

```bash
npm run dev            # auto-detect ports and start Vite dev server
npm run dev:fixed      # vite (fixed port)
npm run build          # tsc -b && vite build
npm run test           # vitest run (single pass)
npm run preview        # vite preview
```

### Root (orchestration)

```bash
node scripts/dev-all.mjs   # start all services concurrently
```

## Infrastructure

- Docker Compose: `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod)
- Each service has its own `Dockerfile`
- Env files: `.env.prod`, `.env.prod.example`, `core/kernel/.env.example`

# Project Structure

## Root Layout

```
/
├── core/kernel/        # Backend — main kernel service
├── frontend/           # Frontend — React dashboard
├── modules/            # Standalone module packages (e.g. providers)
├── scripts/            # Root-level dev orchestration scripts
├── specs/              # Legacy/external spec documents
├── docs/               # Architecture docs, benchmarks, deployment guides
├── .kiro/              # Kiro specs and steering files
├── .specify/           # Spec-kit templates, memory, and scripts
├── .gemini/            # Gemini CLI command definitions
├── docker-compose.yml          # Dev compose
└── docker-compose.prod.yml     # Prod compose
```

## Kernel (`core/kernel/src/`)

```
src/
├── index.ts                  # Entry point
├── server.ts                 # Fastify server factory (buildServer)
├── api/                      # HTTP route handlers (modules, evolution)
├── routes/                   # Additional routes (orchestrator)
├── config/                   # App config, safety thresholds, metrics, env validation
├── contracts/                # Zod schemas for manifests, lifecycle, module contracts
├── discovery/                # Filesystem module discovery (fsDiscovery)
├── registry/                 # In-memory registry + ModuleRegistryService (dual: memory + PG)
├── lifecycle/                # LifecycleOrchestrator, state machine, module loader
├── validation/               # Contract, dependency, and manifest validators
├── store/                    # Drizzle DB client, Redis client, postgresRegistry
├── evolution/                # Agent evolution/reputation service
├── plugins/                  # Fastify plugins (correlationId)
├── modules/providers/        # Providers domain module (routes, services, domain, infra)
│   ├── domain/
│   ├── infrastructure/
│   ├── routes/
│   ├── services/
│   └── __tests__/
├── services/orchestrator/    # Agent orchestration (AgentPool, MessageBus, TaskDecomposer, ConflictResolution, OrchestratorState)
└── __tests__/integration/    # Integration tests (HTTP routes, etc.)
```

## Kernel Modules (`core/kernel/modules/`)

Pluggable modules declared as YAML manifests. Organized by group and variant:

```
modules/
├── channels/
│   ├── telegram/module.manifest.yaml
│   └── whatsapp/module.manifest.yaml
├── providers/
│   ├── contracts/provider.contract.json
│   └── variants/
│       ├── ollama/
│       ├── openai-api/
│       └── openai-oauth/
└── llm-router/
```

### Module Manifest Fields

```yaml
id:           # unique module ID
name:         # display name
group:        # logical group (channels, providers)
variant:      # implementation variant
version:      # semver
entrypoint:   # path to adapter
contracts:    # input/output contract JSON paths
capabilities: # string list
status:       # active | inactive
critical:     # boolean — if true, failure halts kernel
dependencies: # list of module IDs
```

## Frontend (`frontend/src/`)

```
src/
├── App.tsx
├── main.tsx
├── api/          # API client functions
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Page-level components
├── types/        # TypeScript type definitions
└── test/         # Test setup and utilities
```

## Conventions

- Test files live in `__tests__/` subdirectories colocated with source, or in `src/test/` for frontend.
- Each kernel subsystem gets its own named Pino logger: `pino({ name: 'subsystemName' })`.
- All external I/O (DB, Redis) is abstracted behind `store/` — never import DB clients directly in business logic.
- Correlation IDs (`x-correlation-id`) are propagated on every request via the `correlationId` Fastify plugin.
- Environment variables are validated at startup via `validateEnvironment.ts`.
- Safety thresholds (registry size, etc.) are centralized in `config/safety.ts`.
- Agent profiles are loaded from `src/config/agentProfiles.json` with Zod validation and hardcoded fallback.
- Provider adapters use factory functions — never static singleton exports for production use.
- Benchmark results always include `simulated: true` — no real LLM inference is performed.

## Docker

- Development: only PostgreSQL and Redis run in Docker (`docker-compose.infra.yml`)
- Production: full stack in Docker (`docker-compose.prod.yml`)
- Kernel and frontend run locally with `npm run dev` (tsx --watch / vite)

## Documentation

- `docs/architecture.md` — system architecture overview
- `docs/implemented-features.md` — all implemented features with status
- `docs/local-dev.md` — local development setup guide
- `.kiro/specs/` — all feature specs (requirements + design + tasks)

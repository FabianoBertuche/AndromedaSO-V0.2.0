# Tasks: Core Kernel Integration

**Input**: specs/001-core-kernel-integration/plan.md, specs/001-core-kernel-integration/research.md, specs/001-core-kernel-integration/data-model.md, specs/001-core-kernel-integration/quickstart.md  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize core structure under `core/kernel` with directories: `src/{discovery,registry,validation,lifecycle,contracts,api,store,config}`, `tests/{unit,integration,e2e}` and runtime bootstrap files.
- [x] T002 Add workspace dependencies: TypeScript, Fastify, Zod, Drizzle ORM, pg, pgvector, ioredis, pino, yaml, Vitest, Supertest, Testcontainers.
- [x] T003 Configure TypeScript build, path aliases, linting baseline and Vitest test runner for `core/kernel`.
- [x] T004 Configure PostgreSQL connection, Drizzle migrations and base schema files for registry persistence.
- [x] T005 Configure Redis client and ephemeral runtime state support.
- [x] T006 Configure local developer environment with Docker Compose or Testcontainers support for PostgreSQL and Redis.

## Phase 2: Contracts and Test Foundations (Blocking Prerequisites)

- [x] T007 Define canonical Zod schema for `module.manifest.yaml` in `core/kernel/src/contracts/moduleManifest.schema.ts`.
- [x] T008 Define canonical Zod schema for module contracts and version compatibility rules in `core/kernel/src/contracts/moduleContract.schema.ts`.
- [x] T009 Define lifecycle state enum and allowed transitions in `core/kernel/src/contracts/lifecycle.schema.ts`.
- [x] T010 Define persistence model for `modules_registry` and `lifecycle_events` in Drizzle schema files.
- [x] T011 Write unit tests for manifest schema validation, required fields and invalid manifest rejection.
- [x] T012 Write unit tests for contract validation, version compatibility and circular dependency rejection.
- [x] T013 Write unit tests for lifecycle transition rules and invalid transition rejection.
- [x] T014 Write integration test harness for PostgreSQL registry persistence and Redis runtime cache.

## Phase 3: Foundational Runtime Services

- [x] T015 Implement YAML manifest parser and manifest validation adapter in `core/kernel/src/validation/manifestParser.ts`.
- [x] T016 Implement filesystem discovery service in `core/kernel/src/discovery/fsDiscovery.ts` reading module roots and locating `module.manifest.yaml`.
- [x] T017 Implement in-memory registry service in `core/kernel/src/registry/inMemoryRegistry.ts`.
- [x] T018 Implement PostgreSQL registry persistence adapter in `core/kernel/src/store/postgresRegistry.ts`.
- [x] T019 Implement lifecycle state machine service in `core/kernel/src/lifecycle/stateMachine.ts`.
- [x] T020 Implement dependency conflict and circular dependency validator in `core/kernel/src/validation/dependencyValidator.ts`.
- [x] T021 Write unit tests for discovery service, in-memory registry operations and persistence adapter behavior.

## Phase 4: User Story 1 — Module Discovery and Registration (P1)

- [x] T022 Write integration tests for discovery and registration acceptance scenarios from the spec.
- [x] T023 Implement discovery orchestration service in `core/kernel/src/discovery/discoverModules.ts` converting manifests into runtime `Module` entities.
- [x] T024 Implement registration orchestration service in `core/kernel/src/registry/moduleRegistry.ts` storing state in memory and PostgreSQL.
- [x] T025 Implement API endpoints `POST /api/modules/discover`, `GET /api/modules` and `GET /api/modules/:id`.
- [x] T026 Validate that only valid and enabled modules are registered automatically.

## Phase 5: User Story 2 — Module Validation and Loading (P2)

- [x] T027 Write integration tests for contract validation, incompatible variant rejection and invalid module rejection.
- [x] T028 Implement contract validator service in `core/kernel/src/validation/contractValidator.ts`.
- [x] T029 Implement validate-and-load workflow in `core/kernel/src/lifecycle/loadModule.ts`.
- [x] T030 Implement API endpoints `POST /api/modules/:id/validate` and `POST /api/modules/:id/load`.
- [x] T031 Enforce critical-module blocking rules when validation or loading fails.

## Phase 6: User Story 3 — Module Lifecycle Management (P3)

- [x] T032 Write end-to-end tests for lifecycle flow: discover → validate → load → initialize → start → stop.
- [x] T033 Implement lifecycle orchestration service for initialize, start, stop and failure handling.
- [x] T034 Implement API endpoints `POST /api/modules/:id/start`, `POST /api/modules/:id/stop`, `GET /api/modules/:id/status`.
- [x] T035 Persist lifecycle events to `lifecycle_events` table and synchronize runtime cache state.
- [x] T036 Add safeguards for timeouts, retry limits, explicit dev mode and prevention of implicit loops.

## Phase 7: User Story 4 — Coherent System Growth (P1)

- [x] T037 Write tests for adding a new module type via contracts without breaking existing modules.
- [x] T038 Implement core plugin extension interface in `core/kernel/src/contracts/corePluginInterface.ts`.
- [x] T039 Implement contract registration extension points for future module types.
- [x] T040 Validate retrocompatibility of the extension mechanism with existing module flows.

## Phase 8: Observability and Safety

- [x] T041 Implement structured logging with pino across discovery, registry, validation and lifecycle services.
- [x] T042 Implement metrics endpoint and runtime counters for registry size, lifecycle transitions and failed validations.
- [x] T043 Implement audit trail persistence for validation decisions and lifecycle transitions.
- [x] T044 Add detection and alerts for retry storms, slow startup and registry growth thresholds.

## Phase 9: Hardening and Documentation

- [x] T045 Write performance benchmark for discovery, validation and loading with 100 modules.
- [x] T046 Validate success criteria against benchmark results and record findings.
- [x] T047 Write/update feature documentation under `specs/001-core-kernel-integration/` and project docs referencing constitution, architecture decisions and quickstart.
- [x] T048 Review code and tests for forbidden circular dependencies and architectural drift.

## Dependencies & Execution Order

- Phase 1 must complete before all other phases.
- Phase 2 must complete before runtime services and user story implementation.
- Phase 3 must complete before user story phases.
- User Story phases can progress in order P1 → P2 → P3 → growth extension.
- Observability and hardening follow after core behavior is stable.
- TDD rule: for each capability, tests must be written before implementation tasks are considered complete.

## Parallel Execution Opportunities

- [P] T011, T012, T013 can run in parallel after T007–T010.
- [P] T017, T018, T019, T020 can run in parallel after Phase 2.
- [P] T041, T042, T043 can run in parallel after lifecycle services are stable.
- [P] T045 and T047 can run in parallel near the end.

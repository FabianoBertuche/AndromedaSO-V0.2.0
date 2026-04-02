# Implementation Plan: Core Kernel Integration

**Branch**: `001-core-kernel-integration` | **Date**: 2026-04-02 | **Spec**: specs/001-core-kernel-integration/spec.md
**Input**: Feature specification from `/specs/001-core-kernel-integration/spec.md`

## Summary

Estabelecer o `core/kernel` do Andromeda SO V0.2.0 como plataforma de integração modular. O núcleo deve suportar discovery de módulos por pasta, registro em memória e PostgreSQL, validação de contrato canônico com Zod, carregamento/boot e ciclo de vida de módulo (discovered → registered → validated → loaded → initialized → running → stopped → failed). Prioridades iniciais: discovery/registry (P1), validação/carregamento (P2), ciclo de vida e evolução sistêmica (P3).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+)
**Primary Dependencies**: Fastify, Zod, Drizzle ORM, pg, pgvector, ioredis, pino
**Storage**: PostgreSQL (primary persistência de registro), Redis (cache efêmero + filas curtas), local filesystem (module discovery)
**Testing**: Vitest + Supertest (API) + Testcontainers (PostgreSQL/Redis)
**Target Platform**: Linux containerizado / Kubernetes; local dev com Docker Compose
**Project Type**: Framework de execução (core/kernel agente modular)
**Performance Goals**: discovery + registro 10 módulos <5s; carregamento <2s por módulo; gestor de ciclo de vida >100 módulos simultâneos estáveis
**Constraints**: validar e bloquear circularidade de dependências; proibir loops implícitos; dev mode explícito; arquitetura deve crescer por contrato e não por patches.
**Scale/Scope**: 100+ módulos por instância, 10+ grupos, variantes por evolução vertical

## Constitution Check

*GATE: Passado* (conformidade com constituição v0.2.0 definida em `memory/constitution.md`): Spec-first, contract-driven, modular, core/kernel como centro de integração.

## Project Structure

### Documentação (esta feature)

```
specs/001-core-kernel-integration/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Código (repositório)

```
core/
  kernel/
    src/
      discovery/
      registry/
      validation/
      lifecycle/
      contracts/
      api/
      store/
      config/
    tests/
      unit/
      integration/
      e2e/
    module.manifest.yaml (opcional para auto-registro)

modules/
  [futuros módulos plugáveis]
```

**Structure Decision**: Core/kernel como domínio especial em `core/kernel`, separado de `modules/` que contém apenas módulos plugáveis. Isso reforça o papel central do core conforme constituição.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Core kernel + discovery + lifecycle no mesmo domínio | Coesão de integração core | Separar em vários repositórios aumentaria custo de orquestração e consistência |
| Dependências em PostgreSQL + Redis | Auditoria e performance efêmera | Armazenamento único não atenderia requisitos de compliance e alta disponibilidade |

## Module Manifest Schema

### `module.manifest.yaml` (obrigatório)

```yaml
id: string (único)
name: string
group: string
variant: string
version: semver
entrypoint: path.to.adapter
contracts:
  input: schema.path
  output: schema.path
capabilities: string[]
status: 'active' | 'disabled' | 'deprecated'
critical: boolean (default false)
dependencies: string[] (sem circulares)
```

### `group.manifest.yaml` (opcional)

```yaml
group: string
description: string
capabilities: string[]
variants: string[]
```

## Lifecycle State Machine

```
DISCOVERED → REGISTERED → VALIDATED → LOADED → INITIALIZED → RUNNING → STOPPED → FAILED
```

Transições:
- `RUNNING → LOADED` (shutdown gracioso)
- `LOADED → RUNNING` (reinicialização)
- `VALIDATED → REGISTERED` (rejeição)
- `DISCOVERED → STOPPED` (erro precoce)

## Registry Persistence Model

### Tabela `modules_registry` (PostgreSQL)

```sql
CREATE TABLE modules_registry (
  id UUID PRIMARY KEY,
  module_id VARCHAR(255) UNIQUE,
  group_name VARCHAR(255),
  variant_name VARCHAR(255),
  version VARCHAR(50),
  status ENUM('discovered','registered','validated','loaded','initialized','running','stopped','failed'),
  capabilities JSONB,
  contracts JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Redis Cache (runtime)

```
module:<id> → JSON completo do módulo ativo
registry:active → lista de módulos RUNNING
```

## Implementation Phases

### Phase 0: Research (✅)

- Confirmado schema de `module.manifest.yaml` e contratos de entrada/saída.
- Definido API do registry em runtime e persistência.
- Estabelecida abordagem de API para status/ciclos.

### Phase 1: Core Feature Build

- M1: Discovery e registry (P1)
- M2: Contratos e validação (P2)
- M3: Ciclo de vida (P3)
- M4: Expansão para novos tipos de módulo e proteção contra acoplamento ad hoc

### Phase 2: Cross-cutting

- Observability (logs + métricas + audit trails)
- Segurança/limitação de loops e retries
- Tests coverage 90%

## Artifact Delivery

- `research.md` (Phase 0)
- `data-model.md` (entidades Module/Contract/Registry/History)
- `quickstart.md` (setup local + smoke test)
- `contracts/` (schemas JSON/YAML para manifests e interfaces)
- `tasks.md` gerado via `speckit.tasks` após plan

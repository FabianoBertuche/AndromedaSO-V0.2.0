# Implementation Plan: Core Kernel Integration

**Branch**: `001-core-kernel-integration` | **Date**: 2026-04-05 | **Spec**: `C:\FB\Andromeda SO V0.2.0\specs\001-core-kernel-integration\spec.md`
**Input**: Feature specification from `/specs/001-core-kernel-integration/spec.md`

## Summary

Estabelecer o `core/kernel` como centro vivo de integração do Andromeda SO, responsável por discovery, registry, validação, carregamento e ciclo de vida de módulos organizados por raiz, grupo e variante. A solução usa contratos canônicos com Zod, registry dual (memória + PostgreSQL), discovery em filesystem e uma máquina de estados explícita para permitir expansão futura sem acoplamento ad hoc.

## Technical Context

**Language/Version**: TypeScript 5.4 + Node.js 20 (ESM)  
**Primary Dependencies**: Fastify 4, Zod, Drizzle ORM, `pg`, `yaml`, Pino, `prom-client`, `ioredis`  
**Storage**: PostgreSQL 15 para auditoria e recuperação, registry em memória para runtime, Redis 7 para coordenação efêmera/cache curto  
**Testing**: Vitest, Supertest/Fastify inject, Testcontainers  
**Target Platform**: Linux server local/prod com filesystem acessível para discovery e serviços Docker auxiliares  
**Project Type**: backend web-service com dashboard React consumindo APIs do kernel  
**Performance Goals**: descobrir e registrar pelo menos 10 módulos em menos de 5s, manter carregamento médio por módulo abaixo de 2s, suportar 100 módulos simultâneos com estado consistente  
**Constraints**: seguir SDD + TDD, usar apenas contratos explícitos, manter retrocompatibilidade dos fluxos atuais, não introduzir dependência do core em detalhes internos de variantes  
**Scale/Scope**: `core/kernel/src/{contracts,discovery,registry,validation,lifecycle,store,api}` + `modules/` declarativo + persistência de registry/lifecycle + endpoints HTTP canônicos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: existe spec ativa e o plano deriva diretamente dela, em conformidade com Artigos I e II.
- PASS: o design mantém `core/kernel` como centro de integração sistêmica e crescimento estrutural, conforme Artigos IV e V.
- PASS: módulos continuam organizados por raiz própria, grupos e variantes, em conformidade com Artigos VI e VII.
- PASS: integrações propostas usam manifestos, contratos e capacidades registradas, conforme Artigo VIII.
- PASS: stack proposta permanece na stack oficial V1 (TypeScript, Fastify, Zod, PostgreSQL, Redis, Drizzle), conforme Artigo IX.
- PASS: não há necessidade de novas tecnologias nem violações de simplicidade estrutural, conforme Artigo X.
- PASS: a feature pertence ao Ciclo 1 de fundação sistêmica, conforme Artigo XI.
- PASS: a rastreabilidade entre spec, plan, tasks, implementação e testes é mantida, conforme Artigo XIV.

## Phase 0 Research Decisions

- Manifestos continuam em `module.manifest.yaml`, com schema canônico em `core/kernel/src/contracts/moduleManifest.schema.ts`.
- Contratos de entrada e saída continuam validados com Zod e compatibilidade de versão por semver major.
- Registry operacional permanece em memória com persistência em PostgreSQL para auditoria/recuperação.
- O ciclo de vida mínimo adotado é `discovered -> registered -> validated -> loaded -> initialized -> running -> stopped -> failed`.
- Dependências circulares e variantes incompatíveis por versão são tratadas como erro de validação antes de entrar em runtime.

## Phase 1 Design Outputs

- `research.md`: consolida decisões arquiteturais e alternativas rejeitadas.
- `data-model.md`: define entidades operacionais e persistidas para módulos, contratos, registry e eventos de lifecycle.
- `contracts/module-runtime-api.md`: documenta os endpoints HTTP do kernel para discovery, validação, carga e lifecycle.
- `contracts/module-manifest.md`: documenta o contrato canônico do manifesto esperado no filesystem.
- `quickstart.md`: descreve setup local, smoke test e validação da feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-kernel-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── module-manifest.md
│   └── module-runtime-api.md
└── tasks.md
```

### Source Code (repository root)

```text
core/kernel/
├── src/
│   ├── api/
│   │   └── moduleRoutes.ts
│   ├── contracts/
│   │   ├── corePluginInterface.ts
│   │   ├── lifecycle.schema.ts
│   │   ├── moduleContract.schema.ts
│   │   └── moduleManifest.schema.ts
│   ├── discovery/
│   │   └── fsDiscovery.ts
│   ├── lifecycle/
│   │   ├── lifecycleOrchestrator.ts
│   │   ├── loadModule.ts
│   │   └── stateMachine.ts
│   ├── registry/
│   │   ├── inMemoryRegistry.ts
│   │   └── moduleRegistry.ts
│   ├── store/
│   │   ├── postgresRegistry.ts
│   │   └── schema.ts
│   ├── validation/
│   │   ├── contractValidator.ts
│   │   ├── dependencyValidator.ts
│   │   └── manifestParser.ts
│   └── __tests__/
├── modules/
│   ├── providers/
│   ├── channels/
│   └── llm-router/
└── package.json

modules/
└── providers/
    ├── module.manifest.yaml
    ├── groups/
    └── variants/

frontend/
└── src/
    ├── api/
    ├── components/
    ├── hooks/
    └── pages/
```

**Structure Decision**: a feature usa a estrutura real existente do repositório, concentrando o comportamento do runtime em `core/kernel/src/*`, mantendo a árvore declarativa de módulos em `modules/` e preservando o frontend apenas como consumidor das APIs canônicas do kernel.

## Complexity Tracking

Nenhuma violação constitucional identificada; seção mantida vazia por não haver exceções a justificar.

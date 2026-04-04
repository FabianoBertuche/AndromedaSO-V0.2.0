# Arquitetura — Andromeda SO

## Visão Geral

Andromeda SO é uma plataforma modular orientada a agentes. O kernel gerencia o ciclo de vida de módulos plugáveis (channels, providers LLM) e coordena um pool de agentes especializados para decompor e executar tarefas.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20, TypeScript 5.4 (ESM strict) |
| HTTP | Fastify 4.25 |
| Banco de dados | PostgreSQL 15 + pgvector |
| Cache | Redis 7 (reservado, não ativo) |
| ORM | Drizzle ORM (Prisma removido) |
| Validação | Zod |
| Logging | Pino (structured JSON, named loggers) |
| Métricas | prom-client (Prometheus) |
| Frontend | React 18 + Vite 5 + TailwindCSS 3 |
| Data fetching | TanStack React Query 5 |

## Estrutura de Serviços

```
┌─────────────────────────────────────────────────────────┐
│                        HOST                             │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  kernel          │    │  frontend                │  │
│  │  :4000           │    │  :5173                   │  │
│  └────────┬─────────┘    └──────────────────────────┘  │
│           │                                             │
│  ┌────────▼─────────────────────────────────────────┐  │
│  │              Docker (infra only)                 │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐  │  │
│  │  │  postgres:16    │  │  redis:7-alpine      │  │  │
│  │  │  :5432          │  │  :6379               │  │  │
│  │  └─────────────────┘  └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────┐                                   │
│  │  Ollama (host)   │                                   │
│  │  :11434          │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

## Módulos do Kernel

### Lifecycle
Gerencia o ciclo de vida dos módulos via máquina de estados:
`discovered → registered → validated → loaded → initialized → running → stopped`

- `LifecycleOrchestrator` — coordena transições, integra `DependencyValidator`
- `LifecycleStateMachine` — máquina de estados com transições validadas
- `loadModule` / `validateAndLoadModule` — carregamento com validação de contratos e dependências circulares

### Providers (Model Center)
Gerencia integrações com LLMs externos:

- `ProviderOrchestratorService` — CRUD de providers, sync de modelos, health check, benchmark, roteamento
- `IModelCenterService` — interface de contrato para catálogo, benchmark e roteamento
- Adapters: OpenAI, Anthropic, Groq, Ollama (factory functions com fallback para seed data)
- Repositório: in-memory (dev/test) ou PostgreSQL (produção)

### Orchestrator (Agent Pool)
Coordena agentes especializados para execução de tarefas:

- `AgentPool` — atribui agentes a subtarefas por capacidade e reputação (configurável via `agentProfiles.json`)
- `TaskDecomposer` — decompõe tarefas em subtarefas
- `MessageBus` — comunicação entre agentes
- `ConflictResolution` — resolução de conflitos por votação com fallback humano
- `OrchestratorState` — estado em tempo real das orquestrações

### Evolution Service
Rastreia performance e reputação dos agentes:
- Versionamento de manifests
- Métricas de performance (latência P95, taxa de sucesso)
- Sistema de reputação com decay temporal
- Controle de budget (diário/mensal)

## Banco de Dados (Drizzle Schema)

| Tabela | Responsabilidade |
|---|---|
| `modules_registry` | Registro de módulos do kernel |
| `lifecycle_events` | Histórico de transições de estado |
| `providers` | Integrações LLM cadastradas |
| `model_catalog_items` | Catálogo de modelos por provider |
| `model_benchmark_results` | Resultados de benchmarks (simulados) |
| `routing_decisions` | Histórico de decisões de roteamento |

## Convenções

- Imports ESM com extensão `.js` em todos os arquivos TypeScript
- Logger Pino nomeado por módulo: `pino({ name: 'nome-do-modulo' })`
- Correlation ID em todas as requisições HTTP via plugin Fastify
- Graceful degradation: PostgreSQL indisponível → in-memory, Ollama indisponível → seed data
- Benchmarks são simulados — campo `simulated: true` sempre presente nos resultados

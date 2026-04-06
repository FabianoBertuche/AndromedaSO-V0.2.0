# CONTEXT — Projeto Andromeda OS (Estado atual: 23/03/2026)

## Visão Geral
Sistema operacional cognitivo para agentes de IA. Monorepo com:
- **Backend:** Express + TypeScript (`packages/api/`)
- **Frontend:** React + Vite (`apps/web/`)
- **Cognitivo:** Python 3.13 / FastAPI (`services/cognitive-python/`)
- **Banco:** PostgreSQL + Prisma
- **Testes:** Vitest
- **Agentes:** `.agent/` com 20+ agentes, 60+ skills, 16 rules, 17 workflows

## Stack Técnica (pós-MVP09)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | Express + TypeScript | ^4.18.2 |
| ORM | Prisma | ^7.5.0 |
| Banco | PostgreSQL | via Docker |
| Realtime | Socket.io | ^4.8.3 |
| Filas/DLQ | BullMQ + ioredis | ✅ instalado |
| Auth | jsonwebtoken + bcrypt | ✅ instalado |
| Rate Limit | express-rate-limit | ✅ instalado |
| Circuit Breaker | opossum | ✅ instalado |
| Frontend | React + Vite + Tailwind | apps/web/ |
| Cognitivo | Python 3.13 + FastAPI | services/cognitive-python/ |
| Testes | Vitest | por workspace |

## Schema Prisma Atual (pós-MVP09)

### Modelos MVP01–08 (existentes)
- SandboxProfile, AgentSandboxConfig, SandboxExecution, SandboxArtifact, ApprovalRequest
- MemoryEntry, MemoryLink, MemoryRetrievalRecord, MemoryPolicy
- KnowledgeCollection, KnowledgeDocument, KnowledgeChunk, RetrievalRecord, AgentKnowledgePolicy
- CommunicationSession, CommunicationMessage

### Modelos adicionados no MVP09
- `User`, `RefreshToken`, `ApiKey` — Auth/IAM
- `AuditLog` — auditoria de auth
- `tenantId` — adicionado em todas as entidades centrais

### Modelos a criar no MVP10
- `AgentVersion` — snapshot versionado do AgentProfile
- `AgentPerformanceRecord` — consolidação diária de métricas
- `AgentBudgetPolicy` — teto de gasto por agente
- `TaskFeedback` — thumbs up/down por resultado de task
- `PlaybookSuggestion` — sugestões geradas por episódios de memória

## MVPs Implementados

| MVP | Status | Foco |
|-----|--------|------|
| MVP01–06C | ✅ | Core, Communication, Console, Models, Hybrid, Agents, Sandbox |
| MVP-Revisão | ✅ | Saneamento estrutural |
| MVP07 | ✅ | Memory Layer (Session/Episodic/Semantic) |
| MVP08 | ✅ | Knowledge Layer (RAG por agente, Obsidian vault) |
| MVP09 | ✅ | Foundation: Auth/IAM, Multi-tenancy, DLQ, Rate Limiting, Health, Soft Delete |
| MVP10 | 🔄 | Agent Evolution + Versioning + Budget Control + Feedback |
| MVP11 | 🔜 | Planner + Agent Handoff Protocol |
| MVP12 | 🔜 | i18n + Export/Import de Agentes |
| MVP13 | 🔜 | Multi-channel Nebula + Notificações Proativas |
| MVP14 | 🔜 | Eval Engine & Benchmark Cognitivo |
| MVP15 | 🔜 | Skill Marketplace & Intelligence |
| MVP16 | 🔜 | Device Agent (IoT / Edge Control) |
| MVP17 | 🔜 | Incident & Alerting + Team Workspaces |
| MVP18 | 🔜 | Autonomy & Long-running Agents |
| MVP19 | 🔜 | Reflexive Memory & Agent Marketplace |

## Regras Ativas
- `rule-15-soft-delete-only` — proibido `prisma.model.delete` em produção
- `rule-16-tenant-isolation` — obrigatório `tenantId` em todo `findMany`/`findFirst`

## Próximos Passos (MVP10)

1. **Bloco D** — Budget Control (impacto direto em execuções — implementar primeiro)
2. **Bloco F** — Feedback do usuário (UI + entidade)
3. **Bloco A** — Versionamento de AgentProfile (snapshot, diff, rollback)
4. **Bloco B** — Histórico de desempenho por agente (job diário BullMQ)
5. **Bloco C** — Reputação por domínio/capability
6. **Bloco E** — Dashboard de custos por agente/projeto/período
7. **Bloco G** — Consolidação de lições aprendidas → playbook suggestions

## Estrutura doc/

```
doc/
├── README.md
├── active/           ← MVP10 em andamento
│   ├── evals/        ← mvp10-*.feature
│   ├── Development-Log.md
│   ├── MVP10-PRD.md
│   ├── Implementation-Plan-MVP10.md
│   ├── EDD-MVP10-AgentEvolution.md
│   └── Project-Context.md
└── implemented/      ← MVPs concluídos
    ├── mvp01/ → mvp09/
    └── legados/
```

## Anti-patterns Proibidos
- Nunca acoplar frontend diretamente ao kernel
- Nunca usar `prisma.model.delete` em produção (usar soft delete)
- Nunca expor tenantId de outro tenant em resposta
- Nunca colocar lógica de negócio em controller
- Python só para cognição — todo processamento operacional em TypeScript

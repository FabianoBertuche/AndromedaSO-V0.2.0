# Technical Details — MVP12

## Stack Real (verificada em 2026-03-25)

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Express + TypeScript | express ^4.18.2 |
| ORM | Prisma | ^7.5.0 |
| Banco | PostgreSQL | via Docker |
| Realtime | Socket.io | ^4.8.3 |
| Filas | BullMQ | ✅ instalado |
| Frontend | React + Vite + Tailwind | apps/web/ |
| Cognitivo | Python 3.13 + FastAPI | services/cognitive-python/ |
| CLI (NOVO MVP12) | Commander | packages/cli/ |
| Testes | Vitest | por workspace |
| HTTP Utils | helmet, cors, morgan | já instalados |
| i18n (NOVO MVP12) | i18next + react-i18next | apps/web/ |
| Bundle (NOVO MVP12) | archiver + unzipper | packages/api/ |

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Express + TypeScript | express ^4.18.2 |
| ORM | Prisma | ^7.5.0 |
| Banco | PostgreSQL | via Docker |
| Realtime | Socket.io | ^4.8.3 |
| Filas | BullMQ | **instalar** (não está no package.json) |
| Frontend | React + Vite + Tailwind | apps/web/ |
| Cognitivo | Python 3.13 + FastAPI | services/cognitive-python/ |
| Testes | Vitest | por workspace |
| HTTP Utils | helmet, cors, morgan | já instalados |

## Estrutura Monorepo

```
Andromeda-SO/
├── CLAUDE.md                        ← Constituição do agente (raiz)
├── AGENTS.md                        ← Config de agentes do Antigravity
├── package.json                     ← Workspace root
├── apps/
│   └── web/                         ← React + Vite + Tailwind
│       └── src/locales/             ← NOVO MVP12: pt-BR/, en-US/
├── packages/
│   ├── api/                         ← Backend Express (módulos aqui)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← Schema atual (MVP01→MVP12)
│   │   │   └── migrations/          ← migrations existentes
│   │   └── src/
│   │       ├── app.ts               ← Express app config
│   │       ├── index.ts             ← Entry point
│   │       ├── modules/
│   │       │   ├── communication/   ← Gateway, channels, WebSocket
│   │       │   ├── agent-management/← Identidade, safeguards, CRUD
│   │       │   ├── sandbox/         ← Execução isolada, approvals
│   │       │   ├── memory/          ← Session, Episodic, Semantic
│   │       │   ├── knowledge/       ← RAG, vault, ingestão, retrieval
│   │       │   ├── model-center/    ← Providers, benchmark, router
│   │       │   ├── i18n/            ← NOVO MVP12: locale registry, messages
│   │       │   └── agent-portability/← NOVO MVP12: export/import bundles
│   │       ├── infrastructure/      ← Adapters, repositories
│   │       ├── presentation/        ← Routes e controllers legados
│   │       └── shared/              ← Middlewares, utils, DTOs
│   ├── core/                        ← Contratos e domínio compartilhado
│   ├── cli/                         ← NOVO MVP12: CLI andromeda
│   │   └── src/commands/
│   │       ├── agents.export.ts
│   │       ├── agents.import.ts
│   │       └── i18n.locales.ts
│   └── telegram/                    ← Canal Telegram (já implementado)
├── services/
│   └── cognitive-python/            ← FastAPI + RAG + embeddings
│       ├── app/main.py
│       ├── contracts/               ← Pydantic schemas
│       └── services/                ← rag, documents, planner, benchmark
└── .agent/
    ├── agents/                      ← 20 agentes especializados
    ├── skills/                      ← 60+ skills
    ├── rules/                       ← 14 rules obrigatórias
    └── workflows/                   ← 17 workflows + review-mvp09.md (novo)
```

## Schema Prisma Atual (pós-MVP11)

Modelos existentes:
- Agent (NOVO MVP12 — migrado de file-based)
- SandboxProfile, AgentSandboxConfig, SandboxExecution, SandboxArtifact
- ApprovalRequest
- MemoryEntry, MemoryLink, MemoryRetrievalRecord, MemoryPolicy
- KnowledgeCollection, KnowledgeDocument, KnowledgeChunk (+ detectedLang/detectedLocale/langConfidence MVP12)
- RetrievalRecord, AgentKnowledgePolicy
- CommunicationSession, CommunicationMessage
- User, RefreshToken, ApiKey — Auth/IAM
- AuditLog — auditoria
- AgentBudgetPolicy, AgentVersion, AgentPerformanceRecord, AgentExecutionLedger
- TaskFeedback, PlaybookSuggestion
- ExecutionPlan, PlanStep, AgentHandoff

### Modelos MVP12 (a adicionar)
- `LocaleRegistry` — locales disponíveis (pt-BR, en-US)
- `LocalizedMessage` — mensagens traduzidas por locale
- `UserPreferences` — locale do usuário
- `AgentBundle` — histórico de exports
- `AgentImportJob` — tracking de imports
- `Agent` — migrado de file-based para database

## MVPs Implementados

| MVP | Status | Foco |
|-----|--------|------|
| MVP01–06C | ✅ | Core, Communication, Console, Models, Hybrid, Agents, Sandbox |
| MVP-Revisão | ✅ | Saneamento estrutural |
| MVP07 | ✅ | Memory Layer (Session/Episodic/Semantic) |
| MVP08 | ✅ | Knowledge Layer (RAG por agente, Obsidian vault) |
| MVP09 | ✅ | Foundation: Auth/IAM, Multi-tenancy, DLQ, Rate Limiting, Health, Soft Delete |
| MVP10 | 🔄 | Agent Evolution + Versioning + Budget Control + Feedback |

## Próximos Passos (MVP12)

1. **Fase 0** — Model Agent no Prisma + Migração file-based → DB
2. **Fase 1** — Prisma migrations (LocaleRegistry, LocalizedMessage, UserPreferences, AgentBundle, AgentImportJob)
3. **Fase 2** — Módulo i18n Backend (API)
4. **Fase 3** — Language Detection (Python + langdetect)
5. **Fase 4** — Export de Agentes (BundleBuilder)
6. **Fase 5** — Import de Agentes (transação atômica, políticas de conflito)
7. **Fase 6** — UI i18n Frontend (i18next)
8. **Fase 7** — UI Export/Import (modais)
9. **Fase 8** — CLI (packages/cli/)
10. **Fase 9** — Testes + Evals E2E

## Estrutura de Agentes (MVP12 - Migração)

**Antes (file-based):**
```
.agent/agents/
├── orchestrator.md
├── security-auditor.md
├── backend-specialist.md
└── ... (20 agentes)
```

**Depois (database):**
```prisma
model Agent {
  id              String   @id @default(uuid())
  slug            String   @unique
  name            String
  role            String
  preferredLocale String   @default("pt-BR")
  fallbackLocale  String   @default("en-US")
  identity        Json
  soul            Json
  rules           Json
  playbook        Json
  // ... demais campos
}
```

## Dependências Novas (MVP12)

```json
// packages/api/package.json
{
  "archiver": "^7.0.0",
  "unzipper": "^0.12.0"
}

// apps/web/package.json
{
  "i18next": "^23.0.0",
  "react-i18next": "^14.0.0",
  "i18next-browser-languagedetector": "^8.0.0"
}

// packages/cli/package.json (NOVO)
{
  "commander": "^12.0.0",
  "archiver": "^7.0.0",
  "unzipper": "^0.12.0"
}

// services/cognitive-python/requirements.txt
langdetect>=1.0.9
```

## Estrutura doc/

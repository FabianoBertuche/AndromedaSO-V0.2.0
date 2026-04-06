# 📁 CONTEXT — Projeto Andromeda SO (Estado atual: 20/03/2026)

## Visão Geral
Sistema operacional cognitivo para agentes de IA. Monorepo com:
- **Backend:** Express + TypeScript (`packages/api/`)
- **Frontend:** React + Vite (`apps/web/`)
- **Cognitivo:** Python/FastAPI (`services/cognitive-python/`)
- **Banco:** PostgreSQL + Prisma
- **Testes:** Vitest
- **Agentes:** `.agent/` com 20+ agentes, 60+ skills, 16 rules, 17 workflows

## Stack Técnica (do package-3.json)

```
{
  "name": "@andromeda/api",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@andromeda/core": "*",
    "@prisma/adapter-pg": "^7.5.0",
    "@prisma/client": "^7.5.0",
    "chokidar": "^4.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "pg": "^8.20.0",
    "prisma": "^7.5.0",
    "socket.io": "^4.8.3"
  }
}
```

**FALTAM para MVP09:** `bullmq`, `ioredis`, `jsonwebtoken`, `bcrypt`, `express-rate-limit`

## Schema Prisma Atual (schema-2.prisma — 10048 chars)

### Enums (16)
```
SandboxMode, RiskLevel, SandboxExecutionStatus, ApprovalStatus
MemoryType, MemoryScopeType, MemoryStatus, MemoryRetentionMode
KnowledgeScopeType, KnowledgeSourceType, KnowledgeStatus
CommunicationChannel, MessageRole, MessageContentType, CommunicationSessionStatus
```

### Modelos (24+)
```
SandboxProfile, AgentSandboxConfig, SandboxExecution, SandboxArtifact
ApprovalRequest
MemoryEntry, MemoryLink, MemoryRetrievalRecord, MemoryPolicy
KnowledgeCollection, KnowledgeDocument, KnowledgeChunk
RetrievalRecord, AgentKnowledgePolicy
CommunicationSession, CommunicationMessage
```

**Migrations existentes:** 4 (sandbox, memory v1, knowledge, communication)

## Estrutura de Arquivos (estrutura.txt — 44.975 chars)

```
Raiz:
├── CLAUDE.md, AGENTS.md, README.md, tsconfig.json
├── .agent/ (ARCHITECTURE.md, mcp_config.json, skills.md, workflows.md)
│   ├── agents/ (20 agentes: backend-specialist, security-auditor, devops-engineer...)
│   ├── rules/ (14 rules: rule-01-security-isolation → rule-14-documentation-code)
│   ├── skills/ (60+ skills: app-builder, architecture, clean-code, database-design...)
│   └── workflows/ (17 workflows: create.md, deploy.md, test.md...)
├── packages/
│   ├── api/ (Express backend)
│   │   ├── src/modules/ (agent-management, cognitive, communication, knowledge, memory, model-center, sandbox)
│   │   ├── src/presentation/controllers/ (AgentController, SkillController...)
│   │   ├── src/infrastructure/ (adapters, execution, repositories)
│   │   └── prisma/schema.prisma + migrations/
│   ├── core/ (Task, Agent, Skill, ExecutionStrategy...)
│   └── telegram/ (bot.ts, handler.ts...)
├── apps/web/ (React + Vite + Tailwind)
│   ├── src/components/ (AgentManagementView, KnowledgeView, MemoryView...)
│   └── src/lib/ (agents.ts, gateway.ts...)
└── services/cognitive-python/ (FastAPI + RAG)
    ├── app/main.py
    ├── contracts/ (base.py, classification.py...)
    └── services/ (rag/, documents/, benchmark/, memory/)
```

## Agentes Específicos (20+)
- `backend-specialist`, `database-architect`, `devops-engineer`, `security-auditor`
- `orchestrator`, `frontend-specialist`, `test-engineer`, `performance-optimizer`
- `documentation-writer`, `code-archaeologist`, `penetration-tester`

## Skills Relevantes para MVP09
- `api-security-best-practices`, `prisma-expert`, `bullmq-specialist`
- `api-patterns`, `database-design`, `deployment-procedures`
- `clean-code`, `tdd-workflow`, `nodejs-best-practices`

## Regras Ativas (14)
```
rule-01-security-isolation → rule-14-documentation-code
rule-15-soft-delete-only → rule-16-tenant-isolation (novas do MVP09)
```

## MVPs Implementados (docs no repositório)
| MVP | Status | Foco |
|---|---|---|
| MVP01-06 | ✅ | Core, Communication, Sandbox, Agent Identity |
| MVP07 | ✅ | Memory Layer (Session/Episodic/Semantic) |
| MVP08 | ✅ | Knowledge Layer (RAG por agente, Obsidian vault) |
| MVP09 | 🔄 | Foundation: Auth, Multi-tenancy, DLQ, Backup, Health |

## Próximos Passos (MVP09)
1. Fase 1: IAM (JWT + RBAC + API Keys)
2. Fase 2: Multi-tenancy (tenantId em todas entidades)
3. Fase 3: API Versioning (/v1/)
4. Fase 4: Rate Limiting + Circuit Breaker
5. Fase 5: Backup & Recovery (pg_dump)
6. Fase 6: Dead Letter Queue (BullMQ)
7. Fase 7: Soft Delete (global Prisma extension)
8. Fase 8: Health Check
9. **Fase 9:** Revisão final com todos os agentes

---

## Como Consultar Este Documento

Este arquivo foi criado em 20/03/2026 a partir dos arquivos:
- `estrutura.txt` [file:114]
- `schema-2.prisma` [file:115] 
- `package-3.json` [file:116]

**Se o contexto encher, este documento mantém o snapshot técnico completo.**

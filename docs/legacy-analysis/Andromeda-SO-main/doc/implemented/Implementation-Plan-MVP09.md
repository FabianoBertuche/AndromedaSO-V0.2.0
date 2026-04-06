# Implementation Plan — MVP09 Foundation
# Stack: Express + TypeScript + Prisma + Vitest (NÃO NestJS)

## Pré-requisito: Instalar dependências

```bash
cd packages/api
npm install bullmq ioredis jsonwebtoken bcrypt express-rate-limit opossum
npm install -D @types/jsonwebtoken @types/bcrypt @types/opossum
```

---

## Fase 1 — IAM: Auth, JWT e RBAC

**Agente:** `backend-specialist`
**Skills:** `api-security-best-practices`, `api-patterns/auth.md`, `tdd-workflow`
**Rules ativas:** rule-01, rule-04, rule-05, rule-07, rule-10

**Arquivos a criar:**
```
packages/api/prisma/migrations/YYYYMMDD_auth_iam/migration.sql
packages/api/src/modules/auth/
├── domain/
│   ├── user.ts                    ← entidade User + enums Role
│   └── ports.ts                   ← IUserRepository, ITokenRepository
├── application/use-cases/
│   ├── LoginUseCase.ts
│   ├── RefreshTokenUseCase.ts
│   ├── RevokeTokenUseCase.ts
│   └── CreateApiKeyUseCase.ts
├── infrastructure/persistence/
│   ├── PrismaUserRepository.ts
│   └── PrismaTokenRepository.ts
├── interfaces/http/
│   ├── auth.routes.ts             ← POST /v1/auth/login, /refresh, /logout
│   └── auth.controller.ts
└── dependencies.ts
packages/api/src/shared/middleware/
├── auth.middleware.ts             ← verifica JWT e API Key
└── rbac.middleware.ts             ← requireRole()
packages/api/prisma/seed.ts       ← criar se não existir; seed default-tenant + owner
```

**Critério de aceite:**
- [ ] POST /v1/auth/login retorna accessToken + refreshToken
- [ ] POST /v1/auth/refresh retorna novo accessToken
- [ ] POST /v1/auth/logout revoga refresh token
- [ ] Viewer recebe 403 em DELETE /v1/agents/:id
- [ ] Refresh token revogado retorna 401
- [ ] Todos os testes da fase passam: `npm run test`

---

## Fase 2 — Multi-tenancy Foundation

**Agente:** `database-architect`
**Skills:** `prisma-expert`, `database-design/migrations.md`, `rule-03-multi-tenant-shield`
**Rules ativas:** rule-03, rule-06, rule-10

**Arquivos a criar/modificar:**
```
packages/api/prisma/migrations/YYYYMMDD_add_tenant_id/migration.sql
  ← ADD COLUMN tenantId TEXT DEFAULT 'default' em todas entidades principais
packages/api/src/shared/middleware/tenant.middleware.ts
  ← resolve tenantId do JWT e injeta no request
packages/api/src/shared/types/request.ts
  ← extender Express.Request com user + tenantId
```

**Entidades a receber tenantId:**
CommunicationSession, MemoryEntry, MemoryPolicy,
KnowledgeCollection, AgentKnowledgePolicy,
SandboxProfile, AgentSandboxConfig, SandboxExecution

**Critério de aceite:**
- [ ] Todas as migrations aplicam sem erro em banco limpo
- [ ] GET /v1/agents retorna apenas dados do tenant do usuário logado
- [ ] Query sem tenantId é bloqueada pelo middleware (throw em dev)
- [ ] Seed cria tenant 'default' com owner padrão

---

## Fase 3 — API Versioning + OpenAPI

**Agente:** `backend-specialist`
**Skills:** `api-patterns/versioning.md`, `openapi-spec-generation`, `rule-11-api-consistency`
**Rules ativas:** rule-11, rule-14

**Arquivos a criar/modificar:**
```
packages/api/src/app.ts
  ← prefixar todas as rotas com /v1/
packages/api/src/shared/http/api-version.middleware.ts
  ← header X-Api-Version na resposta
packages/api/src/shared/http/deprecation.middleware.ts
  ← header Deprecation para rotas legadas
packages/api/src/modules/*/interfaces/http/*.routes.ts
  ← revisar e confirmar prefixo /v1/
```

**Critério de aceite:**
- [ ] Todas as rotas públicas respondem em /v1/*
- [ ] GET /v1/docs retorna OpenAPI spec (swagger-ui ou JSON)
- [ ] Header X-Api-Version: 1 presente em todas as respostas
- [ ] Rotas sem /v1/ retornam 404 ou redirect

---

## Fase 4 — Rate Limiting + Circuit Breaker

**Agente:** `backend-specialist`
**Skills:** `api-patterns/rate-limiting.md`, `nodejs-backend-patterns`, `nodejs-best-practices`
**Rules ativas:** rule-01, rule-02, rule-08

**Arquivos a criar:**
```
packages/api/src/shared/middleware/rate-limit.middleware.ts
  ← express-rate-limit por rota; auth limit mais restrito
packages/api/src/infrastructure/resilience/
├── CircuitBreakerFactory.ts       ← opossum por provider LLM
├── circuit-breaker.registry.ts    ← mapa de CBs ativos
└── circuit-breaker.events.ts      ← log de OPEN/CLOSE para AuditLog
packages/api/src/modules/model-center/infrastructure/
  ← wrappear chamadas a providers com CircuitBreakerFactory
packages/api/src/modules/agent-management/application/
  ← MAX_ITERATIONS_POLICY: parar task após 50 iterações
```

**Critério de aceite:**
- [ ] 11ª req/s em /v1/agents retorna 429
- [ ] Auth routes: 6ª req/min retorna 429
- [ ] Health check isento de rate limit
- [ ] Provider LLM falhando 5x → 6ª retorna 503 com circuit_open
- [ ] Task em loop para após 50 iterações com MAX_ITERATIONS_EXCEEDED

---

## Fase 5 — Backup & Recovery

**Agente:** `devops-engineer`
**Skills:** `deployment-procedures`, `server-management`, `docker-expert`
**Rules ativas:** rule-13

**Arquivos a criar:**
```
packages/api/src/modules/backup/
├── application/use-cases/
│   ├── TriggerBackupUseCase.ts    ← pg_dump via child_process
│   └── ListBackupsUseCase.ts
├── infrastructure/
│   └── PgDumpRunner.ts
├── interfaces/http/
│   └── backup.routes.ts           ← POST /v1/backup/trigger (owner only)
└── dependencies.ts
scripts/backup.sh                  ← pg_dump + gzip + timestamp no nome
scripts/restore.sh                 ← pg_restore com confirmação
.env.development                   ← BACKUP_DIR, BACKUP_RETENTION_DAYS
```

**Critério de aceite:**
- [ ] POST /v1/backup/trigger (owner) retorna { filename: "andromeda-*.sql.gz" }
- [ ] Arquivo .sql.gz criado em BACKUP_DIR
- [ ] GET /v1/backup/list retorna lista de backups disponíveis
- [ ] Viewer/admin recebe 403 no trigger
- [ ] scripts/restore.sh documentado e testado manualmente

---

## Fase 6 — Dead Letter Queue + BullMQ

**Agente:** `backend-specialist`
**Skills:** `bullmq-specialist`, `nodejs-backend-patterns`, `systematic-debugging`
**Rules ativas:** rule-02, rule-08

**Arquivos a criar:**
```
packages/api/src/shared/redis.ts            ← conexão Redis (ioredis)
packages/api/src/modules/queue/
├── infrastructure/
│   ├── TaskQueueWorker.ts         ← worker BullMQ com retry + backoff
│   ├── DlqQueueService.ts         ← fila andromeda-dlq
│   └── QueueMetricsService.ts     ← métricas de filas
├── interfaces/http/
│   └── dlq.routes.ts              ← GET /v1/dlq/jobs, POST /v1/dlq/jobs/:id/reprocess
└── dependencies.ts
```

**Critério de aceite:**
- [ ] Job falhando 3x vai para DLQ automaticamente
- [ ] GET /v1/dlq/jobs lista jobs com erro original
- [ ] POST /v1/dlq/jobs/:id/reprocess move job de volta para fila principal
- [ ] Backoff: 2s → 4s → 8s (exponencial, máx 30s)
- [ ] Redis conectando via REDIS_URL do .env

---

## Fase 7 — Soft Delete + Archiving

**Agente:** `database-architect`
**Skills:** `prisma-expert`, `database-design/schema-design.md`
**Rules ativas:** rule-06, rule-10

**Arquivos a criar/modificar:**
```
packages/api/prisma/migrations/YYYYMMDD_soft_delete/migration.sql
  ← ADD COLUMN deletedAt + archivedAt nas entidades principais
packages/api/src/shared/prisma/soft-delete.middleware.ts
  ← Prisma middleware que injeta deletedAt: null em todos findMany/findUnique
packages/api/src/modules/*/application/use-cases/
  ← SoftDeleteUseCase e RestoreUseCase por módulo relevante
packages/api/src/modules/*/interfaces/http/
  ← POST /:id/restore (admin only)
```

**Critério de aceite:**
- [ ] DELETE /v1/agents/:id seta deletedAt, não remove do banco
- [ ] GET /v1/agents não retorna agents com deletedAt != null
- [ ] POST /v1/agents/:id/restore limpa deletedAt
- [ ] Registro ainda existe no banco após soft delete
- [ ] Prisma middleware ativo em TODOS os findMany do sistema

---

## Fase 8 — Health Check + Graceful Degradation

**Agente:** `devops-engineer`
**Skills:** `observability-engineer`, `observability-monitoring-monitor-setup`, `nodejs-best-practices`
**Rules ativas:** rule-02, rule-08

**Arquivos a criar:**
```
packages/api/src/modules/health/
├── application/
│   └── HealthCheckService.ts      ← verifica DB, Redis, Python, VectorStore
├── interfaces/http/
│   └── health.routes.ts           ← GET /v1/health, GET /v1/status
└── dependencies.ts
```

**Lógica de status:**
```typescript
// GET /v1/health
{
  status: 'ok' | 'degraded' | 'down',
  services: {
    database:         { status: 'up' | 'down', latencyMs: number },
    redis:            { status: 'up' | 'down', latencyMs: number },
    'cognitive-python': { status: 'up' | 'down', latencyMs: number },
    'vector-store':   { status: 'up' | 'down', latencyMs: number }
  },
  version: '1.0.0',
  timestamp: '2026-03-20T...'
}
```

**Critério de aceite:**
- [x] GET /v1/health retorna 200 com todos os services up
- [x] Se cognitive-python down → status: 'degraded', sistema continua
- [x] Se DB down → status: 'down', sistema responde 503
- [x] Rota isenta de rate limiting e auth
- [x] Latência do health check < 500ms

---

## Fase 9 — REVISÃO FINAL COMPLETA

**Orquestrador:** `orchestrator`
**Workflow:** `.agent/workflows/review-mvp09.md`

Execute o workflow de revisão antes de qualquer teste final.
O workflow aciona todos os agentes especializados em sequência.

**Critério de aceite do MVP09:**
- [x] Todas as 8 fases anteriores com testes passando
- [x] npm run test (todos os workspaces) — zero falhas
- [⚠️] Revisão de segurança aprovada (security-auditor) — 3 achados críticos
- [⚠️] Revisão de arquitetura aprovada (database-architect) — 3 achados críticos
- [⚠️] Revisão de performance aprovada (performance-optimizer) — 2 achados críticos
- [x] Revisão de frontend aprovada (frontend-specialist) — Não aplicável (backend only)
- [x] Documentação gerada (documentation-writer) — REVIEW-MVP09.md criado
- [x] Entry final no Development-Log.md

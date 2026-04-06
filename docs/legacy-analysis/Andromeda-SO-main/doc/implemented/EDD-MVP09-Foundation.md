# Engineering Design Document — MVP09 Foundation
# Stack: Express + TypeScript + Prisma + Vitest (NÃO NestJS)

## Contexto

O MVP09 adiciona infraestrutura de produção ao projeto Andromeda:
autenticação real (JWT + RBAC), multi-tenancy, versionamento de API,
rate limiting, circuit breaker, backup, DLQ com BullMQ, soft delete e health check.

Tudo sobre Express puro — NÃO NestJS. Testes com Vitest.

## Decisões de Arquitetura

### Auth: JWT stateless + refresh token no DB
- Access token: curto (15min prod / 7d dev)
- Refresh token: salvo como hash bcrypt no banco (revogável)
- API Keys: SHA-256 hash no banco; valor completo apenas no POST de criação
- **Motivo:** sem infra de sessão distribuída; revogação via DB lookup no refresh

### Multi-tenancy: tenantId em todas as entidades
- Campo `tenantId TEXT NOT NULL DEFAULT 'default'`
- Middleware injeta tenantId do JWT em req.tenantId
- Repositories recebem tenantId como parâmetro obrigatório
- **Motivo:** schema-per-tenant é overengineering neste momento; row-level isolation via código é suficiente

### Soft Delete: middleware Prisma global
- Campo `deletedAt DateTime?` em todas as entidades principais
- Prisma client extension intercepta findMany/findUnique e injeta `deletedAt: null`
- **Motivo:** auditabilidade; dados nunca são destruídos permanentemente

### BullMQ: filas persistentes com Redis
- Fila principal: `andromeda-tasks`
- DLQ: `andromeda-dlq` (jobs que falharam após 3 tentativas)
- Backoff exponencial: 2s → 4s → 8s → máx 30s
- **Motivo:** confiabilidade no processamento de tasks de agente

## Novos Modelos Prisma

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         Role      @default(viewer)
  tenantId     String    @default("default")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  refreshTokens RefreshToken[]
  apiKeys       ApiKey[]

  @@index([tenantId])
  @@map("users")
}

enum Role { owner admin operator viewer }

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

model ApiKey {
  id         String    @id @default(uuid())
  name       String
  keyHash    String    @unique
  userId     String
  tenantId   String
  lastUsedAt DateTime?
  expiresAt  DateTime?
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("api_keys")
}

model AuditLog {
  id         String   @id @default(uuid())
  tenantId   String
  userId     String?
  action     String
  resource   String
  resourceId String?
  metadata   Json     @default("{}")
  createdAt  DateTime @default(now())

  @@index([tenantId])
  @@index([userId])
  @@index([resource])
  @@map("audit_logs")
}
```

## Rotas Novas no MVP09

| Método | Rota | Fase | Auth | Role mínima |
|---|---|---|---|---|
| POST | /v1/auth/login | 1 | Público | — |
| POST | /v1/auth/refresh | 1 | Público | — |
| POST | /v1/auth/logout | 1 | JWT | viewer |
| GET | /v1/auth/me | 1 | JWT | viewer |
| POST | /v1/auth/api-keys | 1 | JWT | admin |
| GET | /v1/auth/api-keys | 1 | JWT | admin |
| DELETE | /v1/auth/api-keys/:id | 1 | JWT | admin |
| POST | /v1/backup/trigger | 5 | JWT | owner |
| GET | /v1/backup/list | 5 | JWT | admin |
| GET | /v1/dlq/jobs | 6 | JWT | admin |
| POST | /v1/dlq/jobs/:id/reprocess | 6 | JWT | admin |
| GET | /v1/health | 8 | Público | — |
| GET | /v1/status | 8 | Público | — |
| POST | /:resource/:id/restore | 7 | JWT | admin |

## Estrutura de Resposta de Erro Padrão

```typescript
// packages/api/src/shared/http/error-response.ts (já existe — confirmar formato)
{
  "error": "mensagem legível por humano",
  "code": "MACHINE_READABLE_CODE",   // opcional
  "details": {}                       // opcional, nunca stack trace
}
```

## Variáveis de Ambiente — Validação com Zod

```typescript
// packages/api/src/shared/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  BACKUP_DIR: z.string().default('./backups'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(7),
  COGNITIVE_PYTHON_URL: z.string().url().default('http://127.0.0.1:8008'),
  COGNITIVE_PYTHON_TOKEN: z.string(),
})

export const env = envSchema.parse(process.env)
```

## Checklist de Segurança por Fase

### Fase 1 — Auth
- [ ] JWT_SECRET nunca hardcoded, nunca logado
- [ ] Passwords com bcrypt(10+)
- [ ] API Keys só reveladas no POST de criação
- [ ] Rate limit em /v1/auth/login (5 req/min)
- [ ] Tokens de refresh com prazo de expiração

### Fase 2 — Multi-tenancy
- [ ] Nenhum findMany sem tenantId
- [ ] Middleware valida tenantId em todo request autenticado
- [ ] Seed não vaza dados entre tenants

### Fase 4 — Rate Limiting
- [ ] Rate limit por IP (não por usuário para evitar enum)
- [ ] Headers Retry-After nos responses 429

### Fase 6 — DLQ
- [ ] Jobs da DLQ não contêm dados sensíveis em plaintext
- [ ] Reprocessamento requer role admin

### Geral
- [ ] Todos os novos módulos com testes mínimos
- [ ] .env.example atualizado
- [ ] CLAUDE.md sem divergências da implementação

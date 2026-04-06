# ANDROMEDA CONSTITUTION — MVP09

# Lido automaticamente pelo Antigravity em cada sessão via CLAUDE.md na raiz

## Stack Real do Projeto (NÃO usar NestJS)

- **Backend:** Express + TypeScript (NÃO NestJS)
- **ORM:** Prisma + PostgreSQL
- **Testes:** Vitest (NÃO Jest)
- **Realtime:** Socket.io
- **Filas:** BullMQ (instalar — ainda não está no package.json)
- **Frontend:** React + Vite + TailwindCSS
- **Cognitivo:** Python / FastAPI em services/cognitive-python/
- **Monorepo:** packages/api + packages/core + packages/telegram + apps/web

## Estrutura de módulos (packages/api/src/modules/)

- communication/   — Gateway, sessions, WebSocket
- agent-management/ — Identity, safeguards, prompts
- cognitive/       — Adapter para Python
- knowledge/       — RAG, coleções, vault watcher
- memory/          — Session, episodic, semantic
- model-center/    — Providers, catalog, router, benchmark
- sandbox/         — Políticas, execuções, aprovações
- health/          — Health check e status do sistema

## Princípios Inegociáveis

1. Skill antes de LLM sempre que possível
2. Executor ≠ Auditor — nunca o mesmo módulo executa e audita
3. Python é cognitivo — TypeScript comanda (control plane)
4. Deny-by-default — sandbox começa negada
5. Toda ação relevante gera AuditRecord
6. Tenant isolation — queries NUNCA retornam dados de outro tenant
7. NUNCA usar NestJS — o projeto usa Express puro

## Rules Ativas (todas obrigatórias neste MVP)

Localização: .agent/rules/

- rule-01-security-isolation.md   → JWT, RBAC, tokens nunca logados
- rule-02-async-performance.md    → async/await, sem blocking I/O
- rule-03-multi-tenant-shield.md  → tenantId em TODOS os queries
- rule-04-secrets-vault.md        → env vars, nunca hardcode
- rule-05-session-hardening.md    → refresh token seguro, revogação
- rule-06-clean-architecture.md   → Controller → UseCase → Domain → Infra
- rule-07-credential-hygiene.md   → hash bcrypt, API keys só no create
- rule-08-error-handling.md       → erros tipados, nunca vazar stack trace
- rule-09-dependency-hygiene.md   → só deps necessárias
- rule-10-test-first.md           → escrever test antes de implementar
- rule-11-api-consistency.md      → prefixo /v1/, DTOs tipados
- rule-12-commit-discipline.md    → feat(mvp09): fase N - descrição
- rule-13-env-isolation.md        → .env por ambiente com validação Zod
- rule-14-documentation-code.md   → JSDoc em ports e use cases

## Agentes a acionar por fase

| Fase | Agente Principal | Suporte |
|---|---|---|
| Fase 1 — Auth/IAM | backend-specialist | security-auditor |
| Fase 2 — Multi-tenancy | database-architect | backend-specialist |
| Fase 3 — API Versioning | backend-specialist | documentation-writer |
| Fase 4 — Rate Limiting/CB | backend-specialist | performance-optimizer |
| Fase 5 — Backup/Recovery | devops-engineer | database-architect |
| Fase 6 — DLQ/BullMQ | backend-specialist | debugger |
| Fase 7 — Soft Delete | database-architect | backend-specialist |
| Fase 8 — Health Check | devops-engineer | observability-engineer* |
| Revisão Final | orchestrator | TODOS (ver workflow review-mvp09.md) |

*observability-engineer = skill observability-engineer existente

## Skills a usar por contexto

| Contexto | Skill |
|---|---|
| Implementar auth/JWT | api-security-best-practices + api-patterns/auth.md |
| Migrations Prisma | prisma-expert + database-design/migrations.md |
| Rate limiting Express | api-patterns/rate-limiting.md + nodejs-best-practices |
| Circuit breaker | nodejs-backend-patterns + bullmq-specialist |
| Testes Vitest | javascript-testing-patterns + tdd-workflow |
| OpenAPI/Swagger | openapi-spec-generation |
| Segurança geral | security-scanning-security-hardening + vulnerability-scanner |
| STRIDE analysis | stride-analysis-patterns |
| Performance | performance-profiling + observability-engineer |
| Refactor | code-refactoring-refactor-clean + clean-code |

## Workflows disponíveis

- .agent/workflows/sistema-agente-ia.md  → workflow principal deste projeto
- .agent/workflows/plan.md              → planejamento de fase
- .agent/workflows/create.md            → criação de novos módulos
- .agent/workflows/test.md              → executar e validar testes
- .agent/workflows/debug.md             → depuração de erros
- .agent/workflows/deploy.md            → preparação para deploy
- .agent/workflows/review-mvp09.md      → revisão final completa (NOVO)

## Migrações Prisma — Regras de Ouro

- NUNCA DROP TABLE ou DROP COLUMN
- Sempre incremental: ADD COLUMN nullable → backfill → NOT NULL
- Migrations ficam em packages/api/prisma/migrations/
- Seed em packages/api/prisma/seed.ts (criar se não existir)
- Testar em banco limpo: `npm run prisma:migrate -- --name <descricao>`

## Auth — Regras Específicas

- Access token: 15min produção, 7d desenvolvimento (via NODE_ENV)
- Refresh token: hash bcrypt(10) antes de salvar no DB
- API Keys: hash SHA-256 no DB, exibir valor completo só no POST de criação
- Middleware de auth: packages/api/src/shared/middleware/auth.middleware.ts
- Guards de role: packages/api/src/shared/middleware/rbac.middleware.ts

## Soft Delete — Regras

- Usar `deletedAt DateTime?` em todas as entidades principais
- NUNCA chamar prisma.model.delete() — sempre update com deletedAt
- Todo findMany e findUnique: adicionar `where: { deletedAt: null }`

## Antipatterns Proibidos

- ❌ import de @nestjs/* em qualquer arquivo
- ❌ prisma.findMany() sem tenantId no where (pós-fase-2)
- ❌ JWT_SECRET hardcoded
- ❌ res.status(500).json({ error: err.message }) — vazar stack trace
- ❌ DROP em migrations
- ❌ Python fazendo controle de fluxo ou roteamento
- ❌ console.log(token) ou console.log(password) em qualquer nível

## Ao Terminar Cada Fase

1. Rodar: npm run test (Vitest)
2. Verificar critério de aceite no Implementation-Plan-MVP09.md
3. Commitar: `git commit -m "feat(mvp09): fase N - <descrição>"`
4. Adicionar entrada no doc/active/Development-Log.md
5. Reportar ao humano ANTES de avançar

## Revisão Final (pós-Fase 8)

Executar workflow: .agent/workflows/review-mvp09.md
Este workflow aciona todos os agentes especializados em paralelo para revisão completa.

## Se encontrar ambiguidade

Prioridade: CLAUDE.md → EDD-MVP09 → Technical-Details.md → Notion
Se ainda ambíguo: PARAR e perguntar. Não assumir.

## REGRA INEGOCIÁVEL: Testes Playwright ao Final de Todo MVP

Ao concluir qualquer MVP, execute obrigatoriamente:

```bash
# 1. Testes unitários e integração
npm test

# 2. Testes Playwright — interface real no navegador
cd packages/web-e2e && npx playwright test

# 3. Só declare MVP concluído se AMBOS passarem com 0 falhas
Os testes Playwright devem cobrir:

Carregamento sem erros de todas as telas novas

Todos os botões clicáveis disparando ações reais no backend

Fluxo CRUD completo via interface

Fluxo E2E principal do MVP (ponta a ponta)

Arquivo de spec deve ser criado em:
packages/web-e2e/tests/mvpXX-nome.spec.ts

Antes de commitar o MVP, verifique:

 npm test → verde

 npx playwright test → verde

 Spec Playwright do MVP commitada

 PROJECT-CONTEXT.md atualizado

 Documentação do MVP atualizada com nota dos testes Playwright

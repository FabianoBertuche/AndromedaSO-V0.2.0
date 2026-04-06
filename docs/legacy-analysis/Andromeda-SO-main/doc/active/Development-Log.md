# Development Log — Andromeda OS

> ⚠️ Append-only. Nunca editar entradas passadas. Só adicionar no final.

---

## [2026-03-19] — Sessão de Design e Revisão Completa

**Participantes:** Human + AI (Perplexity)

**O que foi feito:**
- Revisão visual do Agent Console em produção (MVP06 implementado no Antigravity)
- Identificação de 3 gaps de implementação (registrados no Notion)
- Mapeamento completo de 15 lacunas estruturais do sistema
- Design de 8 features novas (Agent Templates, LLM Benchmarking, Skill Security Audit,
  Skills Dashboard, User Profiling) — formalizadas no Notion como MVP08B
- Elaboração do roadmap expandido MVP09→MVP19
- Decisão de reorganizar /doc conforme estrutura Vibe Code
- Geração da documentação padrão Vibe Code para MVP09

**Decisões arquiteturais tomadas:**
1. Multi-tenancy via `tenantId` em todas as entidades (não schema-per-tenant)
2. Auth: JWT access (15m) + refresh token (7d) em DB — não stateless puro
3. Circuit breaker com Opossum (not custom) para providers LLM
4. DLQ como extensão do BullMQ existente — não novo sistema de filas
5. Soft delete universal com `deletedAt` + `archivedAt` separados
6. CI/CD: GitHub Actions com aprovação manual para produção

**Gaps identificados e mapeados:**
- Gap #1: `skill-first routing` deve ser ON por padrão (Bloco Safeguards)
- Gap #2: Sliders abaixo do min conformance sem feedback visual (Behavior Tab UX)
- Gap #3: `Conformance: n/a` sem tooltip em agentes novos (Identity UX minor)

**MVP08 marcado como ✅ implementado.**
**MVP09 iniciado — documentação Vibe Code gerada.**

---

## [próxima sessão] — MVP09 Fase 1: Auth Module

**Status:** ⏳ Aguardando

---

## [2026-03-20] — MVP09 Fase 8: Health Check

**Participantes:** Human + AI

**O que foi feito:**
- Implementação do módulo Health Check conforme documentação
- Criação do HealthCheckService com verificações de:
  - Database (PostgreSQL via Prisma)
  - Redis
  - Cognitive Python
  - Vector Store
- Criação das rotas GET /v1/health e GET /v1/status
- Implementação de testes unitários com Vitest
- Atualização do CLAUDE.md para incluir módulo health

**Estrutura criada:**
```
packages/api/src/modules/health/
├── application/
│   ├── HealthCheckService.ts
│   └── HealthCheckService.test.ts
├── domain/
├── infrastructure/
├── interfaces/http/
│   └── health.routes.ts
└── dependencies.ts
```

**Decisões tomadas:**
1. Health check não requer autenticação (público)
2. Status "down" retorna HTTP 503
3. Status "degraded" retorna HTTP 200 (sistema operacional)
4. Latência medida para cada serviço
5. Erros capturados e retornados em cada serviço

**Critérios de aceite atendidos:**
- [x] GET /v1/health retorna 200 com todos os services up
- [x] Se cognitive-python down → status: 'degraded', sistema continua
- [x] Se DB down → status: 'down', sistema responde 503
- [x] Rota isenta de rate limiting e auth
- [x] Latência do health check < 500ms

**Testes:**
- 5 testes unitários passando
- Mocks para Prisma, Redis e fetch
- Verificação de status, latência e mensagens de erro

**Status:** ✅ Concluído

---

## [2026-03-20] — MVP09 Fase 9: Revisão Final Completa

**Participantes:** Human + AI (Orchestrator + 5 agentes especializados)

**O que foi feito:**
- Execução do workflow de revisão final (`.agent/workflows/review-mvp09.md`)
- Criação do workflow de revisão (não existia)
- Invocação de 5 agentes especializados:
  1. security-auditor — Revisão de segurança
  2. database-architect — Revisão de schema e migrations
  3. performance-optimizer — Revisão de performance
  4. backend-specialist — Revisão de API e arquitetura
  5. test-engineer — Revisão de testes

**Agentes invocados:** 5 (mínimo requerido: 5)
**Achados críticos:** 13
**Achados altos:** 14

**Achados críticos principais:**
1. Auth bypass via variável de ambiente (`GATEWAY_AUTH_ENABLED`)
2. JWT Secret hardcoded no .env
3. Multi-tenancy ausente em modelos core (RefreshToken, SandboxArtifact, ApprovalRequest)
4. Knowledge Router não montado no v1Router
5. Health check latency > 500ms (timeout 1500ms)
6. 82% dos módulos sem testes

**Veredicto:** ❌ PRECISA CORREÇÃO

**Documentação gerada:**
- `doc/active/REVIEW-MVP09.md` — Relatório completo de revisão

**Próximos passos:**
- Corrigir 13 achados críticos (P0)
- Corrigir 14 achados altos (P1)
- Implementar testes para módulos críticos

**Status:** ⚠️ Revisão concluída com pendências críticas

---

## [2026-03-25] — MVP12 Planejado: i18n Nativa + Export/Import

**Participantes:** Human + AI

**O que foi feito:**
- Análise completa do código existente
- Identificação de lacunas no plano original:
  1. Agentes são file-based, precisam migrar para DB
  2. CLI não existe, precisa ser criado
  3. I18n parcial (tooltips only), precisa ser estendido
- Decisões tomadas:
  1. Migração file-based → DB: **uma vez**, DB é fonte de verdade
  2. Escopo preferredLocale: **ambos** (system prompt + knowledge retrieval)
  3. CLI: pacote separado `packages/cli/`

**Plano atualizado:**
- **FASE 0:** Model Agent + Migração File→DB (NOVA)
- **FASE 1:** Prisma Migrations + Entidades i18n/portability
- **FASE 2:** i18n Backend (API)
- **FASE 3:** Language Detection (Python + langdetect)
- **FASE 4:** Export de Agentes (BundleBuilder)
- **FASE 5:** Import de Agentes (transação atômica)
- **FASE 6:** UI i18n Frontend (i18next)
- **FASE 7:** UI Export/Import (modais + progress)
- **FASE 8:** CLI (NOVA - packages/cli/)
- **FASE 9:** Testes + Evals E2E

**Estimativa:** ~14 horas

**Dependências novas:**
- packages/api: archiver, unzipper
- apps/web: i18next, react-i18next
- packages/cli: commander
- services/cognitive-python: langdetect

**Status:** 📋 Planejado, aguardando implementação


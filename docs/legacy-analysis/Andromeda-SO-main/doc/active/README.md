# 🪐 Andromeda OS — MVP09: Foundation Security & Resilience

**Status:** 🔴 Próximo (pré-requisito de todos os MVPs futuros)
**Stack:** TypeScript / NestJS / Prisma / PostgreSQL / React / BullMQ / FastAPI

## O que é

Sistema operacional de agentes de IA com execução confiável, memória nativa,
auditoria independente e roteamento inteligente. MVP01→MVP08 implementados.
MVP09 fecha todas as lacunas críticas de segurança e resiliência.

## O que este MVP entrega

| Bloco | Descrição |
|---|---|
| A — IAM | JWT + RBAC `owner/admin/operator/viewer` + API Keys |
| B — Multi-tenancy | `tenantId` em todas entidades + isolamento lógico |
| C — API Versioning | Prefixo `/v1/` + Swagger + política deprecation |
| D — Rate Limiting | Throttling LLM + circuit breaker + loop protection |
| E — Backup & Recovery | pg_dump agendado + vault snapshot + task resume |
| F — DLQ | Dead letter queue BullMQ + retry backoff + UI inspeção |
| G — Soft Delete | `deletedAt/archivedAt` em todas entidades + filtros |
| H — Health Check | `/v1/health` consolidado + degradação graciosa |
| I — Ambientes | `dev/staging/prod` + CI/CD base + seed por ambiente |

## Critérios de pronto

- [ ] Login JWT funcionando no painel
- [ ] Todas entidades com `tenantId` migradas
- [ ] APIs prefixadas `/v1/`
- [ ] Rate limiting ativo nas rotas públicas
- [ ] Circuit breaker ativo para providers LLM
- [ ] Backup agendado configurado
- [ ] DLQ visível no painel
- [ ] Health check respondendo
- [ ] Soft delete nas entidades principais
- [ ] Ambiente staging operacional

## Fora do escopo

OAuth/SSO externo, billing multi-tenant completo, multi-região, SIEM completo.

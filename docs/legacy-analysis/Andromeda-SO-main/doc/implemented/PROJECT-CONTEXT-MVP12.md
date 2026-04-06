# PROJECT-CONTEXT.md — Andromeda OS
**Última atualização:** 2026-03-25  
**Status atual:** MVP12 implementado ✅

---

## Elevator Pitch

Sistema operacional de agentes de IA com skill-first, auditoria independente, memory nativa, orquestração de tasks e multi-channel (web/CLI/Telegram). Arquitetura Clean com TypeScript como núcleo operacional e Python para serviços cognitivos avançados.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Backend API | TypeScript 5.3 + Express + Prisma + PostgreSQL |
| Frontend | Next.js 14 + React 19 + Tailwind v3 + shadcn/ui |
| Realtime | WebSocket nativo no Express |
| Filas / DLQ | BullMQ + Redis 7 |
| Autenticação | JWT (jsonwebtoken + bcrypt) + RBAC |
| Python Cognitive | FastAPI + langdetect + ChromaDB/Qdrant |
| Containerização | Docker + Docker Compose |

---

## MVPs Concluídos

| MVP | Foco | Status |
|-----|------|--------|
| MVP01 | Kernel Fundacional — Task Model, Skill Registry, Audit | ✅ |
| MVP02 | Communication Gateway — UnifiedMessage, Sessions | ✅ |
| MVP03 | Realtime Console — WebSocket, Event Streaming | ✅ |
| MVP04 | Model Center & LLM Router — Benchmark, Cost Tracking | ✅ |
| MVP05 | Hybrid Foundation — TS + Python Bridge, FastAPI | ✅ |
| MVP06 | Agent Identity & Safeguards — identity/soul/rules/playbook | ✅ |
| MVP06B/C | Sandbox Complete — SandboxProfile, Execution, Approvals | ✅ |
| MVP-Rev | Saneamento Estrutural — Prisma migrations, runtime integration | ✅ |
| MVP07 | Memory Layer v1 — Session, Episodic, Semantic Memory | ✅ |
| MVP08 | Knowledge Layer v1 — RAG por agente, Obsidian Vault, Syncthing | ✅ |
| MVP09 | Foundation — Auth/JWT/RBAC, Multi-tenancy, DLQ, Backup, Health Check | ✅ |
| MVP10 | Agent Evolution — Versioning, Budget Control, Feedback Loop | ✅ |
| MVP11 | Planner + Agent Handoff — ExecutionPlan, TaskGraph, HandoffProtocol | ✅ |
| MVP12 | i18n Nativa + Agent Portability — Locale, Messages, Export/Import, CLI | ✅ |

---

## MVP Atual: MVP12 — i18n Nativa + Export/Import de Agentes

**Status:** ✅ Implementado

**Objetivos:**
1. Internacionalização real em 3 camadas (UI / Agent Locale / System Messages + Knowledge)
2. Portabilidade completa de agentes via bundle `.andromeda-agent`
3. CLI para export/import de agentes
4. Migração de agentes file-based para database

**Decisões de arquitetura:**
- Migração Agent: **uma vez** — DB é fonte de verdade, `.md` descartados
- Escopo preferredLocale: **ambos** — System prompt + Knowledge retrieval
- Localização CLI: **pacote separado** — `packages/cli/`

**Documentação ativa:**
- `doc/active/MVP12-PRD.md` — Requisitos
- `doc/active/EDD-MVP12.md` — Engineering Design
- `doc/active/Implementation-Plan-MVP12.md` — Plano de implementação (atualizado)

**Fases implementadas:**
| Fase | Descrição | Status |
|------|-----------|--------|
| 0 | Model Agent + Migração File→DB | ✅ |
| 1 | Prisma Migrations (i18n fields, models novos) | ✅ |
| 2 | i18n Backend (I18nService, rotas, seeds) | ✅ |
| 3 | Language Detection (Python + TypeScript integration) | ✅ |
| 4 | Export de Agentes (BundleBuilder, rotas) | ✅ |
| 5 | Import de Agentes (BundleValidator, BundleImporter, conflitos) | ✅ |
| 6 | UI i18n Frontend (i18next, LocaleSwitcher) | ✅ |
| 7 | UI Export/Import (modais, componentes) | ✅ |
| 8 | CLI (comandos export/import/i18n) | ✅ |
| 9 | Testes (i18n.test.ts, export-import.test.ts) | ✅ |

**Arquivos principais (novos):**
- `packages/api/src/modules/i18n/` — LocaleRepository, MessageRepository, I18nService
- `packages/api/src/modules/agent-portability/` — BundleBuilder, BundleValidator, ImportAgentUseCase
- `services/cognitive-python/app/routers/language.py` — Language detection endpoint
- `apps/web/src/i18n.ts` — i18next configuration
- `apps/web/src/components/LocaleSwitcher.tsx` — Language switcher component
- `packages/cli/` — CLI package with export/import commands

---

## Estrutura do Monorepo

```
Andromeda-SO/
  packages/
    api/                 # Express/TS — núcleo operacional
      src/modules/
        communication/   # Gateway, channels, WebSocket
        agent-management/# Identidade, safeguards, CRUD
        sandbox/         # Execução isolada, approvals
        memory/          # Session, Episodic, Semantic
        knowledge/       # RAG, vault, ingestão, retrieval
        model-center/    # Providers, benchmark, router
        i18n/            # ✅ MVP12 — locale registry, messages
        agent-portability/ # ✅ MVP12 — export/import bundles
      prisma/
        schema.prisma    # 30+ modelos (Agent, AgentBundle, AgentImportJob, etc.)
        migrations/      # 10+ migrations aplicadas
    core/                # Domínio puro — entidades, ports
    cli/                  # ✅ MVP12 — CLI para export/import/i18n
  apps/
    web/                 # Next.js 14 — dashboard Nebula
      src/locales/       # ✅ MVP12 — pt-BR/, en-US/
      src/components/    # LocaleSwitcher, AgentExportModal, AgentImportModal
  services/
    cognitive-python/    # FastAPI — RAG, memory, language detection
      app/routers/
        language.py      # ✅ MVP12 — langdetect endpoint
        retrieval.py     # ✅ MVP12 — filtro por lang
  doc/
    active/              # Documentação do MVP em curso
    implemented/         # PRDs finalizados MVP01–MVP12
    planning/            # Roadmap, ADRs, MVPs futuros
```

---

## Schema Prisma — Modelos Principais

**Core:** Task, TaskStep, Skill, SkillExecution, AuditLog, Agent, AgentVersion, AgentPerformanceRecord  
**Communication:** CommunicationSession, GatewayEvent, UnifiedMessage  
**Sandbox:** SandboxProfile, SandboxExecution, ApprovalRequest  
**Memory:** MemoryEntry (session/episodic/semantic)  
**Knowledge:** KnowledgeCollection, KnowledgeDocument (+ detectedLang MVP12), KnowledgeChunk, RetrievalRecord  
**Model:** LlmProvider, ModelCapability, LlmUsageRecord  
**Auth/Tenancy:** User, Tenant, ApiKey, RateLimitConfig  
**Resilience:** DeadLetterJob, BackupRecord, HealthCheckLog  
**Planner:** ExecutionPlan, PlanStep, AgentHandoff  
**i18n (MVP12):** LocaleRegistry, LocalizedMessage, UserPreferences, Agent.preferredLocale  
**Portability (MVP12):** AgentBundle, AgentImportJob, AgentImportStatus, ConflictPolicy

---

## Agentes do Sistema (20+)

orchestrator, planner, coder, reviewer, auditor, researcher, memory-manager,  
knowledge-curator, model-selector, sandbox-guard, skill-composer, feedback-analyst,  
budget-monitor, versioning-agent, retrieval-optimizer, language-detector (MVP12),  
import-validator (MVP12), e outros especializados por domínio.

---

## Roadmap Futuro (pós-MVP12)

| MVP | Foco |
|-----|------|
| MVP13 | Multi-channel Nebula + Notificações Proativas (Telegram, Discord, CLI) |
| MVP14 | Eval Engine + Benchmark Cognitivo |
| MVP15 | Skill Marketplace + Security Audit |
| MVP16 | Device Agent IoT + Edge Control (ESP32, Arduino, Raspberry Pi) |
| MVP17 | Incident Alerting + Team Workspaces |
| MVP18 | Autonomy — Long-running Agents (loop AutoResearch) |
| MVP19 | Reflexive Memory + Agent Marketplace público |

---

## Ferramentas Externas Planejadas

| Ferramenta | Repositório | MVP Alvo |
|-----------|-------------|----------|
| CLI-Anything | github.com/HKUDS/CLI-Anything | MVP13+ |
| AutoAgent | github.com/HKUDS/AutoAgent | MVP13+ |
| AutoResearch (Karpathy) | github.com/karpathy/autoresearch | MVP18 |

---

## Regras Arquiteturais (invioláveis)

1. **Clean Architecture** — use cases nunca acoplados a controllers
2. **Skill-first** — prefer determinístico antes de LLM
3. **Audit trail 100%** — todo evento auditável
4. **Python NÃO tem banco próprio** — apenas o TS/Prisma acessa PostgreSQL
5. **Migrations sempre via Prisma** — nunca SQL manual
6. **RBAC em todas as rotas** — nenhum endpoint sem verificação de permissão
7. **Transações atômicas** — operações multi-entidade sempre em $transaction
8. **Commits:** `feat(mvpXX): descrição`, `fix(módulo): descrição`

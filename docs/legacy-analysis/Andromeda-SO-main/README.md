# 🪐 Andromeda OS

> Sistema operacional de agentes de IA orientado a execução confiável, memória útil,
> skills reutilizáveis, auditoria independente e roteamento inteligente de capacidade.

**Desenvolvido no Antigravity via Vibe Code** | Status atual: **MVP12 implementado ✅**

---

## 🎯 O que é

Andromeda OS substitui a imprevisão de chamadas LLM diretas por uma arquitetura com
contratos claros, execução rastreável e preferência explícita por mecanismos
determinísticos quando mais adequados.

```
User → Web Console → Communication Gateway → Kernel Task System
       ↓                      ↓                      ↓
Session Layer         Event Normalizer          Execution Engine
       ↓                      ↓                      ↓
  Timeline UI         WebSocket Stream         Audit + Memory + Knowledge
```

---

## 🏗️ Stack

| Camada | Tecnologia |
|---|---|
| Control Plane | TypeScript / NestJS |
| Banco | Prisma + PostgreSQL |
| Frontend | React / Next.js |
| Cognitivo | Python / FastAPI |
| Filas | BullMQ |
| Realtime | WebSocket |
| RAG | Vector Store (por agente) |

---

## 📂 Estrutura do Repositório

```
/
├── apps/
│   ├── api/                        # Backend principal (TypeScript/NestJS)
│   │   └── src/modules/
│   │       ├── auth/               # IAM — JWT, RBAC, API Keys (MVP09)
│   │       ├── communication/      # Gateway, sessions, channels
│   │       ├── tasks/              # Kernel de tasks
│   │       ├── agents/             # Identity, safeguards, sandbox
│   │       ├── memory/             # Memory Layer (MVP07)
│   │       ├── knowledge/          # Knowledge Layer + Obsidian (MVP08)
│   │       ├── models/             # Provider, catalog, LLM router
│   │       ├── backup/             # Backup agendado (MVP09)
│   │       ├── health/             # Health check consolidado (MVP09)
│   │       └── observability/      # Timelines, audit, eventos
│   └── web/                        # Frontend (React/Next.js)
│
├── packages/
│   └── core/                       # Contratos, DTOs, shared types
│
├── services/
│   └── cognitive-python/           # FastAPI — camada cognitiva Python
│
├── doc/                            # Documentação Vibe Code
│   ├── active/                     # MVP em desenvolvimento ativo
│   ├── planned/                    # MVPs futuros
│   ├── implemented/                # MVPs concluídos
│   └── README.md
│
└── .andromeda/
    └── CLAUDE.md                   # Constituição do agente (lida antes de cada sessão)
```

---

## 🎯 Princípios Inegociáveis

- **Confiabilidade antes de eloquência** — sistema previsível vale mais que sistema impressionante
- **Skill antes de LLM** — se existe skill para a tarefa, usa a skill
- **O pedido do usuário manda** — inclusive com override explícito de modelo
- **Toda tarefa relevante deve deixar trilha auditável**
- **Executor e auditor são entidades diferentes**
- **Memória é infraestrutura nativa**, não plugin opcional
- **Agente é abstração de capacidade**, não sinônimo de chamada LLM
- **Python é camada cognitiva** — TypeScript é o control plane

---

## 🗺️ Progresso dos MVPs

| MVP | Status | Descrição |
|---|---|---|
| MVP01 | ✅ | Kernel Fundacional |
| MVP02 | ✅ | Communication Gateway |
| MVP03 | ✅ | Realtime Operational Console |
| MVP04 | ✅ | Model Center & LLM Router |
| MVP05 | ✅ | Fundação Híbrida TS/Python |
| MVP06 | ✅ | Agent Identity & Safeguards |
| MVP06B | ✅ | Sandbox Subsystem |
| MVP06C | ✅ | Sandbox Complete + Hybrid Bridge |
| MVP-Rev | ✅ | Saneamento Estrutural |
| MVP07 | ✅ | Memory Layer v1 |
| MVP08 | ✅ | Knowledge Layer v1 + Obsidian |
| **MVP09** | 🔄 | **Foundation: Security, Resilience & DevOps** |
| MVP10 | 📋 | Agent Evolution + Budget Control |
| MVP11 | 📋 | Planner + Agent Handoff Protocol |
| MVP12 | 📋 | i18n Nativa + Export/Import |
| MVP13 | 📋 | Multi-channel Nebula + Notificações |
| MVP14 | 📋 | Eval Engine & Benchmark Cognitivo |
| MVP15 | 📋 | Skill Marketplace & Intelligence |
| MVP16 | 📋 | Device Agent (IoT / Edge) |
| MVP17 | 📋 | Incident & Alerting + Team Workspaces |
| MVP18 | 📋 | Autonomy & Long-running Agents |
| MVP19 | 📋 | Reflexive Memory & Agent Marketplace |

---

## 🚀 Como rodar (desenvolvimento)

```bash
# 1. Verificar requisitos locais (node, npm, python e docker)
npm run start:check

# 2. Subir tudo o que o projeto precisa
npm run start:project

# ou execute direto pela raiz no Windows
./start-project.cmd

# API:    http://localhost:5000
# Web:    http://localhost:5173
# Python: http://127.0.0.1:8008
# Docs:   http://localhost:5000/v1/docs

# Auditoria local da API (com stack em execucao)
npm run audit:local

# E2E principal de agentes
npm run test:e2e:agents
```

O comando `npm run start:project`:

- valida `node`, `npm`, `python` e `docker`
- confirma se o Docker daemon esta ativo
- instala dependencias Node se `node_modules/` ainda nao existir
- instala dependencias Python de `services/cognitive-python/requirements.txt` se estiverem faltando
- sobe `postgres` e `redis`
- sincroniza o schema do banco
- inicia API, Web e Cognitive Python

---

## 🧪 Testes

```bash
npm run test:unit         # testes unitários
npm run test:integration  # testes de integração (requer banco)
npm run test:e2e          # end-to-end completo
npm run test:regression   # suite de regressão MVP01→MVP08
```

---

## 🚫 Anti-patterns Proibidos

- ❌ Controller com regra de negócio → use Use Cases
- ❌ Gateway chamando task system via HTTP interno
- ❌ Frontend consumindo entidade crua de domínio → use DTOs
- ❌ Python como control plane → Python é camada cognitiva
- ❌ Sandbox sem persistência real
- ❌ `prisma.findMany()` sem `tenantId` no where (MVP09+)
- ❌ JWT secret ou senha em qualquer nível de log
- ❌ BCRYPT_ROUNDS < 12 em produção (LEI 05)
- ❌ Senha sem validação de complexidade (LEI 07)
- ❌ API key em texto plano no banco (LEI 04)
- ❌ Uso de `live_` keys em ambiente de dev/test (LEI 13)

---

## 📚 Documentação

- **Vibe Code (local):** `doc/active/` — fonte de verdade para o Antigravity
- **Notion (central):** [🪐 Andromeda OS — Base de Documentação](https://www.notion.so/328b260a53a681d38ee8c840fa8d3533)
- **Constituição do agente:** `.andromeda/CLAUDE.md`

> Em caso de conflito entre doc local e Notion, **o Notion prevalece**.

---

Como usar:

./start-project.cmd na raiz.
_Última atualização: 2026-03-19 | MVP08 ✅ | MVP09 🔄_

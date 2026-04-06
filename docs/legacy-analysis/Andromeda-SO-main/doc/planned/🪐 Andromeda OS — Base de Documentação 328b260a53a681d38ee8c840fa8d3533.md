# 🪐 Andromeda OS — Base de Documentação

# Visão Geral do Projeto

O **Andromeda OS** é um sistema operacional de agentes de IA orientado a execução confiável, memória útil, skills reutilizáveis, auditoria independente e roteamento inteligente de capacidade. O objetivo é substituir imprevisição por uma arquitetura com contratos claros, execução rastrecável e preferência explícita por mecanismos determinísticos quando mais adequados.

> **Desenvolvido no Antigravity via Vibe Code** | Status atual: **MVP08 em implementação**
> 

---

# 🎯 Princípios Inegociáveis

- Confiabilidade operacional antes de elocüuência
- Skill antes de LLM sempre que possível
- O pedido do usuário manda, inclusive com override explícito de modelo
- Toda tarefa relevante deve deixar trilha auditável
- Executor e auditor são entidades diferentes
- Memória é infraestrutura nativa, não plugin opcional
- Agente é abstração de capacidade, não sinônimo de chamada LLM
- A UI deve servir operação real

---

# 🏗️ Arquitetura Central

## Camadas do Sistema

| Camada | Responsabilidade | Padrões |
| --- | --- | --- |
| Interface Delivery | Painel web, API HTTP, autenticação e validação | Controller, DTO, Validation |
| Application Orchestration | Casos de uso, coordenação, execução | Use Case, Factory, Strategy |
| Domain Core | Regras centrais, Task Object, policies e estados | State Machine, Policy, Specification |
| Infrastructure | Banco, fila, vector store, providers e adapters | Ports & Adapters, Repository |

## Fluxo Macro do Sistema

```
User → Web Console → Communication Gateway → Kernel Task System
       ↓                      ↓                      ↓
Session Layer         Event Normalizer          Execution Engine
       ↓                      ↓                      ↓
  Timeline UI         WebSocket Stream         Audit + Memory
```

## Stack Técnica

- **Control Plane:** TypeScript (Node.js / NestJS)
- **Cognição especializada:** Python (FastAPI — cognitive-python service)
- **ORM / Banco:** Prisma + PostgreSQL
- **Frontend:** Web App (React/Next.js)
- **Comunicação realtime:** WebSocket
- **Armazenamento vetorial:** Vector Store (RAG por agente)
- **Monorepo:** estrutura `apps/` + `packages/`

---

# 🗺️ Roadmap de MVPs

## ✅ MVP01 — Kernel Fundacional

**Objetivo:** Validar a tese central — task model, skills, memória básica, agentes híbridos, auditoria e observabilidade.

**Entregas principais:**

- Task Object, estados e eventos
- Skill Registry + execução skill-first
- Agent Runtime (executor LLM + script)
- LLM Router v0
- Auditoria independente
- Memória básica (sessão, episódica, semântica)
- RAG por agente v0
- Painel operacional mínimo

---

## ✅ MVP02 — Communication Gateway

**Objetivo:** Criar a camada de comunicação do sistema — gateway como ponto único de entrada pública.

**Entregas principais:**

- Módulo `communication` com Clean Architecture
- `UnifiedMessage` e `UnifiedResponse` como contratos estáveis
- Endpoint `POST /gateway/message`
- Autenticação por Bearer token por canal
- Session Resolver operacional
- Integração com task system via `TaskIngressPort`
- Esqueleto WebSocket (preparação)
- Visual States: `idle | listening | thinking | toolexecution | speaking | success | error`

---

## ✅ MVP03 — Realtime Operational Console

**Objetivo:** Transformar o Andromeda em um sistema operável em tempo real via interface web.

**Entregas principais:**

- WebSocket funcional no gateway (`WS /gateway/ws`)
- Event Normalization (`GatewayRealtimeEvent`)
- Session Timeline + Task Timeline
- Read models para frontend (`ConversationSessionView`, `TaskExecutionView`, etc.)
- Web Console oficial (console, sessões, detalhe de task, timeline)
- Camada visual compatível com Nebula (estados cognitivos)
- Observabilidade completa sem CLI

---

## ✅ MVP04 — Model Center & Intelligent LLM Router

**Objetivo:** Central de modelos com benchmark, custo, score e roteamento inteligente baseado em evidência.

**Entregas principais:**

- Provider Center (Ollama local + cloud, extensivível)
- Model Catalog com capabilities, custo e saúde
- Capability Registry oficial (`coding | debug | security | vision | rag | ...`)
- Benchmark Engine por tipo de atividade
- Router Scoring Service (qualidade × latência × custo × estabilidade)
- Routing Decision Log com explicabilidade
- UI: Providers, Catálogo, Router Intelligence, Benchmark Lab

---

## ✅ MVP05 — Fundação Híbrida TS/Python

**Objetivo:** Estabelecer a arquitetura híbrida com Python como camada cognitiva especializada.

**Entregas principais:**

- Serviço `services/cognitive-python` (FastAPI)
- Contratos Pydantic estáveis (request/response canônicos)
- `CognitiveServiceAdapter` no TypeScript
- Auth serviço-a-serviço
- Tracing básico ponta a ponta
- Testes de contrato TS ↔ Python

---

## ✅ MVP06 — Agent Identity, Safeguards & Agent Console

**Objetivo:** Transformar agentes em entidades governáveis, consistentes, auditáveis e configuráveis.

**Entregas principais:**

- `AgentProfile` com `identity.md`, `soul.md`, `rules.md`, `playbook.md`, `context.md`
- Behavior Safeguards Engine (5 camadas: pre/in/post execution)
- Score de aderência comportamental (identity, tone, policy, delegation, conformance)
- Agent Management UI (lista, editor, ajustes comportamentais, presets)
- Conversa direta com agente via Console (targetAgentId no metadata)

---

## ✅ MVP06B — Sandbox Subsystem

**Objetivo:** Camada de enforcement entre a decisão do agente e a ação efetiva no sistema.

**Entregas principais:**

- `CapabilityPolicyEngine` → `SandboxPolicyResolver` → `SandboxValidator` → `ApprovalGate` → `SandboxRunner`
- Modos: `none | process | container | remote`
- Policies: filesystem, network, resources, execution, security, IO, audit, approvals
- Princípios: deny-by-default, most-restrictive-wins, auditability-by-default
- Persistência: `sandbox_profiles`, `sandbox_executions`, `sandbox_artifacts`, `approval_requests`
- REST API completa + UI de sandbox por agente

---

## ✅ MVP06C — Sandbox Complete + Hybrid Bridge

**Objetivo:** Fechar completamente o subsistema Sandbox e fundar a ponte TS/Python.

**Entregas principais:**

- Persistência real via Prisma (migrations + repositories concretos)
- Fluxo ponta a ponta: policy → approval → runner → artifacts → audit
- `ProcessSandboxRunner` real; `ContainerSandboxRunner` base
- `ApprovalRequest` e fluxo de aprovação
- `services/cognitive-python` com FastAPI base + contratos Pydantic
- `CognitiveServiceAdapter` no TS + testes de contrato

---

## ✅ MVP-Revisão — Saneamento Estrutural

**Objetivo:** Fechar pendências críticas, alinhar implementação ao desenho arquitetural, preparar base para MVP07.

**Entregas principais:**

- Sandbox migrada para Prisma/PostgreSQL
- Correção do `metadata.context` no fluxo Console → Gateway → Task
- Sandbox integrada ao runtime operacional real como enforcement
- Correção do frontend (aba Sandbox, dados do agente)
- Reorganização de testes e workspaces
- Suíte mínima de regressão

---

## ✅ MVP07 — Memory Layer v1

**Objetivo:** Primeira camada operacional de memória nativa — útil, previsível e governável.

**Entregas principais:**

- **Session Memory:** contexto de curto prazo por sessão/canal
- **Episodic Memory:** episódios operacionais relevantes (tasks, falhas, decisões)
- **Semantic Memory básica:** fatos estáveis, preferências, convenções
- Entidades: `MemoryEntry`, `MemoryLink`, `MemoryRetrievalRecord`, `MemoryPolicy`
- Integração ao runtime: `RetrieveMemoryForTask` → `AttachMemoryToExecutionContext`
- API REST de memória (CRUD + pin/invalidate/promote)
- UI operacional de memória no painel
- Rastreabilidade: toda memória usada em execução gera `MemoryRetrievalRecord`

---

## 🔄 MVP08 — Knowledge Layer v1 *(Em implementação — atual)*

**Status:** Em desenvolvimento ativo no Antigravity

**Objetivo:** Fazer o Andromeda avançar de sistema com memória operacional básica para sistema capaz de ingerir conhecimento externo, indexar conteúdo por agente/projeto/equipe, recuperar contexto documental relevante em tempo de execução, exibir grounding na interface e integrar um vault Obsidian como base de conhecimento controlada.

> 📌 **Princípio central:** Conhecimento ≠ Memória. Os dois subsistemas cooperam mas são separados.
> 

**Blocos obrigatórios:**

- **Bloco A — Knowledge Layer Core:** Coleções por agente/equipe/projeto, entidades `KnowledgeDocument`, `KnowledgeChunk`, `RetrievalRecord`, `AgentKnowledgePolicy`
- **Bloco B — Ingestão documental:** Upload (`.md .txt .pdf .docx .json`) + criação manual de documento por texto digitado via web
- **Bloco C — Retrieval por agente:** Recuperação contextual com filtros (agente/coleção/sensibilidade), reranking básico, context assembly (memória MVP07 + conhecimento MVP08)
- **Bloco D — Interface Web `Knowledge`:** Subáreas: Collections, Documents, Retrieval, Vaults, Permissions, Jobs
- **Bloco E — Config do agente:** Nova seção *Knowledge & Vault Access* na tela do agente (knowledgeEnabled, allowedCollections, vaultRead/Write, maxChunks, rerankEnabled...)
- **Bloco F — Integração Obsidian:** Vault como pasta no filesystem; indexar `.md`, capturar frontmatter, tags, wiki links, path relativo
- **Bloco G — Syncthing:** Vault sincronizado via Syncthing/Syncthing-Fork → Andromeda lê cópia local monitorada → watcher reindexa incrementalmente
- **Bloco H — Escrita controlada no vault:** Modos `disabled | draft_only | append_only | managed_write`; fluxo: agente propõe → humano aprova → adapter grava → evento auditado → watcher reindexa
- **Bloco I — APIs mínimas:** `/knowledge/collections`, `/knowledge/documents`, `/knowledge/retrievals`, `/knowledge/vaults`, `/agents/:id/knowledge-policy`, `/knowledge/vault-write-proposals`
- **Bloco J — Contratos TS ↔ Python:** Cognitive service expandido para parse/chunk/embed/index/retrieve; contratos Pydantic versionados com `collectionIds`, `selectedChunks`, `scoreSummary`
- **Bloco K — Watchers & Pipeline:** Watcher de vault (create/update/delete); pipeline: discovery → read → normalize → parse → chunk → embed → index → persist → audit; jobs com status `queued | running | completed | failed | retrying`
- **Bloco L — Auditabilidade:** Retrieval registra consulta, filtros, chunks, score, origem; escrita no vault registra agente, task, proposal, approvedBy, path, tipo de operação
- **Blocos M/N — Testes e Critérios de Pronto:** Unit, integration, contract, e2e e regression suite; RAG funcional real, UI sem mock, vault controlado por agente, escrita protegida por approval

**Ordem de implementação:**

1. Modelagem + migrations + entidades + repositories
2. APIs de collections / documents / policies / vaults
3. `cognitive-python`: parse / chunk / embed / index / retrieve
4. Upload documental e documento manual
5. Retrieval real no runtime
6. Interface web Knowledge
7. Watcher e reindexação incremental de vault
8. Proposals de escrita com approval
9. Testes de integração / e2e / regressão
10. Endurecimento final de políticas, auditoria e UX

**Fora do escopo do MVP08:** Planner multi-etapas, coordenação multiagente avançada, multimodal amplo, OCR pesado como eixo, knowledge graph avançado, escrita irrestrita no vault, deleção livre de notas pelo agente

---

# 📋 Entidades Centrais do Domínio

> ℹ️ Entidades marcadas com *(planejada)* foram definidas na sessão de design de 2026-03-19 e ainda não implementadas.
> 

## Task System (Kernel)

- `Task` — unidade central de trabalho
- `TaskTimeline` — trilha cronológica da execução
- `AuditRecord` — parecer independente do auditor
- `Skill` — capacidade determinística reutilizável

## Communication Layer

- `UnifiedMessage` — contrato estável de mensagem normalizada
- `CommunicationSession` — sessão operacional por canal
- `UnifiedResponse` — resposta com visual state e meta

## Agent System

- `AgentProfile` — identidade + alma + regras + playbook + contexto
- `AgentBehaviorSnapshot` — estado comportamental auditado
- `AgentSandboxConfig` — política de sandbox por agente

## Memory System

- `MemoryEntry` — unidade de memória (session/episodic/semantic)
- `MemoryLink` — relacionamento com entidades operacionais
- `MemoryRetrievalRecord` — rastro de uso da memória
- `MemoryPolicy` — política de retenção por tipo e escopo

## Model System

- `ModelCatalogItem` — modelo com capabilities, custo e scores
- `ModelBenchmarkResult` — resultado de benchmark por atividade
- `RoutingDecision` — decisão do router com explicabilidade
- `LlmBenchmark` *(planejada)* — score on-demand por modelo/task com latency e cost
- `EvalDataset` *(planejada)* — dataset tipado com questions/expected por domínio

## Skill System

- `SkillAudit` *(planejada)* — resultado de audit de segurança por skill (score, risks, status, hash)
- `SkillRuntimeAlert` *(planejada)* — alertas gerados durante execução de skill com risco

## Agent Templates

- `AgentTemplate` *(planejada)* — template versionado com sandbox, tools, safeguards e RAG pré-configurados

## User Profile

- `UserProfile` *(planejada)* — perfil do usuário com hobbies, preferências e fontes (consent obrigatório)
- `ProfileInsight` *(planejada)* — dado extraído de vault/conversa com origem e nível de confiança

---

# 🔑 Contratos Principais

## IDs Obrigatórios em Todo Fluxo

Todo evento/trace deve carregar: `requestId`, `correlationId`, `messageId`, `sessionId`, `taskId`, `auditId`

## Visual States (Nebula-compatible)

`idle | listening | thinking | toolexecution | speaking | success | error`

## Capability Registry

`chat | analysis | reasoning | planning | coding | debug | architecture | security | pentest | vision | audio | stt | tts | tools | functioncalling | automation | memory | rag | ...`

---

# 🔎 Observações de Implementação (2026-03-19)

> Registradas após revisão visual das telas do Agent Console em produção (MVP06 implementado).
> 

## Safeguards — Kernel Agent

- **`Prioritize skill-first routing` deve ser `ON` por padrão** no Andromeda Kernel e em qualquer agente do tipo Orchestrator. Deixar desligado contradiz diretamente o princípio inegociável *"Skill antes de LLM sempre que possível"*. Corrigir no preset do template Orchestrator e no seed do Andromeda Kernel.

## Behavior Tab — UX Gap

- **Sliders abaixo do `Minimum Conformance`** configurado na aba Safeguards devem receber **destaque visual** (borda vermelha ou ícone ⚠️). Exemplo: `Evidence: 68` com `Min Conformance: 70` — o usuário não tem feedback visual de que aquela dimensão está abaixo do limiar. Implementar como regra de validação reativa na UI do Behavior Tab.

## Identity — UX Minor

- Campo `Conformance: n/a` em agentes novos deve exibir **tooltip** `"Execute tarefas para gerar o conformance score"` em vez de ficar vazio sem contexto.

---

# 🚫 Anti-patterns Proibidos (Global)

- Controller com regra de negócio
- Gateway chamando task system via HTTP interno
- Frontend consumindo entidade crua de domínio
- Sessão virando memória cognitiva antes do tempo
- Sandbox sem persistência real
- Memória registrada sem critério de relevância
- Duplicar lógica do kernel em outro módulo
- Python como control plane (Python é camada cognitiva)
- Logíca central empurrada para adapter ou infra

---

# 📂 Estrutura de Repositório (Monorepo)

```
/
├── apps/
│   ├── api/                  # Backend principal (TypeScript)
│   │   └── src/modules/
│   │       ├── communication/  # Gateway, sessions, channels
│   │       ├── tasks/           # Kernel de tasks
│   │       ├── agents/          # Identity, safeguards, sandbox
│   │       ├── memory/          # Memory Layer
│   │       ├── models/          # Provider, catalog, router
│   │       └── observability/   # Timelines, audit, eventos
│   └── web/                  # Frontend (React/Next.js)
├── packages/
│   └── core/                 # Contratos, DTOs, shared
└── services/
    └── cognitive-python/     # FastAPI — camada cognitiva Python
```

---

---

# 🔍 Lacunas Mapeadas & Dívida Técnica

> Esta seção registra as 15 lacunas estruturais identificadas após revisão completa da documentação MVP01→MVP08. Todas serão endereçadas nos MVPs seguintes conforme distribuição abaixo.
> 

## 🔴 Críticas (risco operacional imediato)

| # | Lacuna | MVP que resolve |
| --- | --- | --- |
| 1 | **Auth/IAM formal** — sem RBAC real, refresh token, revogação de acesso ou política de sessão | MVP09 |
| 2 | **Backup & Recovery** — sem estratégia de backup do banco, recovery de tasks em crash, snapshots do vault | MVP09 |
| 3 | **Rate Limiting & Circuit Breaker** — sem throttling de LLMs, proteção contra loops de agentes, circuit breaker de providers | MVP09 |

## 🟠 Estruturais (impactam evolução futura)

| # | Lacuna | MVP que resolve |
| --- | --- | --- |
| 4 | **Budget Control por agente** — custo é medido mas não há teto, alertas ou bloqueio automático por orçamento | MVP10 |
| 5 | **Dead Letter Queue formal** — sem DLQ, retry com backoff exponencial ou alerta de jobs órfãos | MVP09 |
| 6 | **Fundação multi-tenancy** — nenhuma entidade tem `tenantId`; refatoração será cara depois | MVP09 |
| 7 | **Versionamento de API** — sem `/v1/`, política de deprecation ou changelog de breaking changes | MVP09 |

## 🟡 Funcionais (afetam experiência e operação)

| # | Lacuna | MVP que resolve |
| --- | --- | --- |
| 8 | **Notificações proativas** — sistema é passivo; humano precisa abrir o painel para saber o que aconteceu | MVP13 |
| 9 | **Export/Import de agentes** — sem como exportar agente completo (perfil + políticas + knowledge) | MVP12 |
| 10 | **Ambientes múltiplos** — sem staging/dev/prod; toda atualização vai direto para produção | MVP09 |
| 11 | **Health Check consolidado** — sem `/health` que cubra banco, Redis, workers Python, vault sync, vector store | MVP09 |
| 12 | **Soft Delete & Archiving** — sem política de retenção; entidades somem ou ficam para sempre | MVP09 |

## 🔵 Estratégicas (habilitam próxima geração)

| # | Lacuna | MVP que resolve |
| --- | --- | --- |
| 13 | **Agent Handoff protocol** — delegação entre agentes sem contrato formal de transferência de contexto | MVP11 |
| 14 | **Feedback do usuário sobre resultados** — sem thumbs up/down ou nota; sistema melhora só com dados sintéticos | MVP10 |
| 15 | **Modo offline / degradação graciosa** — sem comportamento definido quando providers ou serviços ficam indisponíveis | MVP09 |

---

# 🗺️ Roadmap Expandido (pós-MVP08)

## 🔜 MVP08B — Features Planejadas (Sessão 2026-03-19)

> 📌 **Estas features foram concebidas e amadurecidas em sessão de design.** Serão distribuídas nos MVPs mais adequados conforme priorização, mas estão formalizadas aqui como decisões de produto já tomadas.
> 

### 🎭 Agent Templates

**Objetivo:** Criar um sistema de pré-configuração de agentes por tipo de uso. Na tela de criação de agente, um ComboBox permite selecionar um template canônico já com sandbox, tools, safeguards e RAG pré-configurados. O usuário customiza apenas a identidade (soul/persona) e pode sobrescrever qualquer preset.

**Templates canônicos identificados (pesquisa 2026):**

| Template | Sandbox | Tools | Safeguards | RAG Default | Modelo Sugerido |
| --- | --- | --- | --- | --- | --- |
| **Coder** | coderunner (process+write) | exec/read/write | boundary=strict, conformance=0.85 | project-docs, api-ref | gpt-4o-coding |
| **Auditor** | readonly | read/memory/sessions | conformance=0.95, feedback=always | audits, standards | claude-3.5-sonnet |
| **Researcher** | browser-safe | websearch/read/memory | cautious=true, cite=mandatory | knowledge-base | o1-preview |
| **Analyst** | data-reader | read/process/analyze | precision=high, verify=double | data-schemas | gpt-4o-mini |
| **Orchestrator** | orchestrator | gateway/delegate/cron | delegation=true, multi-agent | workflows, teams | claude-3-opus |
| **Writer** | content-safe | read/write | tone=consistent | style-guide | gpt-4o |
| **DevOps** | ops-runner | cron/process/network-limited | approval=network, audit=full | runbooks, infra | gpt-4o |
| **Legal** | readonly-legal | read/search | compliance=strict, cite=mandatory | laws, regulations | claude-3.5-sonnet |
| **Sales** | sales-safe | read/crm/email | ethical=true | products, clients | gpt-4o |
| **Marketing** | content-planner | read/analyze/write | brand-aligned=true | campaigns, brand | gpt-4o |

**UX Flow:**

1. Abrir "New Agent" → ComboBox com templates
2. Auto-fill: sandbox + tools + safeguards + RAG
3. Diff visual: 🟢 Preset | 🟡 Override do usuário
4. Usuário edita apenas SOUL/persona (identidade obrigatória)
5. Override livre de qualquer campo preset
6. Preview: simular como o agente responderia

**Entidades novas:**

- `AgentTemplate` — template versionado armazenado no DB
- Campo `templateKey` + `templateVersion` + `overrides` em `Agent`

**MVP alvo:** MVP06 (Agent Management UI) — extensão da tela de criação de agentes

---

### 🧪 LLM Benchmarking & Router Intelligence

**Objetivo:** Sistema de benchmark on-demand que testa múltiplos modelos em datasets por tipo de task, gerando scores reais para alimentar o LLM Router. Executado em momentos de baixa atividade ou sob demanda do usuário.

**Tipos de dataset por domínio:**

- `coding-ts` — 50 tasks TypeScript/Prisma/React
- `legal-br` — 30 casos LGPD + contratos
- `reasoning-math` — GSM8K subset
- `ops-devops` — Ansible/playbooks
- `research-factcheck` — 40 Q&A com sources
- `audit-review` — code review tasks
- `sales-pitch` — ethical sales scripts
- `marketing-copy` — brand-aligned content

**Arquitetura:**

```
User: "Benchmark now" (ou scheduled idle)
  ↓
Eval Suite Trigger → Select dataset
  ↓ Parallel
Models: GPT-4o | Claude-3.5 | Llama-405B
  ↓ Run evals
Metrics: accuracy / latency / cost → DB.llm_benchmarks
  ↓ Update
Router Scores → "GPT-4o: 94% coding | Claude: 88%"
```

**Score formula:** `Static 30% + Dynamic 40% + LLM-Judge 30%`

**Entidades novas:**

- `LlmBenchmark` — score por modelo/task com latency e cost
- `EvalDataset` — dataset com questions/expected tipadas

**UI:** Aba "LLM Router" com tabela de scores, filtro por dataset, trigger manual e toggle "Use Top Model Auto".

**MVP alvo:** MVP04 (Model Center) — extensão do Benchmark Engine

---

### 🔒 Skill Security Audit System

**Objetivo:** Auditoria obrigatória em toda skill nova instalada (OpenClaw/MCP compatível). Detecta ataques conhecidos, gera score 0-100, exibe relatório ao usuário e solicita confirmação. Skills instaladas com ressalvas ficam com badge de risco permanente visível no painel e geram alertas inline durante execução.

**Ataques mapeados (Snyk/Antiy 2026 — dados reais):**

| Ataque | Prevalência | Descrição |
| --- | --- | --- |
| **Prompt Injection** | 36% das skills | Skill ignora instruções via input malicioso |
| **Skill Poisoning** | 13-20% | Skill falsa substitui tool legítima |
| **Tool Chaining** | 91% maliciosas | Tool A dispara Tool B para exfiltrar dados |
| **Sandbox Breakout** | CVE-2026-25253 | Acesso a paths fora do workspace |
| **Credential Exfil** | 25% | Leitura de .env, secrets do host |
| **Log Poisoning** | Emergente | Logs com payloads injetados |

**Pipeline de audit (por skill instalada):**

1. **Static scan** (VirusTotal API + regex de padrões maliciosos)
2. **Sandbox dry-run** com 20+ vetores de injection conhecidos
3. **LLM-as-Judge** (Claude analisa manifesto semanticamente)
4. **Score final** = Static 30% + Dynamic 40% + Judge 30%

**Regras de decisão:**

- Score ≥ 80 → ✅ Aprovado (install direto)
- Score 70-79 → ⚠️ Review (install com confirmação e badge amarelo)
- Score < 70 → 🔴 Bloqueado (não instala sem override explícito)

**UX Install Dialog:**

```
Skill: git-analyzer v1.2  |  Score: 95/100 🟢
✅ Static Scan: 98  ✅ Sandbox: 92  ✅ Injection: 100  ✅ Judge: 94
Riscos: Nenhum crítico
[Instalar]  [Cancelar]
```

**Runtime monitoring:** Badge score sempre visível no Skills Tab. Alertas inline na task timeline quando skill com score < 80 é executada. Opção "Block" em 1-click.

**Entidades novas:**

- `SkillAudit` — score, risks, status, hash, timestamp
- `SkillRuntimeAlert` — alertas por execução com skill de risco

**MVP alvo:** MVP15 (Skill Marketplace & Intelligence) — adicionado como requisito obrigatório de segurança

---

### 📊 Skills Management Dashboard (UX)

**Objetivo:** Painel de gestão de skills com score de audit sempre visível em badge colorido. Click no badge abre modal com relatório completo (métricas por dimensão, histórico de versões, logs de runtime).

**Skills List (Cards/Grid):**

```
[git-analyzer v1.2]  🟢 95/100  [3 runs]  Tools: exec/read/write  2h ago
[weather-fetch v2.1] 🟡 78/100 ⚠️1      Tools: network/read      1d ago
```

**On-click score → Modal Audit Report:**

- Score breakdown: Static / Sandbox / Injection / Judge
- Lista de riscos com severidade
- Histórico de versões (v1.1: 92 → v1.2: 95)
- Botões: Re-run Audit | View Runtime Logs

**Filtros:** All | Safe (90+) | Review (70-89) | Risky (<70)

**CLI support:** `andromeda skills list` com badges coloridos por terminal

**MVP alvo:** MVP15 (extensão do Skill Center)

---

### 🧑‍💾 User Profiling Agent ("Know Your User")

**Objetivo:** O agente principal constrói progressivamente um perfil do usuário para personalizar recomendações e contexto de execução. Dados coletados via: vault Obsidian (para quem usa), descoberta conversacional orgânica e perguntas diretas opcionais.

**Fontes de dados (por ordem de privacidade):**

1. **Obsidian Vault** (MVP08) — extração de hobbies, interesses, contexto via LLM
2. **Conversas** — detecção de padrões + perguntas orgânicas ("Vi você mencionar sushi — é seu favorito?")
3. **RSS opt-in** — user adiciona feeds voluntariamente
4. **Upload manual** — user carrega exports de redes sociais

> ⚠️ **Auto-scraping de redes sociais é PROIBIDO.** Viola ToS de todas as plataformas e a LGPD/GDPR. Toda coleta é opt-in e com consent explícito.
> 

**Campos do perfil:**

- `music`, `food`, `hobbies`, `workStyle`, `communicationPreference`
- `sources` — de onde cada dado veio (transparência)
- `consent` — toggle obrigatório para habilitar profiling

**Princípios LGPD/GDPR obrigatórios:**

- Consent explícito antes de qualquer coleta
- Transparência: "Este dado veio de 3 conversas"
- Forget anytime: delete por categoria
- Data minimization: só dados úteis + TTL 90 dias
- Uso restrito: recomendações + contexto de task (nunca venda/treino)

**UX — Aba "Meu Perfil":**

```
✅ Profiling: Ativado  [Desativar]
🎵 Música: Rock, MPB  (3 conv + 2 notes Obsidian)
🍣 Comida: Sushi, Churrasco  (5 menções)
🏋️ Hobbies: Coding, Gym  (tags Obsidian)
[Esquecer Música]  [Re-scan Vault]  [Export JSON]
```

**Entidades novas:**

- `UserProfile` — perfil estruturado com fontes e consent
- `ProfileInsight` — dado extraído com origem e confiança

**MVP alvo:** MVP07 (Memory Layer) — extensão semântica do perfil do usuário como `SemanticMemory` especializada

---

## 🔜 MVP09 — Foundation: Security, Resilience & DevOps

**Objetivo:** Fechar as lacunas críticas e estruturais que foram acumuladas do MVP01 ao MVP08. Este MVP é de **endurecimento da fundação** — sem ele, o sistema não está pronto para crescer com segurança.

> ⚠️ **Alguns blocos exigem refatoração cirúrgica** de entidades existentes (ex: adição de `tenantId`, versionamento de API). Isso é esperado e necessário.
> 

**Blocos obrigatórios:**

- **Bloco A — IAM (Identity & Access Management):**
    - Autenticação formal: JWT com refresh token, rotação e revogação
    - RBAC: roles `owner | admin | operator | viewer` por recurso
    - API Keys para integrações externas (ex: canais Nebula)
    - Proteção de credenciais de providers (encryption at rest)
    - Auditoria de login, revogação e troca de permissões
- **Bloco B — Multi-tenancy Foundation:**
    - Adição de `tenantId` opcional em todas as entidades centrais (Task, Agent, Memory, KnowledgeCollection, Skill, Session)
    - Middleware de resolução de tenant por request
    - Isolamento lógico de dados por tenant
    - Refatoração cirúrgica: migrations + repositories + use cases
- **Bloco C — API Versioning:**
    - Prefixo `/v1/` em todas as rotas públicas
    - Política formal de deprecation (headers + changelog)
    - Documentação automática (OpenAPI/Swagger) por versão
    - Testes de contrato por versão
- **Bloco D — Rate Limiting & Circuit Breaker:**
    - Rate limiting por usuário/tenant/canal nas APIs
    - Throttling configurável de chamadas a providers LLM por agente
    - Circuit breaker para providers externos (LLM, Syncthing, vector store)
    - Proteção contra loops infinitos de agentes (max iterations policy)
    - Limite de tokens por sessão/dia configurável
- **Bloco E — Backup & Recovery:**
    - Backup automático do PostgreSQL (dump agendado)
    - Snapshot do vault Obsidian (antes de escritas gerenciadas)
    - Recovery de tasks em execução após crash (resume from checkpoint)
    - Política de retenção configurável por tipo de dado
    - Procedimento documentado de restore
- **Bloco F — Dead Letter Queue & Job Resilience:**
    - DLQ formal para jobs falhos (BullMQ)
    - Retry com backoff exponencial configurável
    - Alertas de jobs órfãos ou travados
    - Inspeção de DLQ no painel operacional
    - Reprocessamento manual de jobs mortos via UI
- **Bloco G — Soft Delete & Archiving:**
    - Soft delete em todas as entidades principais (campo `deletedAt`, `archivedAt`)
    - Política de retenção: `active | archived | soft-deleted | purge-scheduled`
    - Filtros por estado nas listagens (ocultar arquivados por padrão)
    - UI de arquivo/restauração no painel
- **Bloco H — Health Check & Status System:**
    - Endpoint `/v1/health` consolidado (banco, Redis, workers Python, vault sync, vector store, providers)
    - Endpoint `/v1/status` para degradação parcial
    - Modo de degradação graciosa: comportamento definido quando componentes ficam indisponíveis
    - Status page interna no painel operacional
- **Bloco I — Ambientes Múltiplos:**
    - Suporte formal a `NODE_ENV: development | staging | production`
    - `.env` por ambiente com validação de schema (Zod/Joi)
    - Seed de dados por ambiente
    - CI/CD pipeline base (GitHub Actions ou equivalente)
    - Deploy em staging antes de produção

**Critérios de pronto do MVP09:**

- Login real com JWT funcionando no painel
- Todas as entidades com `tenantId` migradas
- APIs prefixadas com `/v1/`
- Rate limiting ativo nas rotas públicas
- Circuit breaker ativo para providers LLM
- Backup agendado do banco configurado
- DLQ visível no painel
- Health check respondendo corretamente
- Soft delete funcionando nas entidades principais
- Ambiente de staging operacional

**Fora do escopo do MVP09:** OAuth/SSO externo, billing multi-tenant completo, multi-região, SIEM completo.

---

## 🔜 MVP10 — Agent Evolution & Versioning + Budget Control

**Objetivo:** Tornar agentes entidades que evoluem com o tempo de forma rastreável, e introduzir controle real de custos.

**Blocos principais:**

- Versionamento formal de `AgentProfile` (snapshot por versão, diff, rollback)
- Histórico de desempenho por agente (scores, falhas, conformance trend)
- Reputação por domínio/capability (calculada a partir de audit + evals)
- Comparação entre versões de um agente no painel
- Consolidação automática de lições aprendidas (episódios → playbook suggestions)
- **Budget Control:** teto de gasto configurável por agente/sessão/dia/mês
- Alertas de custo (threshold warning + hard stop)
- Dashboard de custos por agente, projeto e período
- Relatório exportável de consumo
- **Feedback do usuário:** thumbs up/down + nota opcional por resultado
- Feedback alimenta LLM Router, Agent Evolution e Evals

---

## 🔜 MVP11 — Planner & Multi-step Orchestration + Agent Handoff

**Objetivo:** Capacidade de decompor tarefas complexas em subtarefas orquestradas, com protocolo formal de transferência entre agentes.

**Blocos principais:**

- `ExecutionPlan` como entidade formal (etapas, dependências, estado)
- `PlannerAgent` — especialista em decomposição de tarefas
- `TaskGraph` — DAG de subtarefas com dependências e status
- **Agent Handoff Protocol:** contrato formal de transferência de contexto entre agentes
    - `HandoffPayload`: task parcial + memória relevante + resultado intermediário + instruções de continuação
    - Rastreabilidade completa da cadeia de handoffs
    - Aprovação humana opcional em pontos críticos do plano
- Orquestração sequencial e paralela
- Monitoramento visual do plano no painel
- Rollback de plano parcialmente executado

---

## 🔜 MVP12 — i18n Nativa + Export/Import de Agentes

**Objetivo:** Internacionalização real do sistema (PT/EN + extensível) e portabilidade completa de agentes.

**Blocos principais:**

- **Locale Registry:** locales como plugins, não hardcoded
- i18n em três camadas: UI Layer (`i18next`), Agent Locale (`preferredLocale` + `fallbackLocale`), System Messages
- Knowledge Layer: detecção de idioma de documentos + filtro de retrieval por língua
- LLM Router: reconhecimento de modelos com especialização em PT-BR
- **Export/Import de Agentes:**
    - Bundle exportável: perfil + políticas + knowledge collections + configuração numérica + versão
    - Import com validação e resolução de conflitos
    - Base para o futuro Agent Marketplace

---

## 🔜 MVP13 — Multi-channel Nebula + Notificações Proativas

**Objetivo:** Expandir o Communication Gateway além do canal web e tornar o sistema proativamente comunicativo.

**Blocos principais:**

- `TelegramChannel` adapter (bot operacional real)
- `DiscordChannel` adapter
- `CLIChannel` — interface terminal real
- Session routing por canal (migração de sessão entre canais)
- **Notificações proativas via Nebula:**
    - Task concluída / falhou
    - Agente com score de aderência abaixo do limiar
    - Custo diário ultrapassado (integração com Budget Control MVP10)
    - Vault desatualizado / watcher offline
    - Worker Python indisponível
    - Job na DLQ aguardando ação humana
- Configuração de notificações por tipo e canal no painel

---

## 🔜 MVP14 — Eval Engine & Benchmark Cognitivo

**Objetivo:** Motor de avaliação formal com datasets internos, golden cases e regression suite comportamental.

**Blocos principais:**

- `EvalCase`, `EvalSuite`, `EvalRun` como entidades formais
- Golden cases congelados (regressão comportamental entre MVPs)
- Comparação entre versões de agente e entre modelos na mesma tarefa
- Drift detection: alertas quando qualidade cai entre versões
- Dashboard de qualidade: conformance score por agente, modelo e capability
- Integração com Agent Evolution (MVP10): eval alimenta versionamento automático
- Integração com Feedback do usuário (MVP10) como sinal real de qualidade

---

## 🔜 MVP15 — Skill Marketplace & Intelligence

**Objetivo:** Evolução do Skill Registry para ecossistema completo com métricas reais e composição visual.

**Blocos principais:**

- Métricas reais por skill (taxa de sucesso, economia de tokens, latência, custo evitado)
- Skill Composer: criar workflows encadeando skills existentes
- Skill discovery inteligente (router usa histórico de skills para recomendar)
- Skill testing automatizado (cada skill com seus próprios evals)
- Compatibilidade ampliada com formatos externos (OpenClaw, MCP)
- UI de Skill Center: catálogo, métricas, composer
- **Skill Security Audit** (obrigatório): audit on-install com score 0-100, vetores de ataque reais (36% injection, 25% exfil), badge permanente, alerts runtime (ver seção MVP08B)

---

## 🔜 MVP16 — Device Agent (IoT / Edge Control)

**Objetivo:** Transformar o Andromeda em control plane de dispositivos físicos — ESP32, Arduino, Raspberry Pi e similares.

**Blocos principais:**

- `DeviceAgent` como tipo formal de agente no registry
- `DeviceGateway` — novo módulo de comunicação com dispositivos
- Protocolos: MQTT (IoT leve), HTTP (dispositivos potentes), Serial (Arduino/ESP32 via USB)
- `Andromeda Edge Agent` — programa minimalista instalado no dispositivo
    - Python para Raspberry Pi
    - MicroPython / C para ESP32
    - Arduino sketch para Uno/Mega
- Sandbox especializada: `DeviceSandboxPolicy` (pinos permitidos, recursos, ações autorizadas)
- Skills de device: `TurnOnLED`, `ReadTemperature`, `TriggerRelay`, etc.
- Escrita controlada: agente propõe ação → humano aprova → device executa → audit registra
- Integração com Knowledge Layer: datasheets de sensores como RAG do agente de device
- UI: Device Manager no painel (status, comandos, histórico, policies)

---

## 🔜 MVP17 — Incident & Alerting + Team Workspaces

**Objetivo:** Detecção proativa de anomalias e isolamento de contexto por projeto/equipe.

**Blocos principais:**

- **Incident System:** detecção de anomalias (agente com falha acima do threshold, task travada, modelo degradado, vault desatualizado)
- Severidade: `info | warning | critical | incident`
- Escalação automática via Nebula (Telegram, web push)
- Timeline de incidentes no painel
- **Team Workspaces:** cada projeto com agentes, knowledge collections, memória e políticas isoladas
- Dashboard dedicado por workspace
- Permissões por workspace (integração com IAM MVP09)

---

## 🔜 MVP18 — Autonomy & Long-running Agents

**Objetivo:** Execução autônoma de tarefas longas com checkpoints, retomada e escalação humana.

**Blocos principais:**

- `LongRunningTask` com ciclo de vida estendido e checkpoints formais
- `AutonomyPolicy` — nível de autonomia configurável por agente e tipo de tarefa
- Resume / pause / cancel real de execuções longas
- Escalação humana automática em pontos críticos
- Watchdog service: monitora tasks longas e reage a anomalias
- Histórico de decisões autônomas auditável
- Integração com Notificações Proativas (MVP13)

---

## 🔜 MVP19 — Reflexive Memory & Agent Marketplace

**Objetivo:** Memória reflexiva que aprende padrões sobre o próprio sistema, e marketplace para compartilhar agentes.

**Blocos principais:**

- **Reflexive Memory:** camada acima da episódica — aprende padrões recorrentes sobre comportamento do usuário, desempenho de agentes e preferências implícitas
- Consolidação automática: padrão recorrente → playbook suggestion → proposta para humano aprovar
- **Agent Marketplace:**
    - Publicação de agentes versionados como pacotes instaláveis
    - Bundle: identidade + regras + playbook + knowledge base pré-populada + configuração numérica
    - Instalação com um clique + customização pós-instalação
    - Base: Export/Import de MVP12

---

# 🗓️ Visão do Horizonte Completo

```
MVP08  → Knowledge Layer (RAG + Obsidian)              🔄 atual
MVP09  → Foundation: Security, Resilience & DevOps     🔴 crítico
MVP10  → Agent Evolution + Budget Control + Feedback
MVP11  → Planner + Agent Handoff Protocol
MVP12  → i18n Nativa + Export/Import de Agentes
MVP13  → Multi-channel Nebula + Notificações Proativas
MVP14  → Eval Engine & Benchmark Cognitivo
MVP15  → Skill Marketplace & Intelligence
MVP16  → Device Agent (IoT / Edge Control)
MVP17  → Incident & Alerting + Team Workspaces
MVP18  → Autonomy & Long-running Agents
MVP19  → Reflexive Memory & Agent Marketplace
```

> 📌 **Nota arquitetural:** O MVP09 é pré-requisito estratégico para todos os MVPs subsequentes. Avançar sem ele significa construir sofisticação cognitiva sobre uma fundação sem segurança, resiliência ou isolamento adequados.
> 

---

# 💡 Próximos Passos Sugeridos

1. **Finalizar MVP08** no Antigravity
2. **Elaborar PRD completo do MVP09** (Foundation Security & Resilience) — prioridade máxima
3. **Criar subpáginas por MVP** com detalhes técnicos, endpoints e critérios de aceite
4. **Criar página de Decisões Arquiteturais (ADR)** para registrar as grandes escolhas
5. **Criar página de Runbook** para operação do ambiente Antigravity
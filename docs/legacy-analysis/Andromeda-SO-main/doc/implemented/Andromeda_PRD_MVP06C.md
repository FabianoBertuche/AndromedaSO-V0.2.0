MVP06B+ — Sandbox Complete + Hybrid Bridge
Objetivo do ciclo

Entregar dois resultados no mesmo ciclo:

Sandbox operacional completa e persistida, integrada ao fluxo real do agente, com approvals, artifacts e audit trail. O PRD do 06B define a sandbox como camada de enforcement entre a decisão do agente e a ação efetiva no sistema, com policy resolver, validator, approval gate, orchestrator, runner, artifact manager e audit logger.

Fundação da arquitetura híbrida TS + Python, mas só no nível de bridge inicial: cognitive-python, FastAPI base, contratos Pydantic, adapter TS→Python, auth serviço-serviço, tracing básico e health check. O MVP05 recomenda exatamente essa base como primeira fase.

O que entra obrigatoriamente
Bloco A — Fechamento do MVP06B
A1. Banco e persistência

Criar migrations, models e repositories para:

sandbox_profiles

agent_sandbox_configs

sandbox_executions

sandbox_artifacts

approval_requests

Implementar repositories concretos no estilo previsto:

PrismaSandboxProfileRepository

PrismaAgentSandboxConfigRepository

PrismaSandboxExecutionRepository

PrismaSandboxArtifactRepository

PrismaApprovalRequestRepository

A2. Domínio e regras obrigatórias

Garantir tipos, entidades e validações do subsistema de sandbox, incluindo:

modos none | process | container | remote

network modes

policies de filesystem, network, resources, execution, security, IO, audit e approvals

Aplicar as regras obrigatórias do PRD:

nunca executar como root

nunca modo privilegiado

nunca herdar segredos do host por padrão

escrita fora do escopo só com policy explícita

rede privada bloqueada quando aplicável

regra “most restrictive wins” na consolidação da policy

A3. Fluxo real de execução

Fechar o fluxo ponta a ponta:

agente solicita capability/skill

CapabilityPolicyEngine verifica autorização

SandboxPolicyResolver resolve policy efetiva

SandboxValidator valida

ApprovalGate bloqueia quando necessário

ExecutionOrchestrator prepara execução

SandboxRunner executa

ArtifactManager coleta artefatos

AuditLogger persiste logs/metadados

retorno ao runtime do agente

A4. Runners

Implementar com prioridade:

ProcessSandboxRunner real e funcional agora

ContainerSandboxRunner com interface e implementação inicial realista; se der para fechar de modo seguro, ativar já

RemoteSandboxRunner ao menos como adapter/contrato preparado, sem ser bloqueador do ciclo

A5. Approvals

Implementar ApprovalRequest e fluxo de aprovação para ações sensíveis, incluindo:

execuções que exigem approval

escrita fora do workspace

uso de rede quando configurado

artefatos grandes quando configurado

A6. REST API

Implementar no mínimo os endpoints explicitamente pedidos:

GET/POST/GET:id/PUT/DELETE /sandbox/profiles

GET/PUT /agents/:id/sandbox

POST /sandbox/validate

POST /sandbox/dry-run

GET /sandbox/executions

GET /sandbox/executions/:id

GET /sandbox/executions/:id/logs

GET /sandbox/executions/:id/artifacts

POST /sandbox/executions/:id/cancel

GET /approvals

POST /approvals/:id/approve

POST /approvals/:id/reject

A7. Frontend inicial

Implementar a aba Sandbox dentro da gestão de agentes, com:

Geral

Filesystem

Rede

Recursos

Execução

Segurança

Auditoria

Aprovações

Simulação de policy

Histórico de execuções

Recursos mínimos de UX:

badge de risco

warnings para configs perigosas

visualização da effective policy

botão de validação

botão de dry-run

histórico básico de execuções

A8. Integração com o runtime real

Integrar o sandbox ao fluxo real do agente, não só como módulo isolado. Isso é coerente com o MVP06, que já formaliza identidade, safeguards e console/chat por agente; a sandbox deve atuar depois da decisão do agente e antes da ação operacional.

Bloco B — Fundação do “07” no mesmo ciclo
B1. Estrutura services/cognitive-python

Criar a estrutura recomendada pelo MVP05:

services/cognitive-python/app/main.py

services/cognitive-python/contracts/

services/cognitive-python/services/

services/cognitive-python/tests/

B2. FastAPI base

Subir serviço interno com:

/health

/contracts/version

/echo ou endpoint stub interno de teste

B3. Contratos TS ↔ Python

Implementar contratos base Pydantic seguindo o formato definido:
request deve incluir pelo menos requestId, correlationId, taskId, sessionId, agentId, input, constraints, context, timeoutMs, traceMetadata; response deve incluir success, data, metrics, warnings, error, provider, modelUsed, durationMs, trace

B4. Adapter no TypeScript

Criar CognitiveServiceAdapter no lado TS, responsável por:

montar request canônico

chamar o serviço Python

validar response

mapear erros

anexar trace/correlation ids

B5. Segurança e observabilidade básicas

Implementar:

auth serviço-serviço

tracing básico

timeout e retry controlados

logs consistentes no lado TS e Python

B6. Testes de contrato

Criar testes simples para garantir que:

TS envia request no formato esperado

Python devolve resposta canônica

erro é normalizado

correlation IDs atravessam a ponte

O que fica explicitamente fora

Para não inflar, este ciclo não deve implementar ainda:

RAG completo

memory intelligence completo

eval-service completo

benchmark evoluído

planner

multimodal

sinais avançados para router

Esses itens aparecem como fases posteriores do roadmap híbrido do MVP05, não da fundação.

Ordem de implementação recomendada
Fase 1 — Base persistida do 06B

schema Prisma + migrations

models/repositories

presets oficiais de sandbox

types/validators/policy merge

Fase 2 — Execução real do 06B

CapabilityPolicyEngine

SandboxPolicyResolver

SandboxValidator

ExecutionOrchestrator

ProcessSandboxRunner real

LocalArtifactManager

FileAuditLogger

Fase 3 — Governança do 06B

ApprovalRequest

approval flow

endpoints REST

integração com runtime real dos agentes

Fase 4 — UI do 06B

SandboxTab

sections básicas

effective policy viewer

risk badge

exec history

Fase 5 — Fundação híbrida do “07”

services/cognitive-python

FastAPI base

contratos Pydantic

adapter TS→Python

auth + tracing

testes de contrato

Critério de pronto

Este ciclo só pode ser considerado concluído quando:

a sandbox estiver persistida em banco, com execuções, artifacts e approvals reais

uma execução operacional real passar pelo pipeline completo de policy → validation → approval quando necessário → runner → artifacts → audit

o frontend permitir configurar sandbox por agente e visualizar histórico/policy efetiva

existir um cognitive-python real no repositório com FastAPI, health check e uma chamada TS→Python funcional ponta a ponta usando o contrato base

Prompt pronto para Codex / Antigravity
Estou implementando o **MVP06B+ do Andromeda OS**.

Leia primeiro estes documentos e siga-os estritamente:

- /doc/Andromeda_PRD_MVP06B.md
- /doc/DOCUMENTACAO_TECNICA_mvp05.md
- /doc/Andromeda_PRD_MVP06.md

## Objetivo do ciclo

Implementar um ciclo combinado com duas frentes:

### Frente 1 — obrigatória
Fechar completamente o subsistema de sandbox do MVP06B:
- persistência em banco
- migrations
- repositories
- fluxo real de execução
- approvals
- artifacts
- audit trail
- integração com runtime real dos agentes
- endpoints REST
- UI inicial da sandbox na gestão de agentes

### Frente 2 — fundação técnica
Iniciar a arquitetura híbrida TS + Python prevista no MVP05, mas SOMENTE no nível de fundação:
- serviço `services/cognitive-python`
- FastAPI base
- contratos Pydantic
- auth serviço-serviço
- health check
- adapter TS → Python
- tracing básico
- teste simples ponta a ponta

## Regras de escopo

### Deve entrar agora
#### Sandbox / 06B
- tabelas:
  - sandbox_profiles
  - agent_sandbox_configs
  - sandbox_executions
  - sandbox_artifacts
  - approval_requests
- migrations e models compatíveis com a stack atual
- repositories concretos
- policy engine
- policy resolver
- validator
- execution orchestrator
- process sandbox runner real
- artifact manager
- audit logger
- approval flow
- endpoints REST definidos no PRD
- UI inicial da aba Sandbox
- integração com o fluxo real dos agentes

#### Fundação híbrida / início do 07
- `services/cognitive-python/`
- `app/main.py`
- `contracts/`
- endpoint `/health`
- endpoint stub/echo para teste
- contratos base request/response
- adapter TS → Python
- auth interno
- tracing básico
- testes de contrato

### NÃO deve entrar agora
- RAG completo
- memory intelligence completo
- eval-service completo
- benchmark avançado
- planner
- multimodal
- sinais avançados do router

## Regras arquiteturais obrigatórias

- preservar Clean Architecture / Ports & Adapters
- TypeScript continua sendo o control plane
- Python entra apenas como camada cognitiva especializada
- não mover regra principal de negócio para controller
- não quebrar o runtime atual
- não criar atalhos inseguros
- aplicar deny-by-default na sandbox
- aplicar most-restrictive-wins na consolidação de policy
- nunca executar como root
- nunca habilitar modo privilegiado
- nunca herdar segredos do host por padrão

## Ordem de trabalho

1. mapear estrutura atual do repositório
2. localizar módulos equivalentes no backend/frontend
3. implementar schema + migrations
4. implementar entidades/repos
5. implementar resolver/validator/orchestrator
6. implementar process runner real
7. implementar approvals/artifacts/audit
8. conectar ao runtime real dos agentes
9. implementar endpoints
10. implementar UI inicial da Sandbox
11. criar `services/cognitive-python`
12. subir FastAPI base
13. implementar contratos Pydantic
14. criar adapter TS→Python
15. validar chamada ponta a ponta com stub
16. atualizar documentação técnica se necessário

## Resultado esperado

Ao final, entregar:

1. código implementado
2. persistência criada
3. sandbox funcional no fluxo real
4. approvals estruturadas
5. auditoria funcional
6. UI inicial funcional
7. ponte TS→Python funcional
8. serviço FastAPI base ativo
9. testes básicos de contrato
10. documentação complementar atualizada

## Instrução de execução

Implemente de forma incremental, mas com resultado final coerente.
Quando houver dúvida, priorize:
1. segurança
2. auditabilidade
3. coesão arquitetural
4. compatibilidade com os PRDs

Antes de alterar qualquer arquivo, faça um breve mapeamento do repositório atual e mostre:
- onde cada parte será implementada
- o que já existe
- o que falta
- a ordem exata dos patches
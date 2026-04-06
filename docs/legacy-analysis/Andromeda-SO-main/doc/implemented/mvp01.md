Andromeda OS — Documento Completo do MVP v0.1
1. Resumo executivo

Andromeda OS será um sistema operacional de agentes de IA com foco em:

execução confiável de tarefas;

memória nativa em camadas;

uso intensivo de skills para economizar tokens e processamento;

agentes híbridos (LLM + scripts + workflows);

auditoria independente dos resultados;

roteamento inteligente de modelos;

painel operacional forte;

compatibilidade pragmática com o ecossistema de skills do OpenClaw.

A estratégia oficial do projeto é:

Kernel novo + compatibilidade com ecossistema existente

O objetivo do MVP v0.1 não é entregar tudo.

O objetivo é provar a tese central do produto:

um kernel novo, centrado em task model, skills, memória básica, agentes híbridos, auditoria e observabilidade, consegue executar tarefas com mais confiabilidade e previsibilidade do que um arranjo improvisado no estilo OpenClaw tradicional.

Esse MVP será desenvolvido com uma estratégia de:

MVP incremental;

TDD para o núcleo determinístico;

evals e regressão para a camada cognitiva.

2. Visão do produto
2.1. Definição em uma frase

Andromeda OS é um sistema operacional de agentes de IA orientado a execução confiável, memória útil, skills reutilizáveis, auditoria independente e roteamento inteligente de capacidade.

2.2. Problema que o produto resolve

Sistemas no estilo OpenClaw/PicoClaw tendem a apresentar problemas recorrentes:

memória fraca ou pouco confiável;

baixa aderência exata ao pedido do usuário;

pouco reaproveitamento estrutural de procedimentos recorrentes;

pouca ou nenhuma auditoria real;

dificuldade de observabilidade;

uso excessivo de LLM para tarefas que poderiam ser determinísticas;

subaproveitamento de agentes especializados;

pouca evolução operacional ao longo do tempo.

O Andromeda OS nasce para atacar esses pontos pela raiz.

2.3. Proposta de valor do MVP

O MVP precisa provar que o sistema consegue:

receber uma tarefa;

estruturá-la corretamente;

escolher a melhor forma de execução;

preferir skill/script quando isso fizer mais sentido que usar LLM;

executar com rastreabilidade;

auditar o resultado com outro agente;

registrar memória básica útil;

expor tudo num painel simples e operacional.

3. Objetivos do MVP v0.1
3.1. Objetivos principais

O MVP deve entregar um primeiro ciclo operacional completo com:

task model forte;

kernel mínimo funcional;

Skill Registry com suporte inicial a skills nativas e compatíveis com OpenClaw;

agentes híbridos;

memória mínima em camadas;

RAG básico por agente;

auditoria independente;

LLM Router v0;

painel operacional mínimo;

trilha de observabilidade e execução.

3.2. Objetivos de negócio/produto

validar a arquitetura central;

provar que a abordagem skill-first reduz custo e latência;

provar que auditoria cruzada melhora confiabilidade;

viabilizar uma base concreta para evolução de agentes;

criar fundação para integrações futuras.

3.3. Objetivos técnicos

consolidar contratos e modelo de dados do sistema;

reduzir improvisação no fluxo de execução;

garantir cobertura de testes nas camadas críticas;

estabelecer uma base de métricas e regressão.

4. Não objetivos do MVP

Para evitar escopo inflado, o MVP não tentará entregar:

marketplace avançado de agentes/skills;

aprendizado autônomo sofisticado;

auto-otimização de prompts/políticas;

memória reflexiva completa;

governança multi-tenant avançada;

RBAC complexo;

automações long-running distribuídas;

execução em cluster distribuído;

benchmarking avançado em larga escala entre dezenas de modelos;

compatibilidade total com todo o ecossistema OpenClaw desde o dia 1;

painel ultra sofisticado com visual final polido.

O MVP precisa ser funcional, não barroco.

5. Princípios inegociáveis do projeto

Confiabilidade operacional antes de eloquência.

Skill antes de LLM sempre que possível.

O pedido do usuário manda — inclusive quando especifica o modelo explicitamente.

Toda tarefa relevante deve deixar trilha auditável.

Executor e auditor devem ser entidades diferentes.

Memória é infraestrutura nativa, não plugin opcional.

Agente é abstração de capacidade, não sinônimo de chamada para LLM.

A UI deve servir operação real, não só parecer futurista.

Compatibilidade com OpenClaw é pragmática, não dogmática.

Todo comportamento importante precisa ser testável ou avaliável.

6. Hipóteses do MVP a validar
Hipótese 1

Um task model estruturado melhora aderência ao pedido e reduz retrabalho.

Hipótese 2

Uma política skill-first reduz uso desnecessário de LLM, custo e latência.

Hipótese 3

Agentes híbridos (LLM + script) são mais eficientes do que agentes puramente conversacionais.

Hipótese 4

Auditoria independente aumenta taxa de detecção de falhas e inconsistências.

Hipótese 5

Um LLM Router simples já produz ganhos relevantes quando comparado a escolher modelo de forma fixa para tudo.

Hipótese 6

Um painel operacional mínimo aumenta visibilidade e reduz dependência de CLI.

7. Escopo funcional do MVP

O MVP contemplará nove blocos principais:

Kernel mínimo funcional

Task Object

Skill Registry

Agentes híbridos

Memória mínima em camadas

RAG por agente v0

LLM Router v0

Auditoria independente

Painel operacional mínimo

8. Arquitetura funcional do MVP orientada por design patterns

Para aumentar clareza de implementação, reduzir acoplamento e facilitar evolução do sistema, a arquitetura do MVP deve ser pensada explicitamente com design patterns.

O objetivo aqui não é enfeitar o projeto com nomes bonitos de catálogo GoF. O objetivo é usar padrões onde eles realmente ajudam a:

reduzir complexidade acidental;

separar responsabilidades;

permitir testes melhores;

facilitar substituição de componentes;

evitar que o core do sistema vire um bloco monolítico nervoso.

8.1. Visão arquitetural em camadas

A organização lógica recomendada é:

Camada 1 — Interface / Delivery

Responsável por:

painel web;

API HTTP;

autenticação básica;

serialização/deserialização;

validação de entrada.

Camada 2 — Application / Orchestration

Responsável por:

casos de uso;

fluxo de tarefas;

coordenação entre serviços;

transições de estado;

disparo de execução e auditoria.

Camada 3 — Domain / Core

Responsável por:

regras centrais do sistema;

Task Object;

políticas de roteamento;

políticas de skill-first;

regras de auditoria;

entidades e contratos.

Camada 4 — Infrastructure

Responsável por:

banco de dados;

fila;

vector store;

providers de LLM;

storage de artefatos;

adaptadores externos;

compatibilidade OpenClaw.

Essa divisão ajuda a evitar o erro clássico de espalhar regra de negócio por controller, adapter, ORM e frontend ao mesmo tempo como se isso fosse arte contemporânea.

8.2. Padrões centrais recomendados
8.2.1. Hexagonal Architecture / Ports and Adapters
Aplicação no Andromeda OS

O núcleo do sistema não deve depender diretamente de:

provider específico de LLM;

banco específico;

vector store específico;

runtime específico de skills;

formato externo do OpenClaw.

O core deve depender de interfaces/ports.

Ports sugeridos

TaskRepository

TaskEventRepository

SkillRepository

SkillExecutorPort

AgentRepository

AgentExecutorPort

ModelRouterPort

ModelProviderPort

MemoryRepository

RagIndexerPort

RagRetrieverPort

AuditExecutorPort

ArtifactStoragePort

OpenClawSkillAdapterPort

Benefícios

troca de provider sem reescrever o core;

testes muito mais fáceis;

compatibilidade OpenClaw isolada do domínio;

infraestrutura substituível.

8.2.2. Use Case / Application Service Pattern

Cada operação principal do sistema deve ser implementada como um caso de uso explícito.

Use cases mínimos do MVP

CreateTask

ParseTask

ResolveExecutionStrategy

ExecuteTask

RunSkill

RunAgent

RunAudit

CompleteTask

RejectTask

RegisterMemory

AttachRagCollectionToAgent

ImportOpenClawSkill

Benefícios

reduz lógica espalhada em controllers;

facilita TDD;

deixa o fluxo do sistema mais legível;

simplifica observabilidade por etapa.

8.2.3. Strategy Pattern

Esse é um dos padrões mais importantes do MVP.

Onde aplicar
A. Estratégia de execução

Uma tarefa pode ser executada por:

skill determinística;

script runtime;

workflow runtime;

agente LLM.

Criar uma interface como:

ExecutionStrategy.execute(taskContext)

Implementações:

SkillExecutionStrategy

ScriptExecutionStrategy

WorkflowExecutionStrategy

LlmExecutionStrategy

B. Estratégia de roteamento de modelo

Criar uma interface como:

ModelSelectionStrategy.select(taskContext, availableModels)

Implementações futuras podem variar, mas no MVP basta uma estratégia simples de scoring.

C. Estratégia de auditoria

Criar uma interface como:

AuditStrategy.audit(taskResult)

Possíveis implementações:

StandardAuditStrategy

CriticalAuditStrategy

LightAuditStrategy

Benefícios

evita cascata de if/else monstruosa;

facilita evolução futura;

permite benchmarking entre estratégias.

8.2.4. Factory Pattern

O sistema precisará criar dinamicamente executores, adaptadores e agentes.

Fábricas recomendadas

ExecutionStrategyFactory

AgentFactory

SkillExecutorFactory

ModelProviderFactory

AuditStrategyFactory

Exemplo de uso

O Kernel decide o execution_mode, e a fábrica devolve a estratégia correta.

Benefícios

centraliza criação;

reduz acoplamento;

facilita injeção de dependência e testes.

8.2.5. Registry Pattern

Esse padrão é essencial para skills e agentes.

Registros principais

SkillRegistry

AgentRegistry

ModelRegistry

Papel

Cada registry deve permitir:

registrar;

buscar por id;

buscar por capability;

listar ativos;

resolver preferências;

consultar metadados e versões.

Benefícios

descoberta centralizada;

desacoplamento entre cadastro e uso;

base limpa para observabilidade e métricas.

8.2.6. Adapter Pattern

Fundamental para compatibilidade com ecossistemas externos.

Aplicações principais

skills do OpenClaw;

providers de LLM;

vector stores;

storage de artefatos.

Exemplo importante

OpenClawSkillAdapter deve traduzir:

manifesto externo;

modelo de entrada/saída;

contrato de execução;

metadados;

logging interno.

Assim, o sistema não se contamina com o formato externo em todo canto.

8.2.7. State Machine Pattern

O ciclo de vida da tarefa deve ser formalizado como máquina de estados.

Estados do MVP

received

parsed

planned

executing

awaiting_audit

approved

rejected

completed_with_warnings

failed

Regras

transições inválidas devem ser bloqueadas;

cada transição deve gerar evento;

auditoria pode mover awaiting_audit -> approved ou awaiting_audit -> rejected.

Benefícios

previsibilidade;

testes fortes;

menos bugs de fluxo;

timeline mais confiável.

8.2.8. Event-Driven / Domain Events Pattern

Toda ação importante do sistema deve produzir evento.

Eventos mínimos

TaskCreated

TaskParsed

ExecutionStrategyResolved

SkillExecuted

AgentExecuted

AuditStarted

AuditCompleted

TaskApproved

TaskRejected

MemoryStored

RagCollectionAttached

OpenClawSkillImported

Uso no MVP

Mesmo que o event bus ainda seja simples, os eventos já devem existir como contrato.

Benefícios

observabilidade natural;

desacoplamento;

evolução fácil para jobs assíncronos;

replay e troubleshooting melhores.

8.2.9. Repository Pattern

Todo acesso a persistência deve passar por repositórios do domínio/aplicação.

Repositórios principais

TaskRepository

TaskEventRepository

AgentRepository

SkillRepository

MemoryRepository

AuditReportRepository

RagCollectionRepository

ModelProfileRepository

Benefícios

abstrai ORM e banco;

facilita testes com doubles/fakes;

evita SQL/Prisma espalhado na regra de negócio.

8.2.10. Policy Pattern

O Andromeda OS terá muitas regras que não devem ficar hardcoded em controllers.

Policies iniciais do MVP

SkillFirstPolicy

UserModelOverridePolicy

AuditRequiredPolicy

AgentCapabilityPolicy

RagAccessPolicy

Benefícios

regras mudam sem contaminar todo o sistema;

melhor testabilidade;

caminho aberto para governança futura.

8.2.11. Template Method Pattern

Pode ser muito útil em pipelines repetitivos.

Aplicações sugeridas
Execução de tarefa

Pipeline base:

preparar contexto;

recuperar memória;

resolver rota;

executar;

persistir evidências;

auditar;

atualizar estado.

A estrutura do fluxo é fixa, mas alguns passos variam conforme a estratégia.

Importação de skill

Pipeline base:

validar manifesto;

normalizar metadados;

adaptar contrato;

registrar skill;

testar sanidade;

ativar.

8.2.12. Decorator Pattern

Muito útil para observabilidade e auditoria sem poluir executores principais.

Exemplos

LoggingSkillExecutorDecorator

MetricsSkillExecutorDecorator

AuditAwareAgentExecutorDecorator

RetryableExecutionDecorator

Benefícios

adiciona logging/métricas/retry sem misturar responsabilidades;

facilita evolução incremental.

8.2.13. Specification Pattern

Bom para resolução de skills/agentes/modelos por critérios.

Aplicações

skill atende capability X?

agente pode executar tipo Y?

modelo suporta tarefa Z dentro do orçamento?

Exemplo

SupportsCapabilitySpecification

ModelFitsTaskSpecification

AgentAllowedForTaskSpecification

Esse padrão ajuda especialmente a evitar filtros de negócio espalhados por vários serviços.

8.3. Macrocomponentes reorganizados por padrão
8.3.1. API / Gateway
Patterns dominantes

Controller pattern

DTO pattern

Validation pattern

Use Case delegation

Regra

Controller não contém regra de negócio relevante.

8.3.2. Kernel Cognitivo
Patterns dominantes

Use Case

Strategy

Policy

Factory

Domain Service

Papel

É o coordenador de decisão, não o executor direto de todos os detalhes.

8.3.3. Task Service
Patterns dominantes

Entity

State Machine

Repository

Domain Events

Papel

Manter a vida útil da tarefa coerente.

8.3.4. Skill Registry / Skill Runtime
Patterns dominantes

Registry

Adapter

Factory

Decorator

Strategy

Papel

Descobrir, adaptar, executar e medir skills.

8.3.5. Agent Runtime
Patterns dominantes

Strategy

Factory

Decorator

Policy

Papel

Executar agentes de forma intercambiável e observável.

8.3.6. Memory Service
Patterns dominantes

Repository

Strategy

Policy

Domain Service

Papel

Persistir e recuperar memória por tipo e contexto.

8.3.7. RAG Service
Patterns dominantes

Adapter

Repository

Strategy

Facade

Papel

Esconder a complexidade de chunking/indexação/retrieval atrás de uma interface simples.

8.3.8. LLM Router
Patterns dominantes

Strategy

Specification

Policy

Factory

Papel

Escolher ou recusar modelos com justificativa rastreável.

8.3.9. Audit Service
Patterns dominantes

Strategy

Template Method

Policy

Repository

Papel

Executar auditoria estruturada e manter independência do executor.

8.3.10. Observability / Event Service
Patterns dominantes

Event-Driven

Observer

Decorator

Papel

Registrar tudo que importa sem invadir lógica central.

8.4. Fluxo operacional do MVP mapeado em patterns

Usuário cria tarefa.

Controller + DTO + Use Case

CreateTaskUseCase cria Task.

Entity + Repository + Domain Event

ParseTaskUseCase estrutura intenção e restrições.

Use Case + Policy

ResolveExecutionStrategyUseCase decide a rota.

Strategy + Specification + Policy + Factory

Se houver skill adequada:

Registry + Adapter + Decorator + Strategy

Se não houver skill adequada:

Agent Runtime + LLM Router + Factory + Strategy

Resultado é persistido.

Repository + Domain Events

Auditoria é disparada.

Use Case + Strategy + Policy

Estado da tarefa muda.

State Machine + Domain Events

Memória e logs são atualizados.

Repository + Event-Driven

Painel lê projeções do estado.

Query/Read model simples

8.5. Read model / CQRS leve no MVP

Não precisa implementar CQRS pesado, mas vale uma separação conceitual:

write side: casos de uso, regras, transições, execução;

read side: consultas simples para painel.

Aplicação prática

comandos manipulam Task e geram eventos;

consultas do painel leem projeções simplificadas.

Isso evita forçar o frontend a remontar tudo de logs crus.

8.6. Anti-patterns a evitar

controller com regra de negócio pesada;

ORM vazando para todo o sistema;

if/else infinito para resolver execução e modelo;

adaptação OpenClaw espalhada em vários módulos;

logging misturado na lógica central;

auditoria acoplada ao executor;

memória tratada como utilitário solto;

skill como simples função sem metadados e sem versão;

agentes diretamente amarrados a um único modelo;

UI consumindo entidades de domínio cruas sem view model.

8.7. Recomendação estrutural de pastas por padrão

Exemplo conceitual:

domain/

entities/

value-objects/

repositories/

policies/

specifications/

events/

services/

application/

use-cases/

dto/

factories/

strategies/

mappers/

infrastructure/

db/

queue/

llm/

rag/

storage/

openclaw/

telemetry/

interfaces/

http/

web/

workers/

Essa organização deixa o projeto com esqueleto de sistema, não de amontoado de endpoints com sentimentos.

8.8. Diretriz de implementação

Ao vibecodar o MVP, o time deve priorizar patterns que tragam clareza e testabilidade real.

A ordem mental correta é:

entidades e contratos;

use cases;

strategies/policies/factories;

repositories/ports;

adapters externos;

decorators de observabilidade;

painel e leitura.

Não começar pelo frontend bonito. Começar pela espinha dorsal.

9. Módulos detalhados do MVP
9.1. Kernel Cognitivo

A implementação exata pode variar, mas a estrutura sugerida para vibecoding é algo próximo disto:

Frontend

Next.js

React

TypeScript

Tailwind

componentes simples e funcionais

Backend/API

Node.js com TypeScript

NestJS ou Fastify/Express com arquitetura modular

Banco relacional

PostgreSQL

ORM

Prisma

Vetorial/RAG

pgvector no PostgreSQL ou Qdrant/Weaviate simples

Fila / jobs

Redis + BullMQ

Observabilidade/logs

logs estruturados JSON

OpenTelemetry opcional

tabela/event store básica no banco

Testes

Vitest ou Jest

Playwright para UI crítica

Infra inicial

Docker Compose para ambiente local

monorepo com pnpm/turborepo opcional

Organização de apps/packages sugerida

apps/web

apps/api

packages/core

packages/skills

packages/agents

packages/testing

packages/openclaw-compat

11. Modelo de dados sugerido
11.1. Principais entidades

User

Project

Session

Task

TaskEvent

Agent

Skill

SkillExecution

ModelProfile

ModelRoutingDecision

MemoryEntry

RagCollection

RagDocument

AuditReport

Artifact

11.2. Relações básicas

User 1:N Project

Project 1:N Task

Task 1:N TaskEvent

Task N:1 Agent (executor)

Task N:1 Agent (auditor)

Task N:1 Skill (opcional)

Task 1:N Artifact

Task 1:1 AuditReport (ou 1:N se quiser histórico)

Agent 1:N RagCollection

Agent N:M Skill

MemoryEntry relacionado a Project/User/Task/Agent conforme tipo

12. API mínima do MVP
Tarefas

POST /tasks

GET /tasks

GET /tasks/:id

POST /tasks/:id/execute

POST /tasks/:id/retry

Agentes

GET /agents

POST /agents

GET /agents/:id

Skills

GET /skills

POST /skills

POST /skills/import/openclaw

GET /skills/:id

RAG

GET /rag/collections

POST /rag/collections

POST /rag/collections/:id/documents

GET /rag/collections/:id

Auditoria

GET /audits/:taskId

Memória

GET /memory

POST /memory

Observabilidade

GET /events

GET /tasks/:id/events

13. Estratégia de implementação incremental
Fase 0 — Fundação do repositório
Entregas

monorepo configurado;

lint/format/test pipeline;

Docker Compose básico;

banco PostgreSQL + Redis;

convenções de pastas e contratos.

Critério de pronto

projeto sobe localmente com um comando;

pipeline de testes executa;

app web e api respondem.

Fase 1 — Core e Task Object
Entregas

entidades principais;

Task Object;

status machine de tarefa;

criação/listagem/detalhe de tarefas;

TaskEvent básico.

Critério de pronto

tarefa criada via API/UI;

estados válidos persistidos;

logs básicos por tarefa.

Fase 2 — Skill Registry e execução skill-first
Entregas

Skill Registry;

cadastro/listagem de skills;

execução de script skill;

resolução de skill por capability;

política “prefer skill quando disponível”.

Critério de pronto

uma tarefa simples consegue ser resolvida por script skill sem usar LLM;

execução fica registrada;

resultado aparece na tarefa.

Fase 3 — Agente executor LLM + router v0
Entregas

Agent Runtime básico;

executor LLM;

ModelProfile;

LLM Router v0;

override de modelo explícito do usuário.

Critério de pronto

quando não houver skill adequada, sistema escolhe modelo e executa via agente;

decisão de roteamento fica registrada.

Fase 4 — Auditoria independente
Entregas

agente auditor;

Audit Service;

parecer estruturado;

atualização de status por auditoria.

Critério de pronto

executor e auditor distintos;

auditor consegue aprovar/reprovar;

reprovação muda o estado da tarefa.

Fase 5 — Memória básica
Entregas

Session Memory;

Episodic Memory;

Semantic Memory básica;

recuperação simples por relevância/recência.

Critério de pronto

tarefas posteriores conseguem recuperar contexto relevante;

episódios ficam associados às tarefas.

Fase 6 — RAG por agente
Entregas

upload de documentos;

indexação;

associação da coleção ao agente;

busca simples;

visualização no painel.

Critério de pronto

agente consulta apenas sua coleção associada;

documentos ficam visíveis e indexados.

Fase 7 — Compatibilidade OpenClaw
Entregas

parser/adaptador de skill compatível;

importação mínima;

execução encapsulada.

Critério de pronto

ao menos uma skill no formato OpenClaw é importada e executada com sucesso.

Fase 8 — Painel operacional mínimo
Entregas

lista de tarefas;

detalhe da tarefa;

agentes;

skills;

auditoria;

RAG.

Critério de pronto

um operador consegue realizar o fluxo principal sem CLI.

14. Backlog funcional inicial
14.1. Epics
Epic A — Core de tarefas

criar task object

status machine

eventos

persistência

Epic B — Skills

registry

cadastro

execução

compatibilidade OpenClaw

Epic C — Agentes

executor

auditor

script runtime

workflow runtime

Epic D — Router

catálogo de modelos

score simples

override do usuário

fallback

Epic E — Memória

sessão

episódica

semântica básica

retrieval

Epic F — RAG

upload

chunking

embeddings

busca por agente

Epic G — Auditoria

parecer estruturado

reprovação

reprocessamento

Epic H — Painel

tarefas

agentes

skills

logs

auditoria

RAG

15. Estratégia de TDD e qualidade orientada por patterns
15.1. Filosofia

No Andromeda OS, TDD será aplicado fortemente na camada determinística.

A camada cognitiva será coberta por evals, benchmarks internos e regressão.

Fórmula prática

TDD para o núcleo determinístico

Evals para raciocínio e aderência

Regression suite para evitar degradações

Além disso, os design patterns escolhidos devem facilitar diretamente a estratégia de testes.

15.2. Como os patterns ajudam o TDD
Hexagonal / Ports and Adapters

Permite testar o core sem depender de banco, fila, provider de LLM ou vector store real.

Use Case Pattern

Permite escrever testes por comportamento de negócio, e não por detalhe de framework.

Strategy Pattern

Permite testar cada rota de execução de forma isolada.

Factory Pattern

Permite validar seleção correta de executores e adaptadores.

State Machine Pattern

Permite testar transições válidas e inválidas com clareza.

Policy Pattern

Permite testar regras de decisão como unidades independentes.

Repository Pattern

Permite usar fakes/in-memory stores nos testes.

Adapter Pattern

Permite testar compatibilidade OpenClaw e providers sem contaminar o core.

Decorator Pattern

Permite testar logging/métricas/retry separadamente da lógica principal.

15.3. Camadas de teste
A. Unit tests

Cobrem:

entidades

value objects

policies

specifications

strategies

factories

state machines

validadores

mappers

adaptadores OpenClaw

B. Integration tests

Cobrem:

fluxo tarefa → resolução → skill → auditoria

fluxo tarefa → router → agent → auditoria

fluxo upload doc → indexação → retrieval RAG

fluxo memória → recuperação → execução

C. Contract tests

Cobrem:

formatos de skills nativas

formatos compatíveis OpenClaw

contratos de providers de LLM

contratos de vector store

contratos de APIs do painel

D. Eval tests

Cobrem:

aderência ao pedido;

cumprimento de restrições;

qualidade do auditor;

respeito ao override do usuário;

comportamento skill-first.

E. Regression suite

Casos reais congelados para evitar regressão funcional e cognitiva.

15.4. Matriz de testes por pattern
Entity / Value Object

invariantes

criação válida

rejeição de estado inválido

Use Case

entrada esperada → saída esperada

efeitos colaterais corretos

eventos emitidos

Strategy

seleção da estratégia correta

comportamento isolado da estratégia

Factory

instancia o executor/adaptador correto

falha corretamente quando configuração é inválida

State Machine

transições válidas

transições inválidas

eventos emitidos por transição

Policy

regra aprova/reprova conforme cenário

precedência correta entre regras

Repository

persistência e recuperação coerentes

stubs/fakes consistentes em ambiente de teste

Adapter

tradução correta entre formato externo e interno

rejeição de payload incompatível

Decorator

logging adicionado sem alterar comportamento central

métricas computadas sem quebrar resultado

15.5. Casos de teste mínimos por módulo
Kernel / Task parsing

cria task object corretamente a partir de pedido simples;

extrai restrições explícitas;

identifica modelo explicitamente pedido pelo usuário;

define execution mode esperado.

Task status machine

transições válidas aceitas;

transições inválidas rejeitadas;

estado final persistido corretamente.

Skill Registry

registra skill válida;

rejeita skill inválida;

resolve skill por capability;

executa script skill;

aplica fallback quando skill falha.

OpenClaw compatibility

importa manifesto compatível;

mapeia metadados;

rejeita manifesto malformado;

executa via adaptador.

LLM Router

respeita modelo explícito do usuário;

escolhe fallback quando modelo está indisponível;

escolhe script quando a política indicar execução determinística;

registra motivo da decisão.

Agent Runtime

executor consome contexto mínimo necessário;

auditor não reutiliza a mesma identidade do executor;

workflow runtime executa etapas esperadas.

Memory Service

salva sessão;

salva episódio associado à tarefa;

salva semântica básica;

recupera memórias relevantes por projeto/usuário/agente.

RAG

indexa documento;

associa coleção ao agente correto;

impede acesso cruzado indevido;

retorna chunks esperados.

Audit Service

aprova saída válida;

reprova saída com violação de restrição;

emite relatório estruturado;

reabre tarefa quando necessário.

Panel/API

lista tarefas;

mostra detalhe da tarefa;

mostra logs;

mostra skill/modelo/agente usados;

mostra parecer de auditoria.

15.6. Evals sugeridos para a camada cognitiva

Criar um conjunto inicial com pelo menos 20–30 casos cobrindo:

seguir instruções exatas;

obedecer restrições de formato;

não substituir modelo explicitamente escolhido pelo usuário;

preferir skill em vez de LLM quando houver match claro;

auditor detectar falha proposital;

uso correto de contexto/memória.

Cada eval deve ter:

input;

contexto;

expected criteria;

score rubric;

resultado aprovado/reprovado.

16. Critérios de aceite do MVP

O MVP será considerado pronto quando:

uma tarefa puder ser criada e acompanhada no painel;

o kernel conseguir estruturar a tarefa;

o sistema preferir skill/script quando apropriado;

quando necessário, o LLM Router escolher um modelo válido;

o usuário puder fixar explicitamente o modelo e isso ser respeitado;

o executor produzir um resultado persistido e auditável;

um auditor independente revisar o resultado;

logs e eventos da tarefa puderem ser inspecionados;

uma base documental puder ser associada a um agente;

ao menos uma skill compatível com OpenClaw puder ser importada e executada;

a suíte de testes crítica passar;

a suíte mínima de evals não apresentar regressões graves.

17. Métricas de sucesso do MVP
Métricas funcionais

taxa de tarefas concluídas com aprovação do auditor;

taxa de tarefas resolvidas por skill/script sem LLM;

taxa de retrabalho após auditoria;

taxa de falha silenciosa;

tempo até primeiro resultado útil.

Métricas de custo

tokens médios por tarefa;

economia de tokens quando skill-first é usada;

latência média por rota (skill, script, llm).

Métricas de qualidade

aderência ao pedido;

conformidade com restrições;

precisão do auditor em detectar falhas artificiais nos evals;

precisão do roteador em respeitar políticas.

18. Riscos do MVP e mitigações
Risco 1 — escopo inflado

Mitigação: congelar os nove blocos do MVP e cortar extras.

Risco 2 — excesso de dependência de LLM cedo demais

Mitigação: política skill-first obrigatória e script-agents para tarefas determinísticas.

Risco 3 — TDD mal aplicado na camada probabilística

Mitigação: separar TDD e evals desde o começo.

Risco 4 — compatibilidade OpenClaw virar buraco negro

Mitigação: suporte parcial e incremental, começando pelo formato mínimo útil.

Risco 5 — painel consumir tempo demais

Mitigação: UI funcional mínima, sem obsessão estética na v0.1.

Risco 6 — memória ficar “inteligente demais” cedo demais

Mitigação: limitar memória do MVP a sessão + episódica + semântica básica.

Risco 7 — auditoria custosa demais

Mitigação: auditoria configurável por criticidade e heurísticas simples.

19. Roadmap resumido do MVP
Sprint 0

Setup do repositório, banco, Redis, estrutura, CI e testes.

Sprint 1

Task Object, Task Service, estados e eventos.

Sprint 2

Skill Registry, execução skill-first, script skills.

Sprint 3

Agent Runtime, executor LLM, LLM Router v0.

Sprint 4

Auditoria independente.

Sprint 5

Memória básica.

Sprint 6

RAG por agente.

Sprint 7

Compatibilidade OpenClaw mínima.

Sprint 8

Painel operacional mínimo.

Sprint 9

End-to-end, regressão, hardening e polimento técnico.

20. Sugestão de definição de pronto por feature

Uma feature só é considerada pronta quando:

código implementado;

testes unitários/integrados relevantes criados;

logs e erros tratados minimamente;

comportamento documentado;

visível/consumível pela UI ou API;

sem quebrar regressão existente.

21. Entrega esperada para o Antigravity

O objetivo deste documento é orientar a implementação do MVP por vibecoding de forma objetiva.

O time ou sistema executor deve produzir:

monorepo funcional;

backend modular com APIs principais;

banco com schema das entidades centrais;

painel web operacional mínimo;

Skill Registry funcional;

execução skill-first;

executor LLM e auditor LLM;

script-agent runtime;

LLM Router v0;

memória básica;

RAG por agente;

adaptador inicial OpenClaw;

suíte de testes crítica;

conjunto inicial de evals;

documentação de setup e execução.

22. Prompt de handoff sugerido para o Antigravity

Use este documento como especificação principal para construir o MVP v0.1 do Andromeda OS.

Prioridades absolutas:

confiabilidade operacional;

task model forte;

skill-first execution;

auditoria independente;

agentes híbridos;

compatibilidade inicial com skills OpenClaw;

TDD no núcleo determinístico;

evals para a camada cognitiva;

painel funcional mínimo.

Evitar overengineering visual ou features fora do escopo.

Construir primeiro o ciclo completo:

criar tarefa → estruturar → escolher rota → executar → auditar → registrar → exibir no painel

Esse é o coração do MVP.

23. Conclusão

O MVP do Andromeda OS não deve tentar provar que o sistema já é perfeito.

Ele deve provar algo mais importante:

que existe uma arquitetura melhor para agentes de IA do que improvisar conversa, memória, tools e “multiagentes” no mesmo caldeirão de sorte e esperança.

Se esse MVP entregar:

um task model sólido;

skill-first execution;

agentes híbridos;

auditoria independente;

memória básica útil;

roteamento simples e correto;

painel operacional mínimo;

então ele já terá validado a espinha dorsal do produto.

E espinha dorsal, nesse tipo de sistema, vale muito mais do que firula futurista.

Reorganizei com foco muito maior em design patterns.

O documento agora deixa explícito:

arquitetura em camadas;

Hexagonal / Ports and Adapters;

Use Case pattern;

Strategy para execução, auditoria e roteamento;

Factory para criação de executores/agentes/adaptadores;

Registry para skills, agentes e modelos;

Adapter para compatibilidade OpenClaw;

State Machine para ciclo de vida das tarefas;

Domain Events / Event-Driven;

Repository;

Policy;

Template Method;

Decorator para logging/métricas/retry;

Specification para resolução por critérios;

uma separação leve de read/write side no espírito de CQRS simples;

anti-patterns a evitar;

e a estratégia de TDD orientada pelos patterns.

Em outras palavras: o texto saiu de “arquitetura boa em tese” para “arquitetura com esqueleto de implementação”.

Isso ajuda muito o Antigravity porque reduz duas coisas perigosas:

liberdade demais onde precisava haver estrutura;

e acoplamento acidental que costuma aparecer quando alguém vibecoda rápido demais.

O próximo refinamento que mais vale a pena agora é eu transformar isso em um documento complementar chamado algo como:

“Andromeda OS MVP v0.1 — Backlog técnico por módulos e stories”

Aí eu quebro em:

módulos;

histórias;

tarefas técnicas;

critérios de aceite por story;

ordem ideal de implementação;

e dependências entre blocos.

Esse é o tipo de documento que deixa o time codando com trilho, não no modo jazz caótico.
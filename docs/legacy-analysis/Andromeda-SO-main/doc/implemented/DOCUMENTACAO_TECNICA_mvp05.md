# Documentação Técnica - Andromeda OS MVP v0.5

# ANDROMEDA OS  

## MVP05 — Arquitetura Híbrida TypeScript + Python

## 1. Objetivo do documento

Este documento formaliza a arquitetura híbrida recomendada para a próxima fase do Andromeda OS.

A proposta não substitui a base atual do sistema.  
Ela preserva a espinha dorsal já construída em TypeScript e introduz Python como camada especializada para componentes cognitivos avançados.

A decisão central é:

**TypeScript continua como núcleo operacional, barramento e plano de controle.**  
**Python entra como camada de inteligência especializada e serviços cognitivos.**

---

## 2. Motivação

O projeto Andromeda já consolidou uma base arquitetural robusta:

- backend modular
- Clean Architecture
- Ports & Adapters
- política skill-first
- gateway de comunicação unificado
- event-driven runtime
- auditoria
- console operacional
- roteamento multi-modelo
- integração progressiva com o conceito Nebula

Ao mesmo tempo, surgiram dores e oportunidades ligadas ao uso de IA e integração com ecossistemas como Ollama, embeddings, RAG, benchmark cognitivo, memória semântica, avaliação de respostas e workflows especializados.

Python é mais forte nesse território.

No entanto, reescrever todo o backend em Python agora geraria:

- retrabalho estrutural
- perda de velocidade
- quebra de continuidade dos MVPs já entregues
- reabertura de problemas já resolvidos
- aumento do risco de regressão

Por isso, a abordagem recomendada é **arquitetura híbrida por responsabilidade**, e não reescrita total por linguagem.

---

## 3. Princípio central da arquitetura

## Regra-mãe

**TypeScript comanda o sistema. Python especializa a inteligência.**

Em termos práticos:

- **TypeScript** continua responsável por gateway, sessão, API, realtime, task lifecycle, event bus, roteamento final, auditoria, plano de controle e contratos públicos.
- **Python** passa a atender demandas de IA avançada sob contratos estáveis definidos pelo kernel.

Essa separação evita acoplamento indevido e preserva o conceito do Andromeda como sistema operacional de agentes.

---

## 4. Visão geral da arquitetura

```text
Canais / Web / Nebula / CLI / Mobile
        │
        ▼
Communication Gateway (TypeScript)
        │
        ▼
Session + Auth + Event Normalization (TypeScript)
        │
        ▼
Task Creation + Execution Engine + Router + Audit (TypeScript)
        │
        ├── Execução direta de skill / workflow / agent
        │
        └── Quando necessário:
                ▼
         Cognitive Service Adapter (TypeScript)
                ▼
         Cognitive Services (Python)
                │
                ▼
         Resultado padronizado ao Kernel
                │
                ▼
Audit + Persistence + Timeline + UI Update (TypeScript)
5. Responsabilidade de cada runtime
5.1 O que permanece em TypeScript
Borda pública do sistema

Tudo que conversa com o exterior permanece em TypeScript:

HTTP API

WebSocket API

Communication Gateway

Session Manager

Event Normalizer

client authentication

channel authentication

API tokens

integração com painel

integração com Nebula bridge

camada de resposta unificada

Núcleo operacional

O centro do Andromeda continua em TypeScript:

task lifecycle

state machine das tasks

event bus interno

execution engine

policy engine

skill-first decision

registries

factories

roteador final de execução

model center

agentes e equipes

governança operacional

trilha auditável

correlação de eventos

controle transacional da execução

Plano de controle

Também permanece em TypeScript:

painel web

console operacional

observabilidade operacional

timeline de execução

inspeção de tarefas

gestão de agentes

gestão de skills

visualização de router

visualização de auditoria

estados cognitivos expostos à interface

5.2 O que passa a existir em Python

Python será introduzido como camada de serviços cognitivos especializados.

Esses serviços não substituem o kernel.
Eles são chamados pelo kernel quando a tarefa exige capacidade cognitiva avançada.

Serviços recomendados
rag-service

Responsável por:

ingestão e preparação de documentos

chunking inteligente

embeddings

retrieval

reranking

grounding

query expansion

recuperação contextual avançada

memory-intelligence-service

Responsável por:

consolidação de memória

deduplicação semântica

compressão de contexto

sumarização episódica

organização semântica

scoring de relevância

enriquecimento da memória de agentes

eval-service

Responsável por:

avaliação de qualidade de respostas

comparação entre saídas

scoring por critérios

análise crítica de resultados

suporte à auditoria cognitiva

benchmark-service

Responsável por:

benchmark de modelos

benchmark de agentes

benchmark por categoria de tarefa

coleta de métricas reais

regressão de qualidade e latência

evolução orientada por evidência

planner-service

Responsável por:

decomposição de tarefas complexas

planejamento hierárquico

construção de planos multi-etapas

preparação de execução multiagente

document-analysis-service

Responsável por:

extração estruturada

classificação documental

parsing avançado

interpretação de texto

workflows cognitivos específicos para documentos

multimodal-service (futuro)

Responsável por:

OCR avançado

imagem

áudio

STT

TTS

visão computacional

análise multimodal

6. Regra de ouro da arquitetura híbrida

Python não deve se tornar dono do sistema.

O papel do Python é:

processar

analisar

avaliar

enriquecer

pontuar

recuperar

planejar

O papel do TypeScript é:

decidir

orquestrar

persistir

auditar

governar

correlacionar

responder ao usuário

manter consistência operacional

7. Fluxo operacional recomendado
Fluxo padrão

Mensagem entra por um canal

Communication Gateway recebe a entrada

Sessão é resolvida

Autenticação é verificada

Evento é normalizado

Task é criada

Event bus dispara eventos do ciclo de vida

Execution Engine escolhe a rota

Router decide entre skill, workflow, agent ou modelo

Se houver necessidade cognitiva avançada, um adapter chama o serviço Python apropriado

O serviço Python devolve resultado padronizado

O kernel registra auditoria, atualiza task, persiste eventos e responde ao canal/UI

8. Contrato de integração TypeScript ↔ Python

Toda integração entre TS e Python deve passar por:

port

adapter

DTO estável

versionamento de contrato

tracing/correlation id

timeout controlado

tratamento de erro padronizado

Nunca fazer

chamadas improvisadas sem contrato

payloads arbitrários

lógica de domínio no serviço Python

retorno direto do Python para a UI

acoplamento da UI a formatos internos do worker

Sempre fazer

chamar Python a partir do core por interfaces bem definidas

retornar resposta canônica ao kernel

deixar o kernel decidir persistência, auditoria, timeline e resposta final

9. Ports recomendados no core

No núcleo TypeScript, recomenda-se criar os seguintes ports:

RagServicePort

MemoryIntelligencePort

EvaluationServicePort

BenchmarkServicePort

PlanningServicePort

DocumentAnalysisPort

MultimodalServicePort (futuro)

Cada port deve ser consumido por adapters específicos.

Exemplo conceitual:

export interface RagServicePort {
  retrieve(request: RagRequest): Promise<RagResponse>;
}
10. Contrato base de requisição

Toda chamada TS → Python deve incluir pelo menos:

requestId

correlationId

taskId

sessionId

agentId (quando aplicável)

tenantId (quando aplicável)

input

constraints

context

timeoutMs

traceMetadata

Exemplo:

{
  "requestId": "req_123",
  "correlationId": "corr_456",
  "taskId": "task_789",
  "sessionId": "session_001",
  "agentId": "agent_router",
  "input": {
    "query": "resuma o documento"
  },
  "constraints": {
    "maxTokens": 1200,
    "latencyBudgetMs": 4000
  },
  "context": {
    "project": "andromeda",
    "channel": "web"
  },
  "timeoutMs": 5000
}
11. Contrato base de resposta

Toda resposta Python → TS deve seguir formato previsível:

success

data

metrics

warnings

error

provider

modelUsed

durationMs

trace

Exemplo:

{
  "success": true,
  "data": {
    "summary": "Resumo gerado..."
  },
  "metrics": {
    "tokensIn": 1200,
    "tokensOut": 350,
    "latencyMs": 1840
  },
  "warnings": [],
  "error": null,
  "provider": "ollama",
  "modelUsed": "qwen3.5:cloud",
  "durationMs": 1840,
  "trace": {
    "requestId": "req_123",
    "correlationId": "corr_456"
  }
}
12. Estrutura de repositório recomendada
andromeda/
  apps/
    web/
  packages/
    api/
    core/
    shared/
  services/
    cognitive-python/
      app/
        main.py
      contracts/
      services/
        rag/
        memory/
        eval/
        benchmark/
        planner/
        documents/
        multimodal/
      workers/
      tests/
  infra/
    docker/
    compose/
  docs/
13. Organização dos módulos TypeScript
packages/core

Responsável por:

domain

application

use cases

ports

execution engine

task state machine

policies

router

model center

registries

audit

event bus

workflow coordination

packages/api

Responsável por:

HTTP controllers

WebSocket gateway

communication module

auth module

session endpoints

timeline endpoints

operational endpoints

integration adapters

packages/shared

Responsável por:

DTOs compartilhados

schemas

utilitários comuns

tipos canônicos

eventos compartilhados

apps/web

Responsável por:

painel de operações

console

timeline UI

gestão de agentes

gestão de skills

visualização de modelos

visualização de auditoria

14. Organização da camada Python
Estrutura sugerida
services/cognitive-python/
  app/
    main.py
  contracts/
    rag_contracts.py
    memory_contracts.py
    eval_contracts.py
  services/
    rag/
    memory/
    eval/
    benchmark/
    planner/
    documents/
  workers/
    jobs.py
  tests/
Responsabilidades

expor APIs internas

executar tarefas cognitivas

manter contratos Pydantic

integrar com vector store

integrar com filas

gerar métricas

devolver respostas normalizadas

15. Tecnologias recomendadas
15.1 Camada TypeScript

Tecnologias recomendadas:

Node.js

TypeScript

Fastify

Socket.IO ou ws

Zod

Prisma

PostgreSQL

Redis

BullMQ

OpenTelemetry

Justificativa

Essa base continua excelente para:

gateway

realtime

contratos com frontend

velocidade de desenvolvimento

observabilidade operacional

integração com painel

controle de fluxo orientado a eventos

15.2 Camada Python

Tecnologias recomendadas:

FastAPI

Pydantic

httpx

Redis

Arq ou Celery

Qdrant ou pgvector

LlamaIndex / Haystack / libs específicas quando necessário

clientes OpenAI-compatible / Ollama / vLLM

Recomendação prática inicial

Para começar com simplicidade:

FastAPI

Pydantic

Redis

Arq

pgvector ou Qdrant

16. Banco de dados e armazenamento
16.1 PostgreSQL

Continua sendo a base principal do sistema.

Deve armazenar:

tasks

sessions

audit reports

agents

skills

workflows

model catalog

benchmark summaries

execution metadata

policy configs

tracing metadata básica

metadata de memória

16.2 Redis

Será usado para:

cache

fila

locks

deduplicação temporária

pub/sub leve

controle de jobs

coordenação entre componentes

16.3 Vetor
Opção A — pgvector

Melhor para começo simples.

Opção B — Qdrant

Melhor se RAG crescer e se tornar componente central.

Recomendação

começar simples com pgvector se o volume for baixo

adotar Qdrant quando retrieval avançado e escala passarem a ser prioridade real

17. Comunicação síncrona e assíncrona
17.1 Comunicação síncrona

Para operações curtas:

TS chama Python por HTTP interno

resposta volta imediatamente

timeout controlado

fallback possível

17.2 Comunicação assíncrona

Para operações longas:

TS cria job

job vai para fila Redis

worker Python processa

TS acompanha status

resultado volta ao kernel

UI recebe atualização por evento

Regra recomendada

Começar com modelo híbrido:

HTTP para requisições rápidas

fila para trabalhos pesados

18. Event bus
Interno ao Andromeda

O event bus principal continua em TypeScript.

Ele deve continuar responsável por eventos como:

TaskCreated

TaskQueued

TaskStarted

TaskCompleted

TaskFailed

SkillExecuted

AuditCompleted

MemoryStored

RouterDecisionRecorded

Entre TS e Python

Não é necessário Kafka neste estágio.

Recomendação:

HTTP interno

Redis para fila e coordenação

eventualmente NATS se a integração crescer

19. Model Center e Router na arquitetura híbrida

O roteador final deve permanecer no kernel TypeScript.

Motivo

Porque a decisão final do Andromeda não envolve apenas modelos.
Ela também envolve:

disponibilidade de skills

workflows

agentes especializados

custo

latência

criticidade

política

auditoria

restrições do canal

prioridade operacional

Papel do Python aqui

Python pode fornecer:

score semântico por tipo de tarefa

benchmark avançado

classificação da complexidade

sinais adicionais para decisão

avaliação comparativa de saídas

Mas a decisão final continua no TS.

20. Nebula compatibility

A arquitetura híbrida deve preservar compatibilidade com a interface futura estilo Nebula.

Portanto, o backend bridge em TS deve continuar controlando:

estados cognitivos visíveis

sessão

transições de interface

emissão de eventos para frontend

mensagens unificadas

reconciliação de estados

integração WebSocket

resposta unificada ao cliente

Python não deve assumir esse contrato.

21. Auditoria na arquitetura híbrida

A auditoria oficial do sistema continua em TypeScript.

Ela deve continuar responsável por:

registrar execução

validar consistência

produzir relatório oficial

associar resultado à task

registrar aprovações e falhas

alimentar timeline

manter rastreabilidade

Camada cognitiva de auditoria

Opcionalmente, Python pode oferecer apoio com:

avaliação textual de qualidade

análise heurística

comparação entre alternativas

pontuação cognitiva

sinais auxiliares para revisão

Mas a decisão oficial de auditoria continua no kernel.

22. Evolução de memória e agentes

A arquitetura híbrida favorece uma divisão clara:

Em TypeScript

identidade do agente

versão do agente

status do agente

política de ativação

vínculo com skills

vínculo com equipes

vínculo com runtime

histórico operacional oficial

Em Python

análise de desempenho

clusterização de falhas

sumarização de lições

consolidação de memória

sugestão de melhorias

análise de reputação por domínio

recomendação de promoção/rebaixamento

23. Riscos da arquitetura híbrida

A arquitetura híbrida é a melhor opção, mas possui custos.

Risco 1 — Complexidade operacional

Mais serviços significa mais observabilidade, deploy, tracing e monitoramento.

Risco 2 — Contratos frouxos

Se os contratos TS ↔ Python forem soltos, o sistema vira uma malha frágil.

Risco 3 — Vazamento de domínio

Se regras de negócio forem empurradas para Python, o núcleo perde coesão.

Risco 4 — Duplicação de decisão

Se router e workers passarem a decidir em paralelo, surgirão conflitos operacionais.

Mitigações

ports bem definidos

DTOs estáveis

versionamento de contrato

router final em TS

task state machine em TS

tracing distribuído

testes de contrato

auditoria sempre no kernel

24. Tecnologias adicionais que agregam valor
Prioridade alta

OpenTelemetry

Redis

FastAPI

Pydantic

Prioridade média

Qdrant

Arq

Prometheus

Grafana

Loki

Prioridade futura

Temporal

MLflow

NATS

Kubernetes

Não recomendado agora

Kafka

migração total para Python

Kubernetes precoce

complexidade exagerada de infraestrutura

25. Roadmap técnico sugerido
MVP05 — Hybrid Foundation

Objetivo:
introduzir a camada Python sem quebrar a base atual.

Entregas

serviço cognitive-python

FastAPI base

contratos iniciais

auth serviço-serviço

health check

adapters TS → Python

tracing básico

Redis compartilhado

MVP06 — RAG & Memory Intelligence
Entregas

rag-service

memory-intelligence-service

ingestão de documentos

embeddings

retrieval

reranking

consolidação de memória

inspeção básica no painel

MVP07 — Evals & Advanced Router Signals
Entregas

eval-service

benchmark evoluído

score por categoria

sinais avançados ao router

explicabilidade melhor das decisões

MVP08 — Planner & Multi-Agent Intelligence
Entregas

planner-service

decomposição de tarefas

planejamento multi-etapas

apoio a equipes de agentes

auditoria cognitiva auxiliar

MVP09 — Multimodal Foundation
Entregas

document-analysis-service

OCR

áudio base

STT/TTS base

preparação para integração multimodal com Nebula

26. Decisão final

A decisão arquitetural recomendada para o Andromeda é:

Manter em TypeScript

gateway

API

WebSocket

sessões

kernel

task lifecycle

state machine

router final

audit oficial

control plane

painel

contratos públicos

timeline

integração Nebula

Adicionar em Python

RAG

memória semântica avançada

benchmark

avaliação

planner

análise documental

multimodal futuro

27. Conclusão

No estágio atual do Andromeda, migrar todo o backend para Python seria retrabalho.

A melhor decisão técnica é construir uma arquitetura híbrida disciplinada, onde:

o TypeScript continua sendo o sistema operacional do Andromeda

o Python passa a ser a camada de inteligência especializada

Essa abordagem:

preserva os MVPs já entregues

reduz risco

acelera evolução cognitiva

melhora integração com ecossistema de IA

mantém coerência arquitetural

prepara melhor o projeto para as próximas fases

28. Resumo executivo

Decisão recomendada: arquitetura híbrida
Núcleo operacional: TypeScript
Serviços cognitivos avançados: Python
Roteador final: TypeScript
Auditoria oficial: TypeScript
RAG / memória / benchmark / evals / planner: Python
Estratégia: evoluir por adapters, não por reescrita total

29. Nome sugerido desta fase

Andromeda MVP05 — Hybrid Cognitive Foundation

ou

Andromeda Hybrid Cognitive Architecture v1

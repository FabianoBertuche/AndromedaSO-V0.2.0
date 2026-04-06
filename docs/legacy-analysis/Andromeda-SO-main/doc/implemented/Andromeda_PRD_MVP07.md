PROMPT CANÔNICO — ANDROMEDA MVP07

Use este documento como instrução principal de implementação.

Leia primeiro e trate como referência obrigatória:

/doc/mvp01.md

/doc/DOCUMENTACAO_TECNICA_mvp05.md

/doc/Andromeda_PRD_MVP06.md

/doc/Andromeda_PRD_MVP06B.md

/doc/Andromeda_PRD_MVP06C.md

/doc/Andromeda_PRD_MVP-Revisao.md

Objetivo do ciclo

Implementar o MVP07 do Andromeda OS, com foco exclusivo em:

Memory Layer v1

Este ciclo deve entregar a primeira camada operacional de memória nativa do Andromeda, integrada ao runtime, persistida, auditável, inspecionável e utilizável pelo sistema real.

A memória deste ciclo deve ser útil, previsível e governável.

O objetivo não é criar ainda um sistema de memória “inteligente demais”.

O objetivo é fazer o Andromeda avançar de:

sistema que executa tasks com agentes governáveis

para:

sistema que consegue lembrar contexto relevante por sessão, tarefa, agente, projeto e usuário, e reutilizar esse contexto em execuções futuras.

Estado atual a considerar

Considere como base que:

MVP06C já foi implementado

MVP-Revisão está em execução para fechar pendências, estabilizar a base e reduzir dívida estrutural

o próximo passo desejado é o MVP07

o escopo do MVP07 não pode repetir entregas já cobertas por 06 / 06B / 06C

o ciclo de revisão existe justamente para preparar a base antes da entrada da memória

O PRD do MVP-Revisão deixa claro que este ciclo de revisão não deve abrir grandes features novas, e explicita que Memory Layer v1, RAG completo, planner, multimodal e outros itens ficam fora da revisão para ciclos posteriores.

Decisão arquitetural obrigatória

O MVP07 deve ser tratado como:

Andromeda MVP07 — Memory Layer v1

e não como:

RAG completo

memory intelligence avançada

eval-service

benchmark avançado

planner

multimodal

advanced router signals

Esses itens pertencem a ciclos posteriores. O próprio material do projeto mostra duas coisas importantes:

o roadmap conceitual original já separava “memória básica” de “RAG por agente”, prevendo primeiro Session Memory + Episodic Memory + Semantic Memory básica, e depois RAG;

os documentos mais recentes reposicionam o próximo avanço natural após identidade/governança/revisão como MVP07 — Memory Layer v1.

Se houver conflito entre roadmap antigo e documentos mais novos, priorizar a decisão mais recente:

revisão primeiro

depois Memory Layer v1

O que deve entrar obrigatoriamente

Implementar a primeira camada operacional de memória com estes três blocos centrais:

1. Session Memory

Memória de curto prazo vinculada à sessão/canal atual.

Deve cobrir:

continuidade de conversa

contexto recente da sessão

último agente selecionado

task atual/anterior relacionada à sessão

metadados recentes úteis à continuidade

expiração curta

limpeza simples por TTL/política

2. Episodic Memory

Memória de episódios operacionais relevantes.

Deve cobrir:

tasks concluídas relevantes

falhas relevantes

decisões importantes

correções aplicadas

preferências observadas

eventos reaproveitáveis da trajetória do agente/projeto

3. Semantic Memory básica

Memória factual simplificada e mais durável.

Deve cobrir:

fatos estáveis ou semiestáveis

preferências recorrentes

decisões consolidadas do projeto

convenções operacionais

restrições persistentes

vínculos úteis entre agente, projeto, equipe, sessão e usuário

A base conceitual disso já existe desde o documento original do projeto, que define exatamente esses três tipos de memória na fase de memória básica.

Critério funcional central do ciclo

Ao final do MVP07, o sistema deve ser capaz de:

registrar memória por sessão, tarefa, agente, projeto e usuário

distinguir memória temporária de memória reaproveitável

recuperar memória relevante antes da execução de uma task

anexar memória recuperada ao contexto do runtime

registrar quando determinada memória foi usada numa execução

permitir inspeção, pin, invalidação e remoção

expor memória no painel

manter auditabilidade da origem e do uso da memória

Critério central de pronto:

tarefas posteriores conseguem recuperar contexto relevante

episódios ficam associados corretamente às tasks/agentes

a memória utilizada em uma execução pode ser inspecionada depois

Esse critério segue diretamente a definição original da fase de memória básica do projeto.

O que NÃO deve entrar agora
Não implementar neste ciclo:

RAG completo por agente

ingestion documental avançada

reranking sofisticado

memory intelligence completo

deduplicação semântica avançada em Python

consolidação cognitiva sofisticada

sumarização automática avançada

eval-service completo

benchmark evoluído

advanced router signals

planner

multimodal

qualquer feature nova de escopo lateral que desvie do núcleo da memória v1

Os documentos recentes reforçam esse corte: a revisão exclui esses itens, e o bridge Python do 06C também diz que RAG completo, memory intelligence completo, eval-service, planner, multimodal e sinais avançados do router ficam fora dessa fundação inicial.

Regras arquiteturais obrigatórias
1. Preservar Clean Architecture / Ports & Adapters

Não mover regra central para controller, componente UI ou adapter improvisado.

2. TypeScript continua sendo o control plane

O núcleo operacional do Andromeda continua em TypeScript:

task lifecycle

execution engine

state machine

event bus

roteador final

auditoria oficial

timeline

painel

contratos públicos

A arquitetura híbrida do projeto é explícita: TypeScript comanda o sistema; Python especializa a inteligência.

3. Python não deve virar dono da memória neste ciclo

O máximo permitido agora é preparar compatibilidade futura com a camada Python, sem empurrar a regra principal da memória para lá.

Se algum adapter TS ↔ Python já existir por causa do 06C, ele pode ser preservado, mas o MVP07 não deve depender de memory-intelligence-service avançado para funcionar. O próprio documento híbrido posiciona consolidação semântica avançada e enriquecimento cognitivo de memória como evolução especializada, não como base do control plane.

4. Memória é infraestrutura nativa

Não tratar memória como utilitário solto nem como prompt hack.

Esse é um princípio do projeto desde a origem.

5. Memória complementa o agente; não substitui a identidade

A ordem de montagem do contexto do agente já foi definida no MVP06:

identidade

alma/personalidade

regras duras

playbook

contexto permanente

memória recuperada

sessão atual

task ou mensagem atual

Essa ordem deve continuar válida.

6. Auditabilidade obrigatória

Toda memória usada em execução real deve deixar rastro.

Estrutura técnica recomendada

Criar ou consolidar o módulo de memória de forma coerente com a arquitetura do projeto.

Estrutura sugerida:

packages/
  core/
    src/
      domain/
        memory/
          entities/
          value-objects/
          repositories/
          policies/
          services/
          events/
      application/
        memory/
          use-cases/
          dto/
          mappers/

  api/
    src/
      modules/
        memory/
          interfaces/http/
          infrastructure/persistence/
          infrastructure/indexing/

  shared/
    src/
      memory/
        dto/
        schemas/
Entidades mínimas obrigatórias
MemoryEntry

Entidade central.

Campos mínimos sugeridos:

id

type (session, episodic, semantic)

scopeType (session, task, agent, project, user, team)

scopeId

agentId?

taskId?

sessionId?

projectId?

userId?

title

content

summary?

tags[]

source

sourceEventId?

createdAt

updatedAt

expiresAt?

isPinned

status (active, archived, invalidated, deleted)

importanceScore

metadata

MemoryLink

Relaciona memórias com entidades operacionais.

Campos mínimos:

id

memoryEntryId

linkedEntityType

linkedEntityId

relationType

MemoryRetrievalRecord

Rastro do uso da memória.

Campos mínimos:

id

taskId

agentId

sessionId

memoryEntryId

retrievalReason

retrievalScore

usedInPromptAssembly

usedAt

MemoryPolicy

Políticas por tipo e escopo.

Campos mínimos:

id

memoryType

scopeType

retentionMode

ttlDays?

maxEntries?

allowAutoPromotion

allowManualPin

allowSemanticExtraction

createdAt

updatedAt

Persistência obrigatória

Persistir memória em banco real, de forma coerente com o padrão recente do projeto de abandonar abordagens frágeis/file-backed nas áreas críticas. O ciclo de revisão reforça fortemente esse movimento ao exigir persistência real para sandbox e saneamento estrutural antes do MVP07.

Criar migrations e repositories concretos para no mínimo:

memory_entries

memory_links

memory_retrieval_records

memory_policies

Implementar repositories concretos no estilo atual do projeto.

Casos de uso obrigatórios

Implementar como use cases explícitos:

RegisterSessionMemory

RegisterEpisodicMemory

RegisterSemanticMemory

RetrieveMemoryForTask

AttachMemoryToExecutionContext

PromoteMemory

PinMemory

InvalidateMemory

DeleteMemoryEntry

ListMemory

InspectMemoryEntry

Manter o padrão do projeto de use cases explícitos, em vez de espalhar regra por controllers. Isso é coerente com a base arquitetural original.

Regras de negócio obrigatórias
Regra 1 — Nem toda mensagem vira memória

Só registrar memória quando houver:

relevância operacional

decisão útil

preferência recorrente

episódio reaproveitável

fato estável

contexto valioso para continuidade

Regra 2 — Session Memory é curta

Session Memory não deve contaminar todos os escopos.

Regra 3 — Episodic Memory exige evento real

Episódio precisa estar ancorado em:

task

audit

approval

artifact

mudança de estado relevante

decisão operacional

Regra 4 — Semantic Memory exige mais rigor

Não promover qualquer coisa a fato persistente.

Regra 5 — Toda memória usada deve ser rastreável

Se influenciou uma execução, deve aparecer no log/trilha.

Regra 6 — Memória não substitui timeline

Timeline continua sendo observabilidade.
Memória é reaproveitamento contextual.

Estratégia de recuperação obrigatória

A recuperação deve ser simples, previsível e controlada.

Fatores mínimos de ranking

escopo

recência

tipo

tags

importância

vínculo com agente

vínculo com projeto

similaridade textual básica quando aplicável

Ordem recomendada

Session Memory do contexto atual

Episodic Memory do agente/projeto

Semantic Memory válida do escopo aplicável

Limites obrigatórios

limitar quantidade por execução

respeitar budget

não sobrecarregar o contexto

permitir filtros por interactionMode

Integração obrigatória com o runtime

A memória precisa entrar no fluxo real do sistema.

Fluxo esperado:

mensagem entra pelo gateway

sessão é resolvida

task é criada

agente é resolvido

RetrieveMemoryForTask busca contexto aplicável

AttachMemoryToExecutionContext injeta memória na montagem de contexto

execução acontece

resultado, audit e eventos podem gerar novas memórias

o uso da memória fica registrado

A memória deve ser integrada ao runtime real, não ficar como módulo isolado. Essa é a mesma lógica já exigida para a sandbox no ciclo recente.

API mínima obrigatória

Implementar no mínimo:

Consulta

GET /memory

GET /memory/:id

GET /memory/:id/links

GET /memory/:id/usage

GET /agents/:id/memory

GET /sessions/:id/memory

GET /tasks/:id/memory

Escrita / controle

POST /memory

POST /memory/retrieve

POST /memory/:id/pin

POST /memory/:id/invalidate

POST /memory/:id/promote

DELETE /memory/:id

Policies

GET /memory/policies

PUT /memory/policies/:id

A existência de API de memória já estava prevista desde o desenho inicial do projeto.

UI mínima obrigatória

Implementar uma área operacional de memória no painel.

Deve permitir:

listar memórias

filtrar por tipo

filtrar por agente

filtrar por sessão

filtrar por projeto

visualizar detalhe

ver origem

ver quando foi usada

pin

invalidate

delete

visualizar status e retenção

Nas telas existentes, mostrar:
Task Detail

memórias recuperadas para aquela task

score/ordem de recuperação

indicação se foram usadas

Agent Detail

memória do agente

episódios relevantes

fatos semânticos associados

Session / Console

memória de sessão ativa

contexto útil recente

O projeto já previa inspeção de memória dentro do plano de controle/painel, então a UI não deve ser adiada completamente.

Eventos obrigatórios

Criar eventos de domínio e/ou aplicação para memória, no estilo do restante do projeto:

MemoryStored

MemoryRetrieved

MemoryPromoted

MemoryPinned

MemoryInvalidated

MemoryDeleted

MemoryAttachedToExecution

O documento-base do projeto já recomendava eventos para ações importantes do sistema, inclusive MemoryStored.

Estratégia de implementação recomendada
Fase 1 — Modelo e persistência

schema

migrations

entidades

repositories

policies iniciais

Fase 2 — Registro de memória

Session Memory

Episodic Memory

Semantic Memory básica

Fase 3 — Recuperação

retrieval por escopo

score simples

attach ao contexto de execução

Fase 4 — Observabilidade

usage records

inspection

event trail

Fase 5 — UI operacional

aba/painel de Memory

filtros

detalhe

pin/invalidate/delete

Fase 6 — Testes e regressão

unit

integration

contract

regression

Testes obrigatórios
Unit tests

Cobrir no mínimo:

scoring de recência

filtros por escopo

promotion rules

invalidation rules

retention rules

deduplicação simples quando aplicável

Integration tests

Cobrir no mínimo:

Console/Gateway/Task/Agent recuperando memória

task concluída gerando episódio

session memory sendo usada em continuidade

semantic memory sendo consultada em task posterior

pin/invalidate afetando retrieval

Contract tests

Cobrir:

shape de MemoryEntry

shape de MemoryRetrievalRecord

endpoints REST de memória

integração com montagem de contexto

Regression suite

Criar regressões mínimas para evitar:

perda de vínculo memória → task

vazamento indevido de session memory

perda de rastreio do uso da memória

memória semanticamente inválida sendo reutilizada

A estratégia geral do projeto já exige TDD no núcleo determinístico, evals na camada cognitiva e regression suite para impedir degradações.

Critério de pronto

O MVP07 só poderá ser considerado concluído quando:

existirem Session Memory, Episodic Memory e Semantic Memory básica persistidas e consultáveis

tarefas posteriores recuperarem contexto relevante de forma previsível

episódios estiverem corretamente associados a tasks e agentes

a memória usada numa execução puder ser inspecionada depois

a UI permitir consulta e inspeção real da memória

houver políticas mínimas de retenção, pin e invalidação

a suíte mínima de testes passar

o sistema ficar melhor preparado para um RAG por agente posterior, sem misturar esse escopo agora

Anti-patterns proibidos neste ciclo

Não fazer:

transformar MVP07 em RAG disfarçado

empurrar lógica central da memória para Python cedo demais

criar memória sem escopo claro

usar memória sem rastrear origem/uso

registrar tudo sem critério

implementar UI cosmética sem integração real

espalhar regra de memória em controller

duplicar timeline e memória como se fossem a mesma coisa

Instrução de execução

Implemente de forma incremental, mas com resultado final coerente.

Antes de alterar qualquer arquivo:

mapear a estrutura atual do repositório

localizar o que já existe de memory, session, task, audit, timeline e painel

mostrar onde cada parte do MVP07 será implementada

mostrar o que já existe

mostrar o que falta

mostrar a ordem exata dos patches

Quando houver dúvida, priorizar:

coesão arquitetural

auditabilidade

previsibilidade do retrieval

compatibilidade com os PRDs mais recentes

escopo enxuto e disciplinado

Resultado esperado

Ao final, entregar:

código implementado

migrations e persistência real

integração da memória ao runtime real

endpoints REST de memória

UI mínima funcional para inspeção de memória

trilha auditável do uso da memória

testes unitários, de integração, contrato e regressão mínimos

documentação complementar atualizada, se necessário
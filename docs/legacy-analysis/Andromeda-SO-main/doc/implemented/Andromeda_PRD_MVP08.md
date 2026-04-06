PROMPT CANÔNICO — ANDROMEDA MVP08

Use este documento como instrução principal de implementação.

Leia primeiro e trate como referência obrigatória:

/doc/mvp01.md

/doc/DOCUMENTACAO_TECNICA_mvp05.md

/doc/Andromeda_PRD_MVP06.md

/doc/Andromeda_PRD_MVP06B.md

/doc/Andromeda_PRD_MVP06C.md

/doc/Andromeda_PRD_MVP-Revisao.md

/doc/Andromeda_PRD_MVP07.md

Objetivo do ciclo

Implementar o MVP08 do Andromeda OS, com foco em:

Knowledge Layer v1

Este ciclo deve entregar a primeira camada operacional de conhecimento recuperável do Andromeda, integrada ao runtime, governada por políticas, auditável, inspecionável pela interface web e utilizável pelo sistema real.

O objetivo do ciclo é fazer o Andromeda avançar de:

sistema com memória operacional básica

para:

sistema capaz de ingerir conhecimento externo, indexar conteúdo por agente/projeto/equipe, recuperar contexto documental relevante em tempo de execução, exibir grounding na interface e integrar um vault Obsidian como base de conhecimento controlada.

Estado atual a considerar

Considere como base que:

MVP06C já foi implementado

MVP-Revisão está sendo usado para fechar pendências, estabilizar a base e reduzir dívida estrutural

MVP07 está sendo implementado com foco em Memory Layer v1

o próximo passo desejado é o MVP08

o escopo do MVP08 não pode repetir entregas já cobertas por 06 / 06B / 06C / Revisão / 07

o MVP08 deve assumir que a base de memória do 07 já existe ou está em consolidação

Decisão arquitetural obrigatória

O MVP08 deve ser tratado como:

Andromeda MVP08 — Knowledge Layer v1

e não como:

planner completo

multi-agent planning avançado

multimodal amplo

knowledge graph avançado

memory intelligence completo

eval-service completo

benchmark sofisticado

autonomia irrestrita de escrita no vault

O foco real deste ciclo é:

RAG por agente

ingestão documental operacional

ingestão manual por texto

interface web real para gestão do knowledge layer

integração com vault Obsidian

integração operacional com Syncthing/Syncthing-Fork

controle de leitura e escrita do vault por agente

auditabilidade de retrieval e grounding

testes reais ponta a ponta

Regras arquiteturais obrigatórias

1. Preservar Clean Architecture / Ports & Adapters

Não mover regra central para controller, componente UI, watcher, parser, adapter improvisado ou código acoplado ao framework.

2. TypeScript continua sendo o control plane

O núcleo operacional do Andromeda continua em TypeScript, incluindo:

runtime

task lifecycle

state machine

audit trail oficial

configuração de agentes

políticas de acesso

web app

APIs públicas

integração com o console/chat

3. Python entra como camada cognitiva especializada

A camada Python deve ser usada para:

parsing documental

chunking

embeddings

indexação vetorial

retrieval

reranking básico

normalização documental

serviços de grounding

4. Toda integração TS ↔ Python deve ser contratual

Nada de chamadas ad hoc ou payloads implícitos.
Toda comunicação entre TypeScript e Python deve usar contratos claros, tipados, versionáveis e auditáveis.

5. Conhecimento não é memória

Não colapsar o knowledge layer dentro da memory layer.
Memória e conhecimento podem cooperar, mas são subsistemas diferentes.

Objetivo funcional central do ciclo

Ao final do MVP08, o sistema deve ser capaz de:

criar coleções de conhecimento por agente, equipe, projeto e escopo compartilhado

subir documentos pela interface web

receber texto digitado manualmente pela interface e indexar isso como conhecimento

processar documentos em pipeline real de ingestão

gerar chunks

gerar embeddings

indexar conteúdo

executar retrieval por agente com filtros e políticas

anexar chunks recuperados ao contexto de execução

registrar quais documentos e chunks foram usados

exibir grounding e retrievals na interface

conectar um vault Obsidian como fonte documental

reindexar incrementalmente mudanças vindas do vault

controlar por agente se pode ler o vault

controlar por agente se pode escrever no vault

registrar propostas e aprovações de escrita no vault

validar tudo isso com testes unitários, integração, contrato, e2e e regressão

O que deve entrar obrigatoriamente

Bloco A — Knowledge Layer Core

A1. Coleções de conhecimento

Implementar coleções com escopo:

por agente

por equipe

por projeto

compartilhadas controladas

Cada coleção deve ter no mínimo:

id

name

description

scopeType

scopeId

sourceType

status

metadata

createdAt

updatedAt

A2. Documentos de conhecimento

Implementar a entidade documental com no mínimo:

id

collectionId

title

sourceType

sourcePath

mimeType

rawText

checksum

status

metadata

createdAt

updatedAt

A3. Chunks

Implementar chunking persistido com no mínimo:

id

documentId

ordinal

content

tokenEstimate

embeddingRef

metadata

createdAt

A4. Retrieval records

Persistir o uso de retrieval com no mínimo:

id

taskId

sessionId

agentId

query

filters

selectedChunkIds

selectedDocumentIds

scoreSummary

durationMs

createdAt

A5. Policies por agente

Implementar AgentKnowledgePolicy com no mínimo:

id

agentId

knowledgeEnabled

vaultReadEnabled

vaultWriteEnabled

writeMode

approvalRequired

allowedCollectionIds

allowedPaths

maxChunks

maxContextTokens

rerankEnabled

preferMemoryOverKnowledge

preferKnowledgeOverMemory

Bloco B — Ingestão documental via interface web

B1. Upload de arquivos

Implementar upload operacional pela interface web para alimentar o RAG.

Tipos mínimos iniciais:

.md

.txt

.pdf

.docx

.json

Fluxo mínimo:

usuário escolhe coleção

faz upload

API recebe

metadados são persistidos

job de ingestão é criado

conteúdo é extraído

chunking é executado

embeddings são gerados

índice é atualizado

status fica visível na interface

B2. Documento manual por texto digitado

Implementar formulário web para criação de documento manual sem upload de arquivo.

Campos mínimos:

title

content

collectionId

tags

scope

origin

author

sensitivity

status

Esse recurso deve ser tratado como parte central do MVP08, não como extra.

Bloco C — Retrieval por agente

C1. Recuperação contextual

Implementar retrieval respeitando:

agente ativo

projeto

equipe

coleções permitidas

sensibilidade

score mínimo

limite de chunks

budget de contexto

C2. Reranking básico

Implementar reranking básico e previsível.
Não tentar fazer inteligência sofisticada demais neste ciclo.

C3. Context assembly

Implementar montagem de contexto com:

memória recuperada do MVP07

conhecimento recuperado do MVP08

metadados da execução

restrições do agente

O runtime deve conseguir usar esse contexto de forma real, não só em endpoint de teste.

Bloco D — Interface web do Knowledge Layer

Criar uma aba principal no web app:

Knowledge

Subáreas mínimas:

Collections

Documents

Retrieval

Vaults

Permissions

Jobs

D1. Collections

Implementar:

listar coleções

criar coleção

editar coleção

desativar ou excluir coleção

filtrar por agente/equipe/projeto

ver quantidade de documentos

ver quantidade de chunks

ver status

D2. Documents

Implementar:

upload de arquivos

criação manual de documento

edição de metadados

visualização do texto extraído

visualização de chunks

reprocessamento

remoção

histórico de processamento

D3. Retrieval

Implementar:

lista de retrievals recentes

consulta gerada

task associada

agente

documentos usados

chunks usados

score

duração

motivo de inclusão ou exclusão quando aplicável

D4. Vaults

Implementar:

cadastro de vault

informação de path

habilitar watch

definir include patterns

definir exclude patterns

testar acesso

reindexação completa

rescan incremental

status da fonte

D5. Permissions

Implementar visualização e edição de:

agentes com acesso

equipes com acesso

coleções permitidas

modo leitura/escrita

approval requirement

restrições por path

D6. Jobs

Implementar listagem de jobs de ingestão e reindexação com:

status

tipo

origem

duração

erros

retry

Bloco E — Configuração do agente

Na tela de configuração do agente, criar uma seção:

Knowledge & Vault Access

Campos mínimos:

Knowledge Enabled

Allowed Collections

Allowed Projects

Use Obsidian Vault

Vault Access Mode

Read Permission

Write Permission

Allowed Paths

Requires Human Approval for Writes

Max Chunks

Max Context Tokens for RAG

Rerank Enabled

Prefer Memory over Knowledge

Prefer Knowledge over Memory

Esse painel deve ser funcional de verdade.
Não entregar UI cosmética sem integração com backend e runtime.

Bloco F — Integração com Obsidian

F1. Vault como fonte documental

Implementar suporte a registrar um vault Obsidian como fonte de conhecimento.

O sistema deve tratar o vault como uma pasta real no filesystem contendo arquivos Markdown.

Suporte mínimo:

indexar arquivos .md

capturar frontmatter

capturar tags

capturar wiki links

capturar path relativo

mapear nota → documento indexado

F2. Estratégia obrigatória

Não integrar via automações frágeis acopladas ao app do Obsidian.
A integração deve ser feita por filesystem monitorado.

Estratégia:

vault local ou sincronizado

watcher local no servidor/host do Andromeda

detecção de criação/alteração/remoção

reindexação incremental

F3. Políticas de leitura e escrita

Por padrão:

vaultReadEnabled = false

vaultWriteEnabled = false

Nada deve ler ou escrever o vault sem política explícita.

Bloco G — Integração com Syncthing / Syncthing-Fork

G1. Papel do Syncthing

Tratar Syncthing/Syncthing-Fork como camada de replicação de filesystem.

Andromeda não deve depender de uma integração profunda com o app móvel.
A melhor estratégia é:

Syncthing sincroniza o vault entre dispositivos

Andromeda lê a cópia local monitorada

watchers detectam mudanças

pipeline reindexa incrementalmente

G2. Regras mínimas para este ciclo

Implementar suporte operacional para usar uma pasta sincronizada como source root do vault.

Suportar:

rescan manual

watch incremental

checksum ou mecanismo similar para evitar reprocessamento indevido

suporte a include/exclude patterns

G3. Boas práticas obrigatórias

Preparar o sistema para recomendar:

evitar escrita irrestrita no vault

evitar acoplamento em arquivos de configuração do Obsidian

evitar conflitos em paths não autorizados

separar claramente conteúdo indexável de configuração interna quando necessário

Bloco H — Escrita controlada no vault

H1. Não permitir escrita irrestrita por padrão

Implementar modos de escrita:

disabled

draft_only

append_only

managed_write

Não implementar full write irrestrito como padrão do ciclo.

H2. Draft / Approval flow

Quando o agente gerar escrita no vault, o fluxo mínimo deve ser:

agente propõe

proposal é persistida

humano aprova ou rejeita

se aprovado, adapter grava o arquivo ou alteração

evento é auditado

watcher reindexa a alteração

H3. Restrições mínimas

Suportar:

allowedPaths

operationType

create note

append section

update managed note

bloqueio de delete no MVP08, salvo se estiver muito claramente governado e simples

Bloco I — APIs mínimas

I1. Collections

GET /knowledge/collections

POST /knowledge/collections

GET /knowledge/collections/:id

PATCH /knowledge/collections/:id

DELETE /knowledge/collections/:id

I2. Documents

GET /knowledge/documents

POST /knowledge/documents/upload

POST /knowledge/documents/manual

GET /knowledge/documents/:id

POST /knowledge/documents/:id/reindex

DELETE /knowledge/documents/:id

I3. Retrieval

GET /knowledge/retrievals

GET /knowledge/retrievals/:id

I4. Vaults

GET /knowledge/vaults

POST /knowledge/vaults

GET /knowledge/vaults/:id

PATCH /knowledge/vaults/:id

POST /knowledge/vaults/:id/reindex

POST /knowledge/vaults/:id/rescan

POST /knowledge/vaults/:id/test-access

I5. Agent policy

GET /agents/:id/knowledge-policy

PUT /agents/:id/knowledge-policy

I6. Vault write proposals

GET /knowledge/vault-write-proposals

POST /knowledge/vault-write-proposals/:id/approve

POST /knowledge/vault-write-proposals/:id/reject

Bloco J — Contratos TS ↔ Python

J1. Cognitive service de knowledge

Criar ou expandir o serviço Python para suportar:

document parsing

chunking

embedding generation

indexation

retrieval

basic reranking

J2. Request/response canônicos

Os contratos devem incluir pelo menos:

requestId

correlationId

taskId

sessionId

agentId

collectionIds

vaultIds

input

constraints

context

timeoutMs

traceMetadata

E a resposta deve incluir pelo menos:

success

data

metrics

warnings

error

provider

modelUsed

durationMs

trace

selectedDocuments

selectedChunks

scoreSummary

J3. Versionamento

Adicionar versionamento explícito dos contratos.
Não deixar acoplamento implícito entre runtime TS e serviço Python.

Bloco K — Watchers e pipelines

K1. Watcher de vault

Implementar watcher para:

create

update

delete

rename quando possível

K2. Pipeline de ingestão

Separar claramente as etapas:

discovery

read

normalize

parse

chunk

embed

index

persist metadata

audit

K3. Jobs

Persistir jobs com status:

queued

running

completed

failed

retrying

cancelled

Bloco L — Auditabilidade

Toda execução que usar conhecimento recuperado deve registrar:

consulta usada

filtros usados

documentos candidatos quando aplicável

chunks selecionados

score

coleção de origem

vault de origem quando houver

tempo da operação

task associada

agente associado

Toda escrita no vault deve registrar:

agente

task

proposal

approvedBy

approvedAt

appliedAt

path

tipo de operação

resultado

Bloco M — Testes obrigatórios

M1. Unit tests

Cobrir no mínimo:

chunking policy

parser de markdown/frontmatter

normalização de metadados

filtros por coleção/agente/projeto

ranking básico

policy de leitura por agente

policy de escrita por agente

validação de allowedPaths

deduplicação simples

status transitions de jobs

M2. Integration tests

Cobrir no mínimo:

upload → ingestão → indexação → retrieval

texto manual → indexação → retrieval

task usando coleção autorizada

task bloqueada de coleção não autorizada

vault scan → notas indexadas

vault change → reindex incremental

write proposal → aprovação → escrita → reindexação

fallback quando serviço Python falhar

retrieval record persistido e associado à task

M3. Contract tests

Cobrir:

shape de KnowledgeDocument

shape de KnowledgeChunk

shape de RetrievalRecord

shape de AgentKnowledgePolicy

shape de VaultWriteProposal

payload TS → Python

payload Python → TS

M4. E2E tests

Cobrir:

criar coleção via web

subir documento via web

criar documento manual via web

ver status do processamento

executar task com agent knowledge habilitado

inspecionar documentos e chunks usados

cadastrar vault

habilitar leitura do vault no agente

gerar proposta de escrita

aprovar proposta

ver nota criada ou atualizada

M5. Regression suite

Criar regressões mínimas para impedir:

agente lendo coleção indevida

agente lendo vault sem permissão

agente escrevendo em path não autorizado

retrieval sem audit trail

documento removido continuando elegível

UI simulada sem backend funcional

chunk sem documento origem

proposal aprovada sem aplicação auditável

Bloco N — Critérios de pronto

O MVP08 só pode ser considerado concluído quando:

existir RAG funcional por agente

a UI web permitir upload real de documentos

a UI web permitir criação real de documento manual por texto

existirem coleções vinculáveis a agente/equipe/projeto

o runtime usar retrieval real em execução

fontes usadas puderem ser inspecionadas depois

existir cadastro funcional de vault Obsidian

existir leitura funcional de vault controlada por agente

a tela do agente permitir habilitar/desabilitar leitura do vault

a tela do agente permitir habilitar/desabilitar escrita do vault

escrita no vault estiver protegida por política e approval quando aplicável

jobs de ingestão estiverem visíveis

existirem testes unitários, integração, contrato, e2e e regressão mínimos passando

o frontend estiver funcional de verdade, não apenas compilando

O que NÃO deve entrar agora

Não implementar neste ciclo:

planner multi-etapas completo

coordenação multiagente avançada

multimodal amplo

OCR pesado como eixo central

knowledge graph avançado

consolidação cognitiva avançada

sumarização semântica sofisticada

deduplicação semântica pesada como eixo do ciclo

escrita irrestrita e silenciosa no vault

deleção livre de notas pelo agente

features cosméticas sem integração real

Anti-patterns proibidos

Não fazer:

misturar memory layer e knowledge layer como se fossem a mesma coisa

acoplar watcher diretamente ao runtime sem policy layer

acoplar regra de permissão no frontend

permitir acesso a vault sem trilha auditável

permitir escrita fora de allowedPaths

tratar configuração do Obsidian como conhecimento indexável por padrão sem critério

indexar tudo sem escopo

fazer UI fake

fazer retrieval invisível

deixar contratos TS ↔ Python implícitos

fazer o agente “editar o cérebro coletivo” sem governança

Ordem de implementação recomendada

1. Modelagem + migrations + entidades + repositories
2. APIs de collections/documents/policies/vaults
3. cognitive-python para parse/chunk/embed/index/retrieve
4. upload documental e documento manual
5. retrieval real no runtime
6. interface web Knowledge
7. watcher e reindexação incremental de vault
8. proposals de escrita com approval
9. testes de integração/e2e/regressão
10. endurecimento final de políticas, auditoria e UX

Entrega esperada

Ao final deste ciclo, o Andromeda deve possuir uma primeira camada real de conhecimento operacional:

governada

auditável

inspecionável

integrada ao runtime

operável via web

capaz de ingerir documentos e textos

capaz de usar um vault Obsidian como cérebro coletivo controlado

capaz de decidir, por agente, quem pode ler e quem pode escrever

capaz de provar depois quais fontes usou

Instrução final

Implemente isso como feature real do sistema, integrada ao runtime, ao painel web, às políticas por agente e à arquitetura híbrida TS + Python já definida no projeto.

Não entregue mock.

Não entregue apenas estrutura vazia.

Não entregue apenas endpoints.

Não entregue apenas UI.

Feche o fluxo ponta a ponta.

Ao terminar, deixe claro:

o que foi implementado

o que ficou parcial

o que depende de infraestrutura externa

como validar manualmente

quais testes automatizados foram adicionados

quais riscos ainda existem
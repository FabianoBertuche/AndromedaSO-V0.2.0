MVP04 — Model Center + Intelligent LLM Router
1. O catálogo de modelos deve ter custo

Concordo totalmente.
Sem custo, o roteamento fica cego.

Eu colocaria no catálogo três níveis de custo:

Custo estático

Informação configurada ou inferida do provider:

custo por 1M tokens de entrada

custo por 1M tokens de saída

custo por request, se existir

custo estimado por 1k tokens

custo relativo: baixo / médio / alto

Custo operacional

Métricas reais do uso:

média de tokens por execução

custo médio por task

custo médio por sessão

custo total acumulado por modelo

custo por tipo de atividade

Custo estratégico

Pontuação de eficiência:

qualidade entregue / custo

latência / custo

taxa de sucesso / custo

Ou seja, o catálogo não mostra só “quanto custa”, mas também:

“vale a pena usar este modelo para quê?”

2. A tela do LLM Router deve mostrar pontuação

Isso é essencial.

Eu faria uma página própria chamada algo como:

Router Intelligence

Ela mostraria, por modelo:

score geral

score por tarefa

custo

latência média

taxa de falha

taxa de fallback

taxa de sucesso

contexto suportado

capacidades

último benchmark

tendência de desempenho

E também, por tipo de atividade:

melhor modelo

melhor custo-benefício

mais rápido

mais estável

melhor fallback

3. O router deve classificar modelos por atividade

Aqui está o ponto mais importante do que você pediu:

o router não deve apenas ler metadados.
Ele deve construir uma classificação viva.

Atividades que eu sugeriria medir desde o começo

chat geral

raciocínio longo

coding

auditoria/revisão

extração estruturada

resumo

classificação

tool-use/orquestração

visão

embeddings

fallback rápido

Cada modelo recebe uma nota por atividade.

Exemplo:

qwen3.5:cloud

chat: 8.7

coding: 7.9

auditoria: 8.2

custo-benefício: 9.1

qwen3.5:397b-cloud

chat: 9.5

coding: 9.4

auditoria: 9.2

custo-benefício: 6.8

um modelo local leve

chat: 6.9

coding: 5.8

fallback rápido: 9.3

custo-benefício: 9.8

4. Como o router deve calcular a pontuação

Eu usaria uma composição de fatores.

Score final por atividade
score_final =
  qualidade * peso_qualidade +
  latencia * peso_latencia +
  custo * peso_custo +
  estabilidade * peso_estabilidade +
  aderencia_capacidade * peso_capacidade
Exemplos de fatores

Qualidade

nota dos testes automatizados

taxa de acerto

aderência ao formato pedido

precisão estrutural

Latência

tempo até primeira resposta

tempo total

estabilidade do tempo

Custo

custo estimado por execução

custo médio real

custo por sucesso útil

Estabilidade

taxa de erro

timeout

fallback acionado

respostas inválidas

Capacidade

suporta visão?

suporta contexto grande?

suporta saída estruturada?

suporta tool calling?

suporta streaming?

5. O router deve testar modelos automaticamente

Concordo 100%.

Isso deve virar um subsistema próprio:

Model Evaluation Engine

Esse módulo roda benchmarks internos e atualiza o ranking.

Como ele funcionaria
Suite de testes

Conjunto de prompts padronizados por categoria:

chat

código

JSON estruturado

resumo

classificação

auditoria

tool planning

visão

Execução periódica

manual

agendada

após adicionar provider

após sincronizar catálogo

após mudança de versão do modelo

Resultado

Cada teste gera:

score

tempo

custo

conformidade

erro/sucesso

observações

Esses resultados alimentam:

catálogo

router

ranking

recomendações

6. Estrutura de páginas que eu recomendo
A. Providers

Cadastro e saúde de providers.

B. Catálogo de Modelos

Lista de modelos e metadados.

Campos principais:

nome

provider

local/cloud

família

parâmetros

quantização

contexto

capacidades

custo

status

score geral

score por tarefa

recomendado para

C. Router Intelligence

Tela analítica do LLM Router.

Com:

ranking por tarefa

score por modelo

comparativo

pesos do roteador

regras de fallback

histórico de decisões

D. Benchmark Lab

Tela para rodar e inspecionar testes.

Com:

suíte de testes

execução por modelo

comparação entre modelos

custo por benchmark

histórico de resultados

7. Entidades principais
Modelo de catálogo
interface ModelCatalogItem {
  id: string;
  providerId: string;
  externalModelId: string;
  displayName: string;
  locality: "local" | "cloud";
  family?: string;
  parameterSize?: string;
  quantization?: string;
  contextWindow?: number;
  capabilities: string[];
  enabled: boolean;
  health: "ok" | "warning" | "error" | "unknown";

  pricing?: {
    inputPer1M?: number;
    outputPer1M?: number;
    currency?: "USD";
    estimated?: boolean;
  };

  metrics: {
    avgLatencyMs?: number;
    successRate?: number;
    fallbackRate?: number;
    avgTokensIn?: number;
    avgTokensOut?: number;
    avgCostPerRun?: number;
  };

  scores: {
    overall?: number;
    chat?: number;
    reasoning?: number;
    coding?: number;
    audit?: number;
    structuredOutput?: number;
    summary?: number;
    classification?: number;
    toolPlanning?: number;
    vision?: number;
    embeddings?: number;
    fastFallback?: number;
    costBenefit?: number;
  };

  recommendation?: {
    primaryUse?: string[];
    notes?: string;
  };
}
Resultado de benchmark
interface ModelBenchmarkResult {
  id: string;
  modelId: string;
  suite: string;
  taskType:
    | "chat"
    | "reasoning"
    | "coding"
    | "audit"
    | "structured-output"
    | "summary"
    | "classification"
    | "tool-planning"
    | "vision"
    | "embeddings";

  score: number;
  latencyMs: number;
  success: boolean;
  tokensIn?: number;
  tokensOut?: number;
  estimatedCost?: number;
  notes?: string;
  executedAt: string;
}
Perfil do roteador
interface RoutingDecisionProfile {
  purpose:
    | "default-chat"
    | "fast-chat"
    | "coding"
    | "auditor"
    | "vision"
    | "embedding"
    | "fallback";

  weights: {
    quality: number;
    latency: number;
    cost: number;
    stability: number;
    capabilityFit: number;
  };
}
8. Como o router decide de verdade

O fluxo ideal seria:

recebe a task

identifica o tipo de atividade

filtra modelos compatíveis

aplica restrições

precisa visão?

precisa local?

limite de custo?

precisa contexto longo?

ordena por score

escolhe o melhor

registra a decisão

se falhar, aplica fallback

salva resultado para retroalimentar o ranking

Ou seja, o router vira um sistema de decisão com memória operacional.

9. Sobre custo em Ollama / Ollama Cloud

Para modelos locais:

custo monetário direto pode ser zero ou estimado

mas o sistema pode calcular custo operacional:

CPU/GPU

VRAM

energia estimada

latência

Para cloud:

usar preço oficial quando houver

quando não houver, marcar como:

desconhecido

estimado

manualmente configurado

Então o catálogo deve suportar:

custo oficial

custo manual

custo estimado

custo operacional interno

10. O que isso muda no MVP04

Com esse refinamento, eu redefiniria o MVP04 assim:

MVP04 — Model Center, Benchmark Engine e Intelligent Router
Escopo mínimo correto
Backend

Provider Registry

Model Catalog

Pricing Registry

Benchmark Engine

Router Scoring Service

Routing Decision Log

Ollama local/cloud adapter

sync de modelos

benchmark manual

benchmark agendável

cálculo de score por tarefa

Frontend

página Providers

página Catálogo

página Router Intelligence

página Benchmark Lab

exibição do modelo escolhido em cada conversa

exibição do score e motivo da escolha

11. Resultado prático

Quando isso estiver pronto, o Andromeda poderá dizer algo como:

“Para esta task de auditoria, escolhi o modelo X porque ele tem score 8.9 em auditoria, custo médio 32% menor que o modelo Y, latência estável e taxa de sucesso superior nas últimas 200 execuções.”

Aí sim você terá um LLM Router real, e não apenas uma tabela de prioridade.

12. Minha conclusão objetiva

Você acertou em cheio.

O próximo módulo não deve ser apenas:

cadastro de modelo

escolha manual de provider

Ele deve ser:

uma central de modelos com benchmark, custo, score e roteamento inteligente baseado em evidência.

Esse desenho combina perfeitamente com o Andromeda.

Se quiser, eu posso agora transformar isso no PRD completo do MVP04 em markdown, já com:

visão do produto

arquitetura

entidades

páginas

endpoints

fluxos

critérios de aceite.

alguns tipos que o llm pode ser especialista:
  """Capacidades que um agente pode ter"""
    CODING = "coding"
    DEBUG = "debug"
    ARCHITECTURE = "architecture"
    SECURITY = "security"
    DEVOPS = "devops"
    DATABASE = "database"
    API = "api"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    ANALYSIS = "analysis"
    CHAT = "chat"
    VISION = "vision"
    AUDIO = "audio"
    PLANNING = "planning"
    RESEARCH = "research"
    REVIEW = "review"
tts
stt
ferramentas
hacking/pentest
etc
Pensou por dois segundos

Perfeito. Isso deve virar uma taxonomia oficial de capacidades do Andromeda, porque ela impacta diretamente:

catálogo de modelos

benchmark

llm router

seleção de fallback

criação de agentes especializados

tela de configuração

auditoria da decisão do roteador

O ideal é não tratar isso só como “tags soltas”, mas como um conjunto de capacidades padronizadas.

Sugestão de estrutura

Eu separaria em 3 níveis:

1. Capacidades principais

São as especializações que o modelo ou agente pode ter.

class AgentCapability(str, Enum):
    CODING = "coding"
    DEBUG = "debug"
    ARCHITECTURE = "architecture"
    SECURITY = "security"
    DEVOPS = "devops"
    DATABASE = "database"
    API = "api"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    ANALYSIS = "analysis"
    CHAT = "chat"
    VISION = "vision"
    AUDIO = "audio"
    PLANNING = "planning"
    RESEARCH = "research"
    REVIEW = "review"
    TTS = "tts"
    STT = "stt"
    TOOLS = "tools"
    PENTEST = "pentest"

Mas eu ampliaria um pouco para cobrir melhor o futuro do sistema.

Taxonomia expandida recomendada
class AgentCapability(str, Enum):
    CHAT = "chat"
    ANALYSIS = "analysis"
    REASONING = "reasoning"
    PLANNING = "planning"
    RESEARCH = "research"
    REVIEW = "review"
    DOCUMENTATION = "documentation"
    SUMMARIZATION = "summarization"
    CLASSIFICATION = "classification"
    EXTRACTION = "extraction"
    STRUCTURED_OUTPUT = "structured_output"

    CODING = "coding"
    DEBUG = "debug"
    ARCHITECTURE = "architecture"
    API = "api"
    DATABASE = "database"
    TESTING = "testing"
    DEVOPS = "devops"

    SECURITY = "security"
    PENTEST = "pentest"

    VISION = "vision"
    AUDIO = "audio"
    STT = "stt"
    TTS = "tts"

    TOOLS = "tools"
    FUNCTION_CALLING = "function_calling"
    AUTOMATION = "automation"

    TRANSLATION = "translation"
    MEMORY = "memory"
    RAG = "rag"
Minha recomendação prática

Para o MVP04, eu não deixaria isso tudo num nível só. Eu organizaria assim:

A. Capacidades de domínio

O que o modelo é bom em fazer.

coding

debug

architecture

security

devops

database

api

testing

documentation

analysis

planning

research

review

pentest

B. Capacidades de modalidade

Que tipo de entrada/saída ele suporta.

chat

vision

audio

stt

tts

C. Capacidades operacionais

Como ele se comporta dentro do sistema.

tools

function_calling

structured_output

automation

memory

rag

Isso ajuda muito o router.

Porque uma coisa é dizer:

“esse modelo é bom em coding”

Outra é dizer:

“esse modelo é bom em coding”

“aceita imagem”

“faz tool calling”

“consegue gerar JSON confiável”

“tem baixa latência”

“custo médio”

Importante: capability não é score

A capacidade deve dizer:
ele suporta / ele é elegível / ele é especializado nisso

Já o benchmark vai dizer:
quão bom ele é nisso

Exemplo:

{
  "model": "qwen3.5:cloud",
  "capabilities": [
    "chat",
    "analysis",
    "coding",
    "documentation",
    "review",
    "tools",
    "structured_output"
  ],
  "scores": {
    "chat": 8.7,
    "coding": 8.2,
    "review": 8.5,
    "documentation": 8.8,
    "tools": 7.4
  }
}
Isso melhora muito o LLM Router

O fluxo do router pode ser:

detectar a intenção da task

mapear para capacidades requeridas

filtrar modelos elegíveis

comparar scores

aplicar custo/latência/regras

decidir

registrar o motivo da escolha

Exemplo de mapeamento de task para capability
Usuário pede:

“crie um endpoint Fastify com testes”

Capacidades requeridas:

coding

api

testing

structured_output

Usuário pede:

“analise esta arquitetura e sugira melhorias”

Capacidades:

architecture

analysis

review

Usuário pede:

“transcreva este áudio”

Capacidades:

audio

stt

Usuário pede:

“narre esta resposta”

Capacidades:

tts

Usuário pede:

“use ferramentas para pesquisar e consolidar”

Capacidades:

research

tools

analysis

Sugestão extra: capability groups

Para a UI, vale mostrar grupos visuais:

Engenharia

coding

debug

architecture

api

database

testing

devops

Conhecimento

research

analysis

review

documentation

planning

Segurança

security

pentest

Multimodal

vision

audio

stt

tts

Operação

tools

function_calling

automation

memory

rag

structured_output

Sobre hacking/pentest

Aqui eu separaria mesmo:

security: revisão, análise, hardening, threat modeling, secure coding

pentest: testes ofensivos autorizados, exploração controlada, validação de superfície de ataque

Arquiteturalmente faz sentido, porque o roteador pode bloquear ou restringir pentest em certos contextos, enquanto security pode ser muito mais amplo.

Sugestão de modelo de dados
type Capability =
  | "chat"
  | "analysis"
  | "reasoning"
  | "planning"
  | "research"
  | "review"
  | "documentation"
  | "summarization"
  | "classification"
  | "extraction"
  | "structured_output"
  | "coding"
  | "debug"
  | "architecture"
  | "api"
  | "database"
  | "testing"
  | "devops"
  | "security"
  | "pentest"
  | "vision"
  | "audio"
  | "stt"
  | "tts"
  | "tools"
  | "function_calling"
  | "automation"
  | "memory"
  | "rag";

E no catálogo:

interface ModelCapabilityProfile {
  modelId: string;
  capabilities: Capability[];
  specializationScores: Partial<Record<Capability, number>>;
  confidence: Partial<Record<Capability, number>>;
}
O que eu faria no MVP04

Eu incluiria isso formalmente em quatro lugares:

1. Catálogo de modelos

Cada modelo mostra:

capabilities

scores por capability

2. Benchmark engine

Os testes são agrupados por capability.

3. Router intelligence

A decisão exibe:

capabilities requeridas

modelos elegíveis

score por capability

motivo da escolha

4. Cadastro manual

Você pode editar capabilities manualmente, além da descoberta automática.

Porque nem tudo virá do provider.

Minha recomendação objetiva

Use exatamente essa ideia, mas trate como:

Capability Registry oficial do Andromeda

com:

enum padronizado

grupos

score por capability

benchmark por capability

roteamento por capability

Isso vai dar uma base muito mais forte para o sistema do que pensar só em “modelo de chat” ou “modelo de código”.

No próximo passo, eu montaria isso já dentro do PRD do MVP04 como uma seção chamada:

Sistema de Capacidades e Especializações de Modelos.

pode seguir
Pensou por 5s

Perfeito. Seguindo nessa direção, aqui está o PRD do MVP04 já alinhado ao que definimos: Central de Modelos, Providers, Benchmark, custo e LLM Router inteligente.

PRD — MVP04
Andromeda OS — Model Center, Benchmark Engine e Intelligent LLM Router
1. Visão do MVP04

O MVP04 tem como objetivo transformar o Andromeda de uma base conversacional conectável a LLMs em um runtime inteligente de modelos, com capacidade de:

cadastrar múltiplos providers de LLM

descobrir modelos automaticamente

enriquecer o catálogo com metadados técnicos e custo

classificar modelos por capacidades e desempenho

executar benchmarks internos por tipo de atividade

roteá-los de forma inteligente com base em evidência

expor essas decisões em interface visual compreensível

O MVP04 não é apenas “conectar o Ollama”.
Ele é a criação da camada oficial de gestão e roteamento de modelos do Andromeda.

2. Objetivo do produto

Permitir que o Andromeda escolha, monitore e gerencie modelos de IA de forma semelhante a um sistema operacional que aloca recursos especializados conforme a tarefa.

Ao final do MVP04, o sistema deverá ser capaz de dizer:

“Escolhi este modelo para esta task porque ele possui as capacidades necessárias, melhor score histórico para essa atividade, custo aceitável, latência adequada e menor risco de fallback.”

3. Problema que o MVP04 resolve

Sem este módulo, o sistema sofre com limitações graves:

uso manual e pouco transparente dos modelos

dificuldade para trocar provider sem refatorar

ausência de gestão centralizada de custo

ausência de classificação por especialidade

ausência de benchmark comparativo interno

roteamento baseado em regra fixa ou preferência estática

dificuldade para escalar de um provider para múltiplos providers

O MVP04 resolve isso criando a fundação para um orquestrador real de modelos.

4. Escopo funcional do MVP04

O MVP04 inclui cinco blocos principais:

4.1 Provider Center

Cadastro, teste, sincronização e monitoramento de providers.

4.2 Model Catalog

Catálogo unificado de modelos com metadados, capacidades, custo e saúde.

4.3 Capability Registry

Sistema oficial de capacidades e especializações de modelos/agentes.

4.4 Benchmark Engine

Execução de testes internos para pontuar modelos por tipo de atividade.

4.5 Intelligent LLM Router

Motor de decisão que escolhe o melhor modelo conforme a task.

5. Providers suportados no MVP04
Obrigatórios

Ollama Local

Ollama Cloud

Arquitetura preparada para futuros providers

OpenAI

OpenRouter

Gemini

Anthropic

LM Studio

vLLM

gateways internos customizados

6. Requisitos de produto
6.1 Requisitos funcionais
RF-01 — Cadastro de provider

O sistema deve permitir cadastrar providers com:

nome

tipo

URL base

credenciais

status ativo/inativo

metadata opcional

RF-02 — Teste de conexão

O sistema deve permitir testar a conectividade de um provider.

RF-03 — Sincronização de modelos

O sistema deve listar e importar modelos disponíveis no provider.

RF-04 — Enriquecimento de catálogo

O sistema deve complementar o catálogo com:

família

tamanho

quantização

contexto

capacidades

custo

origem local/cloud

status

RF-05 — Edição manual de metadados

O operador deve poder ajustar manualmente:

capacidades

custo

prioridade

observações

elegibilidade para roteamento

RF-06 — Capability Registry

O sistema deve manter um registro oficial de capacidades suportadas.

RF-07 — Benchmark manual

O operador deve poder executar benchmarks por modelo, por suite ou por capability.

RF-08 — Benchmark agendável

O sistema deve permitir reexecução periódica de suites de benchmark.

RF-09 — Score por capability

O sistema deve calcular score por capability e score geral.

RF-10 — Roteamento inteligente

O LLM Router deve selecionar modelos com base em:

capacidades requeridas

score por atividade

custo

latência

estabilidade

restrições da task

RF-11 — Fallback automático

O roteador deve escolher fallback quando o modelo principal falhar.

RF-12 — Explicabilidade da decisão

Cada decisão do roteador deve registrar:

modelos considerados

restrições aplicadas

score final

motivo da escolha

fallback acionado, se houver

RF-13 — Exibição na interface

A UI deve mostrar:

modelo escolhido

provider

score

custo estimado

motivo resumido da escolha

6.2 Requisitos não funcionais
RNF-01 — Extensibilidade

Novos providers devem poder ser adicionados sem alterar o core do sistema.

RNF-02 — Observabilidade

Toda decisão de roteamento deve ser auditável.

RNF-03 — Baixo acoplamento

A UI nunca deve chamar diretamente Ollama CLI ou APIs externas; sempre via backend do Andromeda.

RNF-04 — Persistência

Catálogo, benchmarks, pricing, regras e decisões devem ser persistidos.

RNF-05 — Segurança

Credenciais de providers devem ser armazenadas de forma segura.

RNF-06 — Resiliência

Falhas em provider não devem derrubar o sistema de chat/sessão.

7. Capability Registry oficial

As capacidades devem ser padronizadas e separadas de score.

Capacidade significa:

o modelo suporta

o modelo é elegível

o modelo pode ser considerado

Score significa:

quão bom ele é naquela capacidade

7.1 Enum oficial de capacidades
type Capability =
  | "chat"
  | "analysis"
  | "reasoning"
  | "planning"
  | "research"
  | "review"
  | "documentation"
  | "summarization"
  | "classification"
  | "extraction"
  | "structured_output"
  | "coding"
  | "debug"
  | "architecture"
  | "api"
  | "database"
  | "testing"
  | "devops"
  | "security"
  | "pentest"
  | "vision"
  | "audio"
  | "stt"
  | "tts"
  | "tools"
  | "function_calling"
  | "automation"
  | "memory"
  | "rag";
7.2 Grupos de capacidades
Engenharia

coding

debug

architecture

api

database

testing

devops

Conhecimento

analysis

reasoning

planning

research

review

documentation

summarization

classification

extraction

Segurança

security

pentest

Multimodal

vision

audio

stt

tts

Operação

tools

function_calling

automation

structured_output

memory

rag

8. Model Catalog
8.1 Campos mínimos por modelo
interface ModelCatalogItem {
  id: string;
  providerId: string;
  externalModelId: string;
  displayName: string;
  locality: "local" | "cloud";
  family?: string;
  parameterSize?: string;
  quantization?: string;
  contextWindow?: number;
  capabilities: Capability[];
  enabled: boolean;
  health: "ok" | "warning" | "error" | "unknown";

  pricing?: {
    inputPer1M?: number;
    outputPer1M?: number;
    currency?: "USD";
    source?: "official" | "manual" | "estimated" | "unknown";
  };

  metrics: {
    avgLatencyMs?: number;
    successRate?: number;
    fallbackRate?: number;
    avgTokensIn?: number;
    avgTokensOut?: number;
    avgCostPerRun?: number;
  };

  scores: {
    overall?: number;
    chat?: number;
    analysis?: number;
    reasoning?: number;
    planning?: number;
    research?: number;
    review?: number;
    documentation?: number;
    coding?: number;
    debug?: number;
    architecture?: number;
    api?: number;
    database?: number;
    testing?: number;
    devops?: number;
    security?: number;
    pentest?: number;
    vision?: number;
    audio?: number;
    stt?: number;
    tts?: number;
    tools?: number;
    structured_output?: number;
    costBenefit?: number;
    fastFallback?: number;
  };

  recommendation?: {
    primaryUse?: string[];
    notes?: string;
  };
}
9. Pricing model

O sistema deve suportar três tipos de custo.

9.1 Custo oficial

Preço informado oficialmente pelo provider.

9.2 Custo manual

Preço configurado pelo operador.

9.3 Custo estimado

Preço inferido ou operacional:

token usage

CPU/GPU

VRAM

tempo médio

energia estimada, no futuro

9.4 Campos de pricing

input por 1M tokens

output por 1M tokens

moeda

origem do valor

custo estimado por execução

custo médio real por execução

custo por tipo de task

10. Benchmark Engine
10.1 Objetivo

Executar testes padronizados para medir desempenho real dos modelos.

10.2 Tipos de benchmark

chat

reasoning

coding

debug

architecture

api

testing

documentation

review

analysis

structured output

classification

summarization

research

security

pentest

vision

audio

stt

tts

tools

10.3 Métricas capturadas

score bruto

score normalizado

latência total

tempo até primeiro token, se houver

tokens de entrada

tokens de saída

custo estimado

sucesso/falha

conformidade com formato

fallback acionado

observações

10.4 Modelo de resultado
interface ModelBenchmarkResult {
  id: string;
  modelId: string;
  suite: string;
  taskType: string;
  score: number;
  latencyMs: number;
  success: boolean;
  tokensIn?: number;
  tokensOut?: number;
  estimatedCost?: number;
  notes?: string;
  executedAt: string;
}
10.5 Disparadores

manual

após adicionar provider

após sincronizar modelos

agendamento periódico

quando o operador solicitar recalibração

11. Intelligent LLM Router
11.1 Objetivo

Selecionar automaticamente o modelo mais adequado para cada task.

11.2 Entrada do roteador

intenção da task

capacidades requeridas

restrições operacionais

contexto da sessão

política de custo

prioridade de velocidade ou qualidade

11.3 Restrições possíveis

precisa ser local

precisa visão

precisa tools

limite máximo de custo

latência máxima

contexto mínimo

provider permitido

modelos proibidos

perfil de execução: rápido, econômico, premium, auditor

11.4 Fórmula conceitual de score
score_final =
  qualidade * peso_qualidade +
  latencia * peso_latencia +
  custo * peso_custo +
  estabilidade * peso_estabilidade +
  capability_fit * peso_capacidade
11.5 Fluxo de decisão

receber task

identificar tipo de atividade

mapear capabilities requeridas

filtrar modelos elegíveis

aplicar restrições

ordenar por score

selecionar melhor modelo

registrar decisão

executar

em caso de falha, aplicar fallback

retroalimentar métricas

11.6 Explicabilidade mínima

A decisão deve registrar:

atividade detectada

capabilities requeridas

candidatos avaliados

score dos candidatos

vencedor

fallback, se houver

custo estimado

justificativa curta

12. Páginas da interface
12.1 Página: Providers
Objetivo

Gerir conexões de modelos.

Conteúdo

lista de providers

status

URL base

autenticação

botão testar conexão

botão sincronizar modelos

botão habilitar/desabilitar

último sync

12.2 Página: Catálogo de Modelos
Objetivo

Exibir todos os modelos e seus metadados.

Colunas recomendadas

nome

provider

local/cloud

família

parâmetros

quantização

contexto

capabilities

custo

score geral

score por tarefa

saúde

recomendado para

status

Ações

habilitar/desabilitar

editar capabilities

editar pricing

rodar benchmark

testar modelo

definir prioridade

ver histórico

12.3 Página: Router Intelligence
Objetivo

Mostrar como o LLM Router pensa.

Conteúdo

ranking por atividade

score por modelo

pesos do roteador

top modelos por capability

custo-benefício

modelos mais rápidos

modelos mais estáveis

histórico de decisões

fallback rate

Visual importante

tabela comparativa por task

score radar por capability

explicação da escolha do roteador

12.4 Página: Benchmark Lab
Objetivo

Executar e inspecionar benchmarks.

Conteúdo

suites disponíveis

selecionar modelos

rodar benchmark

histórico de runs

custo do benchmark

score por suite

comparativo entre modelos

13. Fluxos principais
13.1 Fluxo: adicionar provider

usuário abre Providers

cadastra provider

salva credenciais

testa conexão

provider é marcado saudável ou com erro

13.2 Fluxo: sincronizar modelos

usuário aciona sincronização

backend consulta provider

importa catálogo

enriquece metadados

persiste itens

UI atualiza tabela

13.3 Fluxo: benchmark

usuário escolhe modelos e suite

benchmark engine executa prompts de teste

métricas são coletadas

scores são recalculados

ranking é atualizado

13.4 Fluxo: roteamento em conversa real

mensagem entra pela sessão

task é criada

router classifica atividade

busca modelos elegíveis

escolhe modelo

execução ocorre

resposta volta à sessão

resultado alimenta métricas futuras

14. Arquitetura sugerida
14.1 Backend — módulos
Provider Registry

Responsável por configs e adapters.

Model Discovery Service

Responsável por listar e sincronizar modelos.

Model Catalog Service

Responsável por catálogo persistido.

Capability Registry

Responsável pela taxonomia oficial.

Pricing Service

Responsável por custo oficial, manual e estimado.

Benchmark Engine

Responsável por executar suites.

Router Scoring Service

Responsável por calcular ranking e score final.

Routing Decision Service

Responsável por escolher modelo e registrar explicação.

Execution Adapter Layer

Responsável por executar o modelo escolhido.

14.2 Interfaces sugeridas
interface ModelProviderPort {
  healthCheck(): Promise<ProviderHealth>;
  listModels(): Promise<DiscoveredModel[]>;
  getModelDetails(modelId: string): Promise<DiscoveredModelDetails>;
  testPrompt(input: string, modelId: string): Promise<TestPromptResult>;
  chat(request: ChatRequest): Promise<ChatResponse>;
}
interface BenchmarkExecutorPort {
  runSuite(input: BenchmarkRunInput): Promise<BenchmarkRunResult>;
}
interface RoutingDecisionPort {
  decide(input: RoutingDecisionInput): Promise<RoutingDecision>;
}
15. Integração inicial com Ollama
15.1 MVP04 deve usar API do provider

No produto, a integração deve priorizar API.

Ollama local

listagem de modelos

detalhes de modelo

execução de chat

consulta de runtime

Ollama cloud

Mesmo conceito, respeitando autenticação e catálogo disponível.

15.2 CLI apenas como apoio operacional

Comandos CLI podem existir para debug administrativo, mas não devem ser a base da UI.

16. Endpoints sugeridos
Providers

GET /providers

POST /providers

PATCH /providers/:id

POST /providers/:id/test

POST /providers/:id/sync-models

Model Catalog

GET /models

GET /models/:id

PATCH /models/:id

POST /models/:id/benchmark

POST /models/:id/test

Benchmarks

GET /benchmarks

POST /benchmarks/runs

GET /benchmarks/runs/:id

Router

GET /router/rankings

GET /router/decisions

GET /router/decisions/:id

PATCH /router/profiles/:purpose

17. Critérios de aceite

O MVP04 será considerado pronto quando:

for possível cadastrar ao menos um provider Ollama local e um cloud

o sistema conseguir sincronizar modelos automaticamente

o catálogo exibir capacidades, custo e score

o operador puder editar capacidades e custo manualmente

o benchmark engine puder rodar ao menos uma suite por categoria

o LLM Router puder classificar e escolher modelos automaticamente

a interface mostrar o motivo básico da decisão

fallback funcionar quando o modelo principal falhar

a conversa real puder usar o modelo roteado pelo sistema

todas as decisões ficarem registradas para inspeção

18. Fora do escopo do MVP04

Estes itens ficam para fases posteriores:

ajuste automático por reinforcement learning

benchmarking distribuído massivo

estimativa energética precisa de custo local

fine-tuning automático

roteamento multi-modelo em paralelo

mistura de especialistas na mesma resposta

seleção automática por perfil de usuário

voz completa em produção

RAG avançado conectado ao router

auto-reconfiguração completa de pesos

19. Nome sugerido do MVP04

As melhores opções, na minha visão, são:

MVP04 — Model Center & Intelligent Router

MVP04 — Central de Modelos e Roteamento Inteligente

MVP04 — Provider Center, Benchmark e LLM Router

Minha escolha principal seria:

MVP04 — Central de Modelos e Roteamento Inteligente
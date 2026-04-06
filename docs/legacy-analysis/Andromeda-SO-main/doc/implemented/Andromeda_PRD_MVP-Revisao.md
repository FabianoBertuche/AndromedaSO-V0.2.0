PRD — MVP-Revisão
Saneamento Estrutural, Fechamento de Pendências Críticas e Validação Funcional
1. Objetivo

Executar um ciclo de revisão técnica do Andromeda para:

fechar pendências críticas já prometidas em MVPs anteriores

alinhar a implementação ao desenho arquitetural oficial

reorganizar a estrutura do repositório e dos testes

tornar o frontend realmente validado funcionalmente, não apenas compilável

criar uma base mínima de regressão confiável antes de avançar para o MVP07

Este ciclo não é para abrir grandes features novas. Ele existe para reduzir inconsistência, aumentar confiabilidade e preparar a base para a próxima evolução.

2. Motivação

A auditoria recente mostrou inconsistências importantes entre PRD, arquitetura e implementação atual, principalmente:

sandbox ainda file-backed, embora o PRD exija persistência via banco/Prisma e migrations

perda do metadata.context no fluxo Console → Gateway → Task, embora o MVP06 exija suporte ao targeting por agente e contexto completo

sandbox existente como módulo administrativo, mas ainda não realmente integrada ao runtime operacional como camada de enforcement

sinais de integração incompleta no frontend, como a mensagem “Algumas informações do agente não podem ser relacionadas...” e subaba Sandbox vazia

organização de testes e workspaces ainda inconsistente com a estrutura recomendada

3. Escopo
3.1 Entra neste ciclo
A. Fechamento estrutural do subsistema Sandbox

migrar persistência de file-backed para Prisma/PostgreSQL

criar migrations e repositories concretos

manter compatibilidade arquitetural com os repositórios previstos para sandbox

integrar sandbox ao fluxo real de execução do agente

garantir approvals, artifacts, logs e auditoria persistidos

corrigir carregamento e relacionamento de dados da Sandbox no frontend

B. Correção do fluxo Console → Gateway → Task

preservar metadata.context

garantir transporte de:

targetAgentId

targetAgentVersion

targetTeamId

personaProfileId

interactionMode
conforme sugerido no MVP06

C. Organização estrutural do repositório

alinhar workspaces e scripts

incluir apps/web no workspace raiz

revisar posição de arquivos fora do padrão arquitetural oficial

D. Reorganização e fortalecimento dos testes

localizar testes espalhados

classificá-los por módulo e tipo

padronizar convenções

consolidar helpers, mocks e fixtures

criar regressão mínima para fluxos críticos

E. Validação funcional do frontend

Agents

Sandbox

Console

fluxo de approvals quando aplicável

ausência de mensagens de relacionamento quebrado quando dados estiverem corretamente disponíveis

3.2 Não entra neste ciclo

Ficam fora:

Memory Layer v1

RAG completo

eval-service completo

planner

multimodal

benchmark avançado

advanced router signals

Esses itens pertencem a ciclos posteriores. O próprio MVP06 aponta o próximo passo natural como MVP07 — Memory Layer v1, depois da estabilização de identidade e governança

4. Requisitos funcionais
RF-01 — Persistência real da Sandbox

A sandbox deve deixar de usar persistência em arquivo como fonte principal e passar a usar banco com Prisma/migrations, cobrindo ao menos:

sandbox_profiles

agent_sandbox_configs

sandbox_executions

sandbox_artifacts

approval_requests

RF-02 — Integração real da Sandbox no runtime

A sandbox deve participar do caminho real de execução operacional:

Agent Runtime → Capability Policy Engine → Sandbox Policy Resolver → Sandbox Validator → Approval Gate → Execution Orchestrator → Sandbox Runner → Artifact Manager + Audit Logger → Result

RF-03 — Preservação do contexto do Console

O transporte do Console até a task deve preservar o bloco metadata.context com todos os campos esperados pelo MVP06

RF-04 — Frontend funcional da aba Agents/Sandbox

A UI deve:

carregar a aba Agents sem travar

carregar a subaba Sandbox com dados reais quando existirem

exibir claramente policy efetiva, risco, configuração e histórico quando disponíveis

deixar de mostrar erro de relacionamento quebrado quando o backend fornecer os dados corretamente

mostrar fallback útil e rastreável quando houver dados realmente ausentes

RF-05 — Workflow de approvals utilizável

Como o backend já prevê endpoints de aprovação/rejeição, a interface deve materializar o fluxo mínimo de approvals no frontend

RF-06 — Workspace e scripts consistentes

O workspace raiz deve cobrir também apps/web, permitindo execução integrada de build/test/lint conforme esperado numa base monorepo coerente com a arquitetura do projeto

5. Requisitos não funcionais
RNF-01 — Coerência arquitetural

Preservar Clean Architecture / Ports & Adapters e manter separação clara entre:

packages/core

packages/api

packages/shared

apps/web

services/cognitive-python

RNF-02 — Segurança operacional

As regras centrais da sandbox continuam válidas:

deny-by-default

most-restrictive-wins

não executar como root

não executar privilegiado

não herdar segredos do host por padrão

capabilities operacionais exigem sandbox quando definido

RNF-03 — Auditabilidade

Toda execução operacional relevante deve deixar trilha auditável, incluindo policy snapshot, logs, artefatos e status

RNF-04 — Testabilidade

O resultado deve aumentar a testabilidade do sistema e seguir a estratégia oficial de testes do projeto

6. Estrutura-alvo de testes

Os testes não devem ficar todos em um diretório único sem critério. A organização alvo deve ser por módulo e por tipo:

apps/
  web/
    tests/
      unit/
      integration/
      component/
      regression/

packages/
  api/
    tests/
      unit/
      integration/
      contract/
      regression/

  core/
    tests/
      unit/
      integration/
      contract/
      regression/

  shared/
    tests/
      unit/

services/
  cognitive-python/
    tests/
      unit/
      integration/
      contract/
      eval/

Essa direção é compatível com a organização recomendada do projeto e com a separação entre TypeScript control plane e Python specialized services

7. Estratégia de testes desta etapa
7.1 Unit tests

Devem cobrir no mínimo:

policy merge da sandbox

validator de sandbox

mapeamento de contexto do Console

adapters e mappers determinísticos

repositórios Prisma com doubles/fakes quando aplicável

translators de payload/metadata

Alinhado à estratégia oficial de TDD do núcleo determinístico

7.2 Integration tests

Devem cobrir:

Console → Web channel → CreateTaskFromMessage → Task metadata

Agent Runtime → Sandbox enforcement → Runner → Audit

GET/PUT de sandbox por agente

workflow approval pendente → approve/reject → atualização de status

frontend consumindo dados reais de sandbox do backend

7.3 Contract tests

Devem cobrir:

contrato do metadata.context do Console

endpoints REST da Sandbox

contratos TS ↔ Python já introduzidos no 06C

shape de response necessário para a subaba Sandbox

7.4 Regression suite

Criar regressão mínima para evitar retorno dos bugs atuais:

perda de metadata.context

aba Agents travando em carregamento parcial

subaba Sandbox vazia quando os dados existirem

mensagem de relacionamento quebrado quando o backend estiver consistente

execução operacional sem enforcement de sandbox

apps/web ficando fora da execução integrada do workspace

7.5 Eval tests

Não expandir evals cognitivos amplos nesta etapa. Só manter o que já existir e acrescentar o mínimo necessário se algum comportamento cognitivo estiver diretamente afetado.

8. Casos de teste propostos
CT-01 — Persistência Sandbox via Prisma

Objetivo: garantir que perfis, configs, execuções, artifacts e approvals estão persistidos em banco.
Validação: CRUD real + recuperação após reinício.

CT-02 — Metadata do Console preservada

Objetivo: garantir que targetAgentId, targetAgentVersion, targetTeamId, personaProfileId e interactionMode chegam à task.
Validação: teste de integração ponta a ponta no backend.

CT-03 — Subaba Sandbox carrega dados reais

Objetivo: garantir que a UI mostra dados da sandbox quando houver relacionamento válido.
Validação: teste de componente/integration do frontend com API mockada e com API real de dev.

CT-04 — Mensagem de relacionamento quebrado só aparece quando realmente houver falha

Objetivo: impedir falso positivo de erro no frontend.
Validação: cenários com dados completos, dados parciais e erro real.

CT-05 — Sandbox enforcement no runtime

Objetivo: garantir que capability operacional passe pelo fluxo policy → validator → approval → orchestrator → runner → audit.
Validação: teste de integração com ProcessSandboxRunner real.

CT-06 — Approval workflow

Objetivo: garantir listagem, aprovação e rejeição funcionais na UI e na API.
Validação: fluxo pendente → approve/reject → atualização da execução.

CT-07 — Workspaces integrados

Objetivo: garantir que scripts de build/test da raiz cobrem apps/web, packages/api e services/cognitive-python.
Validação: execução unificada e falha corretamente quando qualquer parte falhar.

CT-08 — Contrato TS ↔ Python preservado

Objetivo: manter íntegro o bridge introduzido no 06C.
Validação: request/response canônicos, retries, timeouts e correlation IDs

CT-09 — Presets e dados de sandbox visíveis na UI

Objetivo: validar que perfis/presets persistidos são apresentados na gestão do agente.
Validação: carregar lista, selecionar, aplicar e salvar.

CT-10 — Histórico e policy viewer da Sandbox

Objetivo: validar exibição de effective policy, risk badge e histórico de execuções.
Validação: teste de componente + integração com backend.

9. Validação obrigatória do frontend

O frontend não pode ser considerado validado apenas porque compila.

Deve haver validação funcional explícita das áreas afetadas:

aba Agents

subaba Sandbox

Console

approvals

carregamento parcial com fallback

fluxo de seleção de agente e envio de contexto

Qualquer um dos seguintes deve ser tratado como falha desta etapa:

subaba vazia sem motivo legítimo

mensagem de relacionamento quebrado em cenário válido

dado existente no backend e ausente na UI por falha de integração

ação de UI sem persistência real

comportamento que depende de refresh manual para funcionar

10. Comandos obrigatórios de validação
10.1 Workspace raiz
npm install
npm run build --workspaces
npm run test --workspaces
10.2 Frontend
cd apps/web
npm run test
npm run build
10.3 Backend API
cd ../../packages/api
npm run test
npm run build
10.4 Cognitive Python
cd ../../services/cognitive-python
pip install -r requirements.txt
pytest
python -m py_compile app/main.py
10.5 Verificação integrada final

Se houver script unificado, rodar também:

cd ../../
npm run verify
10.6 Validação funcional manual/assistida obrigatória

Além dos comandos acima, deve haver evidência de validação funcional de:

abrir Agents

trocar subabas

abrir Sandbox

visualizar perfis/configuração

executar fluxo Console com agente selecionado

verificar preservação de contexto

validar fila/ação de approval quando aplicável

11. Evidências obrigatórias de entrega

Ao final, a implementação deve entregar:

lista dos arquivos alterados

resumo das pendências corrigidas

resumo do que permaneceu pendente e por quê

saída dos comandos executados

evidência objetiva do frontend funcional

confirmação explícita sobre:

mensagem de relacionamento quebrado corrigida ou explicada

subaba Sandbox carregando corretamente

metadata do Console preservada

sandbox persistida em banco

enforcement do runtime ativo

12. Ordem de implementação recomendada
Fase 1 — Correções críticas de estrutura

migrar Sandbox para Prisma/PostgreSQL

criar migrations e repositories concretos

alinhar workspaces da raiz

declarar dependências de teste Python

Fase 2 — Correções críticas de runtime

preservar metadata.context

completar campos de targeting

integrar sandbox ao runtime real

garantir persistência de execuções, artifacts e approvals

Fase 3 — Correções críticas de frontend

corrigir relacionamento da subaba Sandbox

corrigir mensagem de inconsistência indevida

garantir exibição de policy/risk/history

materializar approvals na UI

Fase 4 — Saneamento de testes

reorganizar testes espalhados

classificar por módulo e tipo

consolidar helpers/mocks/fixtures

criar regression suite mínima

Fase 5 — Fechamentos secundários

diff de versões

preset “Companheiro Operacional”

gaps restantes de gestão de agentes

runners container/remote, se o escopo permitir sem destabilizar o restante

13. Critério de pronto

O MVP-Revisão só será considerado concluído quando:

a Sandbox estiver persistida em banco, não mais file-backed como fonte principal

o fluxo Console → Gateway → Task preservar o contexto esperado pelo MVP06

a Sandbox participar do runtime real de execução operacional

a aba Agents e a subaba Sandbox estiverem funcionalmente validadas

os testes estiverem organizados de forma coerente com a arquitetura

existir regressão mínima para os bugs corrigidos nesta etapa

o projeto estiver mais preparado para iniciar o MVP07 sem carregar dívida estrutural crítica

14. Prompt pronto para o Codex / Antigravity
Estou iniciando o **MVP-Revisão do Andromeda OS**.

Leia primeiro e trate como referência principal:

- /doc/mvp01.md
- /doc/DOCUMENTACAO_TECNICA_mvp05.md
- /doc/Andromeda_PRD_MVP06.md
- /doc/Andromeda_PRD_MVP06B.md
- /doc/Andromeda_PRD_MVP06C.md

## Objetivo
Executar um ciclo de saneamento estrutural, fechamento de pendências críticas e validação funcional real.

Este ciclo NÃO é para abrir grandes features novas.
Ele serve para:
- fechar inconsistências reais entre PRD e código
- reorganizar o projeto
- consolidar a base de testes
- validar o frontend de verdade

## Pendências prioritárias a corrigir agora
1. Migrar Sandbox de file-backed para Prisma/PostgreSQL com migrations.
2. Preservar metadata.context no fluxo Console -> Gateway -> Task.
3. Completar targeting com:
   - targetAgentId
   - targetAgentVersion
   - targetTeamId
   - personaProfileId
   - interactionMode
4. Integrar Sandbox ao runtime real de execução.
5. Incluir apps/web no workspace raiz.
6. Declarar dependências de teste Python no requirements.
7. Corrigir a subaba Sandbox do frontend para carregar dados reais.
8. Eliminar a mensagem de relacionamento quebrado quando houver dados válidos.
9. Materializar approvals na UI.
10. Criar regressão para evitar retorno desses bugs.

## Regras obrigatórias
- preservar Clean Architecture / Ports & Adapters
- TS continua como control plane
- Python permanece camada especializada
- não mover regra de negócio para controller/component
- não abrir escopo novo de feature fora desta revisão
- manter auditabilidade e segurança operacional

## Estrutura de testes desejada
Organizar testes por módulo e por tipo:

- apps/web/tests/{unit,integration,component,regression}
- packages/api/tests/{unit,integration,contract,regression}
- packages/core/tests/{unit,integration,contract,regression}
- packages/shared/tests/unit
- services/cognitive-python/tests/{unit,integration,contract,eval}

## Testes obrigatórios desta etapa

### Backend / integração
- Console -> Web channel -> CreateTaskFromMessage preserva metadata.context
- Sandbox persistence via Prisma
- Sandbox enforcement no runtime real
- Approval workflow na API
- contrato TS -> Python preservado

### Frontend
- Aba Agents carrega sem travar
- Subaba Sandbox carrega com dados reais
- Mensagem “Algumas informações do agente não podem ser relacionadas...” só aparece quando realmente houver inconsistência
- Approvals aparecem e mudam de estado quando aplicável
- Policy viewer / risk badge / histórico funcionam com dados reais

### Regressão
- impedir retorno da perda de metadata
- impedir retorno da subaba Sandbox vazia
- impedir retorno de erro falso de relacionamento
- impedir apps/web ficar fora da validação integrada da raiz

## Comandos obrigatórios de validação

### raiz
npm install
npm run build --workspaces
npm run test --workspaces

### frontend
cd apps/web
npm run test
npm run build

### backend
cd ../../packages/api
npm run test
npm run build

### python
cd ../../services/cognitive-python
pip install -r requirements.txt
pytest
python -m py_compile app/main.py

### opcional se existir
cd ../../
npm run verify

## Regra crítica de aceite
NÃO considere o frontend validado apenas porque compilou.

É obrigatório validar funcionalmente:
- Agents
- Sandbox
- Console
- approvals
- carregamento parcial
- renderização de dados reais
- fluxo visível de integração

## Evidências obrigatórias de entrega
Ao final, entregar:
1. arquivos alterados
2. pendências corrigidas
3. pendências restantes
4. saída dos comandos
5. evidência da UI funcionando
6. confirmação explícita de:
   - sandbox persistida em banco
   - metadata preservada
   - sandbox integrada ao runtime real
   - subaba Sandbox funcionando
   - mensagem de relacionamento quebrado corrigida ou justificada

## Ordem de trabalho
1. mapear a estrutura atual
2. localizar os testes existentes
3. corrigir persistência da Sandbox
4. corrigir transporte do metadata.context
5. integrar Sandbox ao runtime real
6. corrigir frontend da subaba Sandbox
7. alinhar workspaces/scripts
8. reorganizar testes
9. criar regressões
10. validar tudo com comandos e evidências funcionais

Antes de aplicar patches, mostre:
- diagnóstico breve
- plano de arquivos afetados
- prioridade das correções
- o que fica deliberadamente fora desta etapa
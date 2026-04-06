# MVP06: Agent Identity, Safeguards & Agent Management Console - Documentação Técnica

Este documento define o escopo funcional e técnico do **MVP06** do Andromeda OS, introduzindo uma camada formal de **identidade de agentes**, um sistema de **salvaguardas comportamentais** e uma nova área da **interface web** para gestão, ajuste e conversa com agentes.

O objetivo deste MVP é transformar os agentes do sistema em entidades **governáveis, consistentes, auditáveis e configuráveis**, evitando que o comportamento do agente dependa apenas de prompts soltos ou do modelo LLM subjacente.

---

## 🎯 Objetivo

Implementar um sistema onde cada agente possua:

- uma **identidade operacional formal**
- uma **personalidade configurável**
- um conjunto de **regras obrigatórias**
- **salvaguardas** para garantir aderência ao comportamento esperado
- uma **interface de gestão** no frontend
- um **canal de conversa direta** via Console Web

Este MVP consolida a separação entre:

- **Agente** = identidade, papel, regras, comportamento, responsabilidade
- **Modelo** = recurso computacional selecionável pelo roteador

Assim, o mesmo agente poderá operar com modelos diferentes sem perder sua essência operacional.

---

## 🧠 Visão Conceitual

Até o MVP04, o Andromeda já possui uma base sólida para:

- execução de tasks
- roteamento inteligente de modelos
- console web em tempo real
- gateway unificado de comunicação
- sessões, timeline e observabilidade

O próximo salto arquitetural é garantir que o agente não seja apenas “um nome apontando para um modelo”, mas sim uma unidade formal com:

- **identidade própria**
- **comportamento previsível**
- **controles de governança**
- **ajustes de personalidade**
- **auditoria de aderência**

---

## ✅ Escopo do MVP06

O MVP06 será dividido em três grandes blocos:

### 1. Agent Identity System

Camada responsável por descrever quem o agente é e como ele deve atuar.

### 2. Behavior Safeguards Engine

Camada responsável por verificar e reforçar o comportamento esperado do agente durante a execução.

### 3. Agent Management UI

Nova área do frontend para criar, editar, configurar e conversar com agentes.

---

# 1. Agent Identity System

## 1.1 Objetivo

Criar um sistema estruturado de identidade inspirado em abordagens como `SOUL.md`, porém mais robusto e adequado à arquitetura do Andromeda.

A identidade do agente não deve existir como um único prompt monolítico. Ela deve ser modelada em componentes separados e reutilizáveis.

## 1.2 Estrutura proposta por agente

Cada agente deverá possuir um pacote de identidade composto por:

### `identity.md`

Define a identidade base do agente.

Conteúdo sugerido:

- nome do agente
- função principal
- missão
- escopo de atuação
- estilo geral de comunicação
- papel no ecossistema
- tipo de agente (executor, orquestrador, auditor, pesquisador etc.)

### `soul.md`

Define a essência subjetiva e comportamental do agente.

Conteúdo sugerido:

- personalidade
- valores
- postura
- forma de raciocínio
- forma de tratar o usuário
- reação a ambiguidade
- reação a falhas
- nível de iniciativa
- relação com subagentes

### `rules.md`

Define regras obrigatórias e limites operacionais.

Conteúdo sugerido:

- regras que o agente deve sempre seguir
- comportamentos proibidos
- quando delegar
- quando pedir revisão
- quando emitir feedback
- quando interromper execução
- quando pedir evidências adicionais

### `playbook.md`

Define a forma padrão de operação do agente.

Conteúdo sugerido:

- como iniciar uma task
- como brainstormar
- como executar
- como revisar
- como reportar progresso
- como concluir
- como atuar em tarefas longas

### `context.md`

Contexto permanente do agente dentro do projeto.

Conteúdo sugerido:

- stack do projeto
- arquitetura atual
- objetivos vigentes
- decisões arquiteturais já tomadas
- restrições
- padrões internos

---

## 1.3 Estrutura tipada no backend

Além dos arquivos Markdown, o sistema deverá manter representações estruturadas.

### Entidades principais

- `AgentProfile`
- `AgentIdentity`
- `AgentSoul`
- `AgentRuleSet`
- `AgentPlaybook`
- `AgentPersonaConfig`
- `AgentBehaviorSnapshot`

### Responsabilidades

#### `AgentProfile`

Agrega toda a configuração ativa do agente.

#### `AgentIdentity`

Contém os dados centrais de nome, papel, missão e escopo.

#### `AgentSoul`

Contém atributos subjetivos e descritivos de comportamento.

#### `AgentRuleSet`

Contém regras determinísticas, obrigatórias e restritivas.

#### `AgentPlaybook`

Contém procedimentos operacionais preferenciais.

#### `AgentPersonaConfig`

Contém parâmetros numéricos e toggles comportamentais.

#### `AgentBehaviorSnapshot`

Captura a configuração efetiva usada em uma execução específica para fins de auditoria.

---

## 1.4 Montagem do contexto do agente no runtime

O runtime deverá montar o contexto-base do agente em camadas, respeitando a seguinte ordem:

1. identidade base
2. alma / personalidade
3. regras duras
4. playbook operacional
5. contexto permanente
6. memória recuperada (em MVP futuro)
7. contexto da sessão atual
8. task ou mensagem atual

Essa ordem é importante para que:

- a identidade venha antes da tarefa
- as regras limitem a interpretação do agente
- o playbook padronize a execução
- a memória complemente o agente, em vez de substituir sua identidade

---

# 2. Persona Config Numérica

## 2.1 Objetivo

Além da configuração em Markdown, o Andromeda deverá oferecer uma camada numérica ajustável via interface.

Essa camada não substitui a identidade textual; ela ajusta a modulação do comportamento de forma previsível.

## 2.2 Parâmetros sugeridos

Escala sugerida: **0 a 100**.

### Comunicação

- `formality`
- `warmth`
- `objectivity`
- `detail_level`

### Tomada de decisão

- `caution`
- `autonomy`
- `creativity`
- `ambiguity_tolerance`

### Operação

- `proactivity`
- `delegation_tendency`
- `feedback_frequency`
- `playbook_strictness`

### Governança

- `compliance_strictness`
- `self_review_intensity`
- `evidence_requirements`

---

## 2.3 Exemplo de configuração

```json
{
  "formality": 55,
  "warmth": 68,
  "objectivity": 82,
  "detail_level": 70,
  "caution": 74,
  "autonomy": 80,
  "creativity": 62,
  "ambiguity_tolerance": 45,
  "proactivity": 88,
  "delegation_tendency": 76,
  "feedback_frequency": 90,
  "playbook_strictness": 72,
  "compliance_strictness": 85,
  "self_review_intensity": 78,
  "evidence_requirements": 64
}
```

---

## 2.4 Tradução prática dos parâmetros

Os sliders devem impactar o comportamento real do runtime.

### `proactivity`

- baixo: responde apenas o que foi pedido
- médio: sugere próximos passos básicos
- alto: identifica lacunas, propõe melhorias e antecipa ações

### `caution`

- baixo: age rapidamente com menos validação
- alto: valida contexto, aplica checagens e reduz improvisação

### `delegation_tendency`

- baixo: tenta resolver sozinho
- alto: prefere chamar subagentes especializados cedo

### `feedback_frequency`

- baixo: comunica apenas no final
- alto: envia status durante o andamento da atividade

### `formality`

- baixo: linguagem mais conversacional
- alto: linguagem mais técnica e protocolar

### `creativity`

- baixo: tende a soluções conservadoras
- alto: tende a explorar alternativas e estruturas novas

---

# 3. Behavior Safeguards Engine

## 3.1 Objetivo

Garantir que o agente siga seu comportamento esperado de forma verificável e não apenas “por intenção”.

O sistema precisa detectar quando o agente:

- fugiu do seu papel
- ignorou regras duras
- deixou de dar feedback quando deveria
- tomou atitude incompatível com seu perfil
- respondeu fora do tom esperado
- deixou de delegar quando a política exigia

---

## 3.2 Camadas de salvaguarda

### Camada 1 — Prompt Assembly Control

A montagem do contexto já é uma salvaguarda estrutural.

### Camada 2 — Pre-Execution Policies

Antes da execução, o sistema valida:

- se o agente escolhido pode executar a tarefa
- se o perfil está ativo
- se há políticas mandatórias aplicáveis
- se o modo de operação exige revisão ou auditoria

### Camada 3 — In-Execution Guidance

Durante a execução, o runtime pode:

- forçar checkpoints de feedback
- exigir delegação em tarefas específicas
- acionar self-review
- elevar nível de cautela conforme o tipo de tarefa

### Camada 4 — Post-Response Evaluation

Após a resposta, um motor de avaliação atribui scores de aderência.

### Camada 5 — Corrective Loop

Se o score ficar abaixo do limiar:

- reescreve resposta
- pede revisão por auditor
- aplica fallback seguro
- bloqueia resposta fora de conformidade

---

## 3.3 Policies propostas

Criar novas policies especializadas:

- `AgentIdentityPolicy`
- `AgentBehaviorPolicy`
- `AgentTonePolicy`
- `AgentDelegationPolicy`
- `AgentFeedbackPolicy`
- `AgentBoundaryPolicy`
- `AgentConformancePolicy`

### Responsabilidades resumidas

#### `AgentIdentityPolicy`

Garante que o agente está atuando dentro do papel esperado.

#### `AgentBehaviorPolicy`

Valida aderência geral à personalidade e modo de agir.

#### `AgentTonePolicy`

Valida tom, formalidade, calor humano e objetividade.

#### `AgentDelegationPolicy`

Verifica se o agente chamou subagentes quando necessário.

#### `AgentFeedbackPolicy`

Verifica se houve reportes intermediários quando exigidos.

#### `AgentBoundaryPolicy`

Impede respostas ou ações fora do escopo do agente.

#### `AgentConformancePolicy`

Consolida score final de conformidade comportamental.

---

## 3.4 Score de aderência

Cada execução poderá receber pontuações internas como:

- `identity_alignment_score`
- `tone_alignment_score`
- `policy_compliance_score`
- `feedback_compliance_score`
- `delegation_alignment_score`
- `playbook_alignment_score`
- `overall_conformance_score`

Escala sugerida: **0 a 1** ou **0 a 100**.

### Estratégia sugerida

- acima de 85: aprovado
- entre 70 e 84: aprovado com observação
- entre 50 e 69: revisão automática
- abaixo de 50: bloqueio ou fallback

---

## 3.5 Auditoria comportamental

Toda execução deve registrar:

- agente escolhido
- versão do perfil usado
- configuração numérica ativa
- políticas aplicadas
- score final de aderência
- violações encontradas
- ação corretiva disparada
- resposta final aprovada

Isso permitirá observar se um agente está realmente ficando melhor com o tempo.

---

# 4. Agent Management UI

## 4.1 Objetivo

Criar uma nova área do frontend dedicada à gestão de agentes.

Nome sugerido da nova aba principal:

## **Agents**

Essa aba será responsável por visualizar, editar, configurar e testar agentes.

---

## 4.2 Estrutura sugerida da aba “Agents”

### 4.2.1 Lista de agentes

Exibição em cards ou tabela com:

- nome
- papel
- categoria
- equipe
- status
- modelo padrão
- identidade ativa
- score de aderência recente
- última execução

Filtros sugeridos:

- por categoria
- por equipe
- por status
- por modelo
- por tipo de agente

### 4.2.2 Editor de identidade

Subabas sugeridas:

- Identidade
- Alma
- Regras
- Playbook
- Contexto

Recursos desejados:

- editor markdown
- preview
- histórico de versão
- diff entre versões
- restaurar versão anterior

### 4.2.3 Ajustes comportamentais

Painel com sliders e toggles.

#### Sliders

- formalidade
- calor humano
- objetividade
- detalhamento
- cautela
- autonomia
- criatividade
- tolerância à ambiguidade
- proatividade
- delegação
- feedback
- rigidez do playbook

#### Toggles

- exigir auditoria em tarefas críticas
- sempre fornecer feedback intermediário
- preferir delegação a especialistas
- bloquear respostas fora do papel
- executar self-review automático
- priorizar skill-first
- sugerir próximos passos sempre

### 4.2.4 Salvaguardas

Painel específico para governança:

- políticas ativas
- limiar mínimo de conformidade
- modo estrito / equilibrado / flexível
- ação corretiva padrão
- obrigatoriedade de revisão
- fallback do agente

### 4.2.5 Chat com o agente

Cada agente deverá poder ser testado diretamente pela interface.

---

# 5. Conversa com Agentes no Console

## 5.1 Recomendação principal

No MVP06, a forma mais eficiente de adicionar conversa com agentes é **reaproveitar o Console Web já existente**.

Adicionar no Console:

- seletor de agente
- seletor de equipe (opcional)
- exibição do agente ativo
- metadados da identidade usada

## 5.2 Fluxo esperado

1. usuário abre Console
2. escolhe um agente no seletor
3. envia mensagem
4. frontend envia `targetAgentId` no metadata
5. gateway cria task associada ao agente
6. runtime carrega a identidade correspondente
7. timeline mostra claramente qual agente respondeu

## 5.3 Evolução posterior

Na aba **Agents**, cada card do agente poderá ter a ação:

- **Conversar com este agente**

Essa ação pode abrir:

- um chat lateral
- ou redirecionar para o Console já com o agente pré-selecionado

---

# 6. Contratos e Payloads

## 6.1 Extensão sugerida no UnifiedMessage

Adicionar ao metadata/context:

```json
{
  "context": {
    "targetAgentId": "agent-orchestrator-01",
    "targetAgentVersion": "v1.2.0",
    "targetTeamId": "team-core",
    "personaProfileId": "persona-balanced",
    "interactionMode": "chat"
  }
}
```

## 6.2 Modos de interação sugeridos

- `chat`
- `task`
- `brainstorm`
- `audit`
- `review`
- `orchestration`

---

# 7. Backend - Estrutura Técnica Proposta

## 7.1 Novo módulo

Sugestão de módulo:

- `agent-management`

## 7.2 Serviços principais

- `AgentIdentityLoader`
- `AgentProfileRepository`
- `AgentPromptAssembler`
- `BehaviorEvaluationService`
- `AgentConformanceScorer`
- `AgentSafeguardService`
- `PersonaConfigTranslator`
- `AgentVersioningService`

## 7.3 Responsabilidades

### `AgentIdentityLoader`

Carrega arquivos Markdown e monta a estrutura tipada.

### `AgentPromptAssembler`

Monta o contexto final do agente para execução.

### `BehaviorEvaluationService`

Analisa aderência comportamental da resposta gerada.

### `AgentConformanceScorer`

Calcula score consolidado de conformidade.

### `AgentSafeguardService`

Decide ações corretivas quando a aderência fica abaixo do limiar.

### `PersonaConfigTranslator`

Transforma sliders em instruções comportamentais úteis ao runtime.

### `AgentVersioningService`

Controla histórico e rollback dos perfis de agente.

---

# 8. Endpoints Sugeridos

## 8.1 Gestão de agentes

- `GET /agents`
- `GET /agents/:id`
- `POST /agents`
- `PUT /agents/:id`
- `DELETE /agents/:id`

## 8.2 Perfil e identidade

- `GET /agents/:id/profile`
- `PUT /agents/:id/profile`
- `GET /agents/:id/profile/history`
- `POST /agents/:id/profile/restore/:version`

## 8.3 Comportamento e salvaguardas

- `GET /agents/:id/behavior`
- `PUT /agents/:id/behavior`
- `GET /agents/:id/safeguards`
- `PUT /agents/:id/safeguards`
- `GET /agents/:id/conformance`

## 8.4 Chat e teste

- `POST /agents/:id/chat`
- `GET /agents/:id/history`
- `GET /agents/:id/test-sessions`

---

# 9. Presets Iniciais Recomendados

Para facilitar a adoção, o sistema poderá oferecer presets de perfil.

## 9.1 Orquestrador

- alta delegação
- alto feedback
- alta cautela
- alta proatividade
- alta visão sistêmica

## 9.2 Executor Técnico

- alta objetividade
- média autonomia
- baixa verbosidade
- baixa criatividade
- alta aderência a playbook

## 9.3 Auditor

- alta rigidez
- alta cautela
- alta exigência de evidências
- baixa improvisação
- alto self-review

## 9.4 Brainstormer

- alta criatividade
- alta proatividade
- alta tolerância à ambiguidade
- média formalidade
- média cautela

## 9.5 Companheiro Operacional

- alto calor humano
- alto feedback
- boa objetividade
- boa proatividade
- tom colaborativo

---

# 10. Estratégia de UX

## 10.1 Três modos de edição

### Modo simples

- presets prontos
- sliders principais
- toggles essenciais

### Modo avançado

- sliders completos
- markdown editável
- regras e salvaguardas

### Modo especialista

- políticas detalhadas
- limiares de conformidade
- versionamento
- overrides por ambiente/projeto

## 10.2 Organização visual recomendada

Agrupar sliders por tema:

### Comunicação

- formalidade
- calor humano
- objetividade
- detalhamento

### Decisão

- cautela
- autonomia
- criatividade
- tolerância à ambiguidade

### Operação

- proatividade
- delegação
- feedback
- rigidez do playbook

### Governança

- aderência obrigatória
- intensidade de revisão
- exigência de evidência

---

# 11. Fases de Implementação

## MVP06-A — Backend Core

- entidades de perfil
- loader markdown
- montagem de contexto
- integração com runtime
- suporte a `targetAgentId`

## MVP06-B — Safeguards Engine

- policies de comportamento
- score de conformidade
- ações corretivas
- auditoria comportamental

## MVP06-C — Console Integration

- seletor de agente no console
- metadata de agente
- timeline por agente
- histórico de conversa por agente

## MVP06-D — Agents UI

- nova aba Agents
- lista de agentes
- editor de perfil
- sliders e toggles
- painel de safeguards

## MVP06-E — Teste e Versionamento

- histórico de versões
- comparação entre perfis
- rollback
- sessões de teste por agente

---

# 12. Critérios de Pronto

O MVP06 será considerado bem-sucedido quando:

- o sistema conseguir carregar uma identidade formal por agente
- a execução respeitar regras e personalidade configuradas
- houver avaliação de aderência comportamental
- a UI permitir editar o perfil do agente sem alterar código-fonte
- o Console permitir escolher com qual agente conversar
- a timeline e a auditoria mostrarem qual perfil e quais políticas estavam ativas

---

# 13. Riscos e Cuidados

## 13.1 Risco de configuração cosmética

Os sliders não podem ser apenas decorativos; precisam alterar o comportamento real.

## 13.2 Risco de conflito entre texto e parâmetros

Se `soul.md` disser uma coisa e os sliders indicarem outra, deve existir uma política clara de precedência.

### Sugestão

- regras duras vencem tudo
- playbook operacional vence sliders em situações críticas
- sliders modulam o estilo, não quebram regras

## 13.3 Risco de excesso de rigidez

Salvaguardas excessivas podem deixar o agente artificial ou burocrático demais.

### Sugestão

Oferecer modos:

- estrito
- equilibrado
- flexível

---

# 14. Próximo Passo Recomendado após o MVP06

Depois de estabilizar identidade e governança, o próximo MVP mais natural é:

## **MVP07 — Memory Layer v1**

Com isso, o sistema terá:

- agentes com identidade própria
- comportamento governável
- base pronta para memória por agente e por sessão
- preparação ideal para RAG por agente em etapa posterior

---

# 15. Conclusão

O MVP06 não é apenas uma melhoria cosmética de interface.

Ele adiciona ao Andromeda uma camada central de maturidade arquitetural:

- **agentes com alma operacional definida**
- **governança de comportamento**
- **observabilidade de aderência**
- **configuração via UI**
- **chat direcionado por agente**

Com isso, o Andromeda deixa de ser apenas um sistema que executa tasks com modelos e passa a operar com agentes verdadeiramente configuráveis, consistentes e auditáveis.

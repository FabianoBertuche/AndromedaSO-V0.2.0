# Documento de Requisitos — 007-llm-connection-console

## Introdução

Este spec define a substituição do fluxo legado de gerenciamento de providers por um **console de conexão LLM orientado por variantes**. O objetivo é alinhar a UI e o backend de providers com os manifests já existentes em `modules/providers/variants/`, removendo a dependência de listas hardcoded e do modelo plano de tipos como `openai` e `openai-codex` como fonte principal de verdade.

Na v1, o console suportará apenas as variantes `ollama`, `openai-api` e `openai-oauth`, mantendo compatibilidade temporária no runtime backend quando necessário. O escopo é restrito a configuração de conexão, teste, sincronização de catálogo, health e seleção de modelo. Não inclui integração nova com router, agents ou channels.

---

## Glossário

- **Módulo**: unidade registrada no sistema com manifesto próprio.
- **Grupo**: agrupamento lógico do módulo; neste contexto, `providers`.
- **Variante**: implementação específica dentro do grupo, como `openai-api`, `openai-oauth` ou `ollama`.
- **Auth mode**: modo de autenticação exposto pela variante na UI e no contrato.
- **Catalog snapshot**: catálogo sincronizado e persistido dos modelos disponíveis para um provider.
- **Health**: estado operacional estruturado da conexão (`ok`, `degraded`, `error` ou equivalente definido em contrato).
- **Teste de conexão**: validação explícita executada antes do salvamento, sem persistência implícita.
- **Compatibility mapping**: adaptação temporária interna no backend entre variante nova e runtime legado plano.

---

## Requisitos

### Requisito 1: Catálogo de variantes orientado por manifest/registry

**User Story:** Como operador do console, quero que a lista de variantes suportadas venha do backend a partir do registry/manifests, para que a UI não dependa de arrays hardcoded e reflita a arquitetura modular real.

#### Critérios de Aceitação

1. THE backend SHALL expor um endpoint dedicado para listar variantes registradas do grupo `providers` suportadas pela console.
2. THE endpoint de catálogo de variantes SHALL usar como origem de verdade os manifests/registry e não uma lista estática no frontend.
3. THE console SHALL consumir o catálogo retornado pelo backend para montar a navegação, cards, labels, capacidades, requisitos e affordances de formulário.
4. THE catálogo retornado para v1 SHALL incluir apenas `ollama`, `openai-api` e `openai-oauth`.
5. THE console SHALL exibir os nomes de variantes exatamente como definidos em manifesto: `ollama`, `openai-api`, `openai-oauth`.
6. IF o runtime backend ainda exigir tipos legados planos, THEN qualquer mapeamento de compatibilidade SHALL permanecer interno ao backend e não SHALL vazar para a UI pública.

---

### Requisito 2: Tela dedicada de console de conexão LLM

**User Story:** Como usuário administrativo, quero uma página dedicada de console de conexão LLM, para configurar variantes, testar conexão, sincronizar catálogo, acompanhar health e selecionar modelo ativo em uma UX coerente.

#### Critérios de Aceitação

1. THE frontend SHALL preparar uma página dedicada `frontend/src/pages/LlmConnectionConsole.tsx` como alvo da nova arquitetura.
2. THE nova tela SHALL organizar a experiência em termos de módulo, grupo, variante, auth mode, health, capabilities e models synced.
3. THE implementação SHALL tratar `frontend/src/pages/ModelProviders.tsx` como referência legada a ser gradualmente substituída, e não como arquitetura alvo.
4. THE console SHALL suportar estados de carregamento, vazio, erro e sucesso para catálogo de variantes, provider salvo, teste de conexão, sync e seleção de modelos.
5. THE console SHALL reutilizar, quando compatível, hooks/API/componentes já existentes como `useProviders.ts`, `frontend/src/api/kernel.ts`, `HealthBadge` e `ToastNotification`.

---

### Requisito 3: Variantes suportadas e campos mínimos da v1

**User Story:** Como usuário, quero ver somente as variantes suportadas na v1 com campos corretos por variante, para não preencher dados incompatíveis.

#### Critérios de Aceitação

1. THE v1 SHALL suportar somente `ollama`, `openai-api` e `openai-oauth`.
2. WHEN a variante selecionada for `openai-api`, THEN o formulário SHALL exigir `apiKey`, SHALL aceitar `baseUrl` opcional e SHALL aceitar `organization` opcional em contrato, mesmo se o adapter ainda ignorar esse campo.
3. WHEN a variante selecionada for `openai-oauth`, THEN o formulário SHALL exibir um auth mode distinto de API key e SHALL NOT solicitar campo de segredo bruto.
4. WHEN a variante selecionada for `openai-oauth`, THEN a UI SHALL exibir metadados de início do fluxo manual e entradas de conclusão compatíveis com o fluxo manual atual.
5. WHEN a variante selecionada for `ollama`, THEN o formulário SHALL exigir `baseUrl`.
6. THE console SHALL preservar a distinção conceitual e contratual entre `openai-api` e `openai-oauth` em toda a UX, contratos e payloads.

---

### Requisito 4: Teste de conexão explícito antes de salvar

**User Story:** Como usuário, quero testar a conexão antes de salvar, para validar a configuração sem persistir dados inválidos.

#### Critérios de Aceitação

1. THE backend SHALL expor um endpoint dedicado de teste de conexão por variante/configuração.
2. THE teste de conexão SHALL aceitar payload temporário ainda não persistido.
3. THE teste de conexão SHALL NOT persistir provider, catálogo, health histórico ou seleção de modelos automaticamente.
4. THE console SHALL exigir um fluxo explícito de teste antes do salvamento para variantes que dependem de conectividade validável na v1.
5. IF o teste falhar, THEN o sistema SHALL retornar erro estruturado por contrato e SHALL NOT salvar automaticamente a configuração enviada.

---

### Requisito 5: Salvamento e compatibilidade de persistência da v1

**User Story:** Como sistema, preciso persistir somente os dados já suportados pelo repositório atual, para entregar o console sem expandir escopo para integração com router/channels.

#### Critérios de Aceitação

1. THE v1 SHALL persistir configuração de conexão, `selectedModelIds` e catalog snapshot já suportados pelo repositório.
2. THE v1 SHALL NOT exigir nova integração com router, channels ou agents.
3. THE seleção de modelo na UI SHALL oferecer uma affordance principal de modelo preferido/ativo, mas o payload persistido SHALL continuar compatível com `selectedModelIds`.
4. THE console SHALL permitir salvar de acordo com as regras de validação por variante declaradas neste spec, independentemente de health momentaneamente degradado ou erro quando aplicável.
5. THE contratos e tipos novos SHALL manter compatibilidade com os endpoints existentes de create/list/delete, sync, catalog, select models, health, health stream e rotas manuais de Codex/OAuth enquanto durar a transição.

---

### Requisito 6: Sincronização de catálogo segura

**User Story:** Como usuário, quero sincronizar modelos sem perder minha configuração válida e minha seleção atual quando ocorrer falha, para evitar regressões operacionais.

#### Critérios de Aceitação

1. WHEN a sincronização de modelos falhar, THEN o sistema SHALL manter a configuração salva existente.
2. WHEN a sincronização de modelos falhar, THEN o sistema SHALL retornar erro estruturado com mensagem exibível na UI.
3. WHEN a sincronização de modelos falhar, THEN o sistema SHALL NOT limpar automaticamente o `selectedModelIds` persistido anteriormente.
4. THE console SHALL apresentar o estado de sync com feedback claro de carregamento, sucesso ou erro.

---

### Requisito 7: Health estruturado e política de salvamento por variante

**User Story:** Como usuário, quero ver health estruturado da conexão e entender se ainda posso salvar, para decidir conscientemente como operar cada variante.

#### Critérios de Aceitação

1. THE health retornado/consumido pela console SHALL usar contrato estruturado, incluindo pelo menos status, mensagem e metadados relevantes disponíveis.
2. WHEN o health indicar falha, THEN a UI SHALL exibir estado degradado/erro sem mascarar o motivo.
3. THE permissão de salvamento SHALL seguir regras declaradas por variante neste spec e não uma regra global implícita.
4. THE console SHALL diferenciar claramente falha de validação local, falha de teste de conexão, falha de sync e falha de health.

---

### Requisito 8: Contratos explícitos para variants catalog e connection test

**User Story:** Como desenvolvedor, quero contratos dedicados para variantes, teste de conexão e payloads da console, para desacoplar o novo console do contrato mínimo atual de provider.

#### Critérios de Aceitação

1. THE implementação SHALL introduzir contratos explícitos para catálogo de variantes, formulário de conexão e teste de conexão.
2. THE contrato mínimo atual `provider.contract.json` SHALL ser tratado como insuficiente para a console v1.
3. THE novos contratos SHALL representar grupo, variante, auth mode, required fields, capabilities, health e payloads de teste/salvamento.
4. THE contratos SHALL distinguir `openai-api` de `openai-oauth`.

---

### Requisito 9: Estratégia arquitetural modular e anti-patterns proibidos

**User Story:** Como time técnico, queremos evoluir o domínio de providers sem reforçar centralizações legadas, para que a feature permaneça extensível por variante.

#### Critérios de Aceitação

1. THE design SHALL tratar `ProviderOrchestratorService` e sua nomenclatura `IModelCenterService` como infraestrutura reutilizável porém arriscada, evitando expandi-los como centro único de regras da console.
2. THE design SHALL favorecer serviços, contratos e parsing orientados por variante, com responsabilidades menores dentro do domínio `providers`.
3. THE design SHALL NOT introduzir nova lista hardcoded de variantes no frontend.
4. THE design SHALL NOT colapsar `openai-api` e `openai-oauth` em um único tipo público na console.

---

## Restrições de Escopo

### Dentro do escopo

- Página dedicada de console LLM
- Endpoint backend para catálogo de variantes
- Endpoint backend para teste de conexão
- Contratos de request/response para a console
- Integração com create/list/delete/sync/catalog/select/health existentes
- Estados de UI para loading/empty/error/success
- Testes backend e frontend necessários para a feature

### Fora do escopo

- Novo acoplamento com router LLM
- Mudanças em channels
- Mudanças em agents
- Nova persistência além do que o repositório atual já suporta
- Suporte v1 para variantes fora de `ollama`, `openai-api`, `openai-oauth`
- Reescrita completa do domínio legado de providers

---

## Rastreabilidade obrigatória de edge cases

Os edge cases detalhados em `spec.md` SHALL aparecer em `tasks.md` com referência explícita e cobertura por teste ou handling de UI/backend.

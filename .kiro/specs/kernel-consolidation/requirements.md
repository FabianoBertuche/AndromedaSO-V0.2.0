# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para a consolidação e correção de inconsistências no projeto `andromeda-core-kernel`. O escopo abrange a remoção do Prisma em favor do Drizzle como ORM único, alinhamento do schema de banco de dados, unificação do módulo `modelCenter` com o módulo `providers`, documentação explícita de mocks, configuração dinâmica do `AgentPool`, validação de ambiente no startup, integração do `dependencyValidator` no fluxo de carregamento de módulos, documentação do Redis como recurso reservado, adição de testes para fluxos críticos e introdução de correlation IDs nas requisições HTTP.

## Glossário

- **Kernel**: O serviço `andromeda-core-kernel`, responsável por orquestração de módulos, providers LLM e lifecycle management.
- **Drizzle**: ORM escolhido como padrão único para acesso ao banco de dados PostgreSQL.
- **Prisma**: ORM legado a ser removido completamente do projeto.
- **Provider**: Integração com um serviço LLM externo (OpenAI, Anthropic, Groq, Ollama).
- **Adapter**: Implementação que conecta um Provider a uma interface comum de listagem de modelos e health check.
- **Mock_Adapter**: Adapter que retorna dados simulados sem realizar chamadas reais a APIs externas.
- **ModelCenter**: Módulo responsável por agregar catálogo de modelos, benchmarks e roteamento LLM, unificado com o módulo providers.
- **AgentPool**: Componente que atribui agentes a subtarefas com base em capacidades e reputação.
- **AgentProfile**: Configuração de um agente contendo identificador, papel e capacidades.
- **DependencyValidator**: Componente que detecta dependências circulares entre módulos registrados.
- **LifecycleOrchestrator**: Componente que gerencia as transições de estado do ciclo de vida de um módulo.
- **CorrelationId**: Identificador único gerado por requisição HTTP para rastreabilidade em logs e respostas.
- **PG_REQUIRED**: Variável de ambiente que determina se a conexão com PostgreSQL é obrigatória para o startup.
- **Schema_Drizzle**: Definição das tabelas do banco de dados usando a API do Drizzle ORM.
- **Benchmark_Simulado**: Resultado de benchmark calculado internamente sem execução real de inferência LLM.

---

## Requisitos

### Requisito 1: Remoção do Prisma e consolidação no Drizzle

**User Story:** Como desenvolvedor do Kernel, quero que o projeto use apenas o Drizzle como ORM, para que não haja conflito de dependências, schemas duplicados ou ambiguidade sobre qual ORM está ativo.

#### Critérios de Aceitação

1. THE Kernel SHALL ter o pacote `@prisma/client` removido das dependências de produção do `package.json`.
2. THE Kernel SHALL ter o pacote `prisma` removido das dependências de desenvolvimento do `package.json`.
3. THE Kernel SHALL ter o diretório `prisma/` e todos os seus arquivos removidos do repositório.
4. THE Kernel SHALL ter o arquivo `drizzle.config.ts` como única fonte de configuração de migrations.
5. WHEN o comando `npm install` for executado, THE Kernel SHALL instalar dependências sem nenhum pacote relacionado ao Prisma.

---

### Requisito 2: Alinhamento do Schema Drizzle com entidades de domínio

**User Story:** Como desenvolvedor do Kernel, quero que o schema Drizzle cubra todas as entidades persistidas, para que providers, modelos, benchmarks e decisões de roteamento sejam armazenados de forma consistente no banco de dados.

#### Critérios de Aceitação

1. THE Schema_Drizzle SHALL definir uma tabela `providers` com colunas: `id`, `name`, `type`, `display_name`, `api_base`, `base_url`, `api_key_enc`, `health`, `selected_model_ids`, `created_at`.
2. THE Schema_Drizzle SHALL definir uma tabela `model_catalog_items` com colunas: `id`, `provider_id`, `model_id`, `display_name`, `capabilities`, `score`, `latency_ms`, `cost_usd`, `price_label`, `context_window`, `created_at`.
3. THE Schema_Drizzle SHALL definir uma tabela `model_benchmark_results` com colunas: `id`, `model_id`, `task_type`, `score`, `latency_ms`, `tokens_in`, `tokens_out`, `cost_usd`, `success`, `executed_at`.
4. THE Schema_Drizzle SHALL definir uma tabela `routing_decisions` com colunas: `id`, `task_type`, `selected_model`, `score`, `created_at`.
5. THE Schema_Drizzle SHALL manter as tabelas existentes `modules_registry` e `lifecycle_events` sem alterações de estrutura.
6. WHEN uma migration Drizzle for gerada, THE Schema_Drizzle SHALL produzir SQL válido para criação de todas as tabelas definidas.

---

### Requisito 3: Unificação do ModelCenter com o módulo Providers

**User Story:** Como desenvolvedor do Kernel, quero que o módulo `modelCenter` seja unificado com o módulo `providers`, para que não haja estrutura de pastas vazia e a extensibilidade modular seja preservada por meio de interfaces bem definidas.

#### Critérios de Aceitação

1. THE Kernel SHALL remover os diretórios vazios de `src/modules/modelCenter/` após a unificação.
2. THE Kernel SHALL expor as funcionalidades de catálogo de modelos, benchmark e roteamento LLM exclusivamente através do módulo `src/modules/providers/`.
3. WHEN uma rota de catálogo de modelos for acessada, THE Kernel SHALL retornar os dados servidos pelo `ProviderOrchestratorService`.
4. THE Kernel SHALL definir uma interface TypeScript `IModelCenterService` no módulo providers que declare os contratos de catálogo, benchmark e roteamento, permitindo substituição futura da implementação.
5. WHERE o módulo `modelCenter` for referenciado em imports existentes, THE Kernel SHALL redirecionar esses imports para o módulo `providers` sem quebrar a compilação TypeScript.

---

### Requisito 4: Documentação explícita dos Mock Adapters

**User Story:** Como desenvolvedor do Kernel, quero que os adapters de providers que retornam dados simulados sejam documentados explicitamente como mocks, para que nenhum desenvolvedor assuma que há integração real com APIs externas.

#### Critérios de Aceitação

1. THE Mock_Adapter de cada provider (openai, anthropic, groq, ollama) SHALL conter um comentário JSDoc no topo do arquivo declarando explicitamente que a implementação é simulada e não realiza chamadas HTTP reais.
2. THE Mock_Adapter SHALL conter um comentário inline no método `ping()` indicando que a latência retornada é um valor fixo simulado.
3. THE Mock_Adapter SHALL conter um comentário inline no método `listModels()` indicando que os modelos retornados são dados de seed estáticos.
4. WHEN um desenvolvedor inspecionar qualquer arquivo de adapter, THE Mock_Adapter SHALL deixar claro o caminho para substituição por uma implementação real através de comentário `TODO` padronizado.

---

### Requisito 5: AgentPool configurável via arquivo externo

**User Story:** Como operador do Kernel, quero que os perfis de agentes do AgentPool sejam carregados de uma fonte de configuração externa, para que novos agentes possam ser adicionados sem modificar o código-fonte.

#### Critérios de Aceitação

1. THE AgentPool SHALL carregar os `AgentProfile`s a partir de um arquivo de configuração JSON localizado em `src/config/agentProfiles.json`.
2. WHEN o arquivo `agentProfiles.json` não for encontrado no startup, THE AgentPool SHALL utilizar os perfis padrão hardcoded como fallback e registrar um aviso no log.
3. THE AgentPool SHALL validar que cada `AgentProfile` carregado contém os campos `agentId`, `role` e `capabilities` antes de utilizá-lo.
4. IF um `AgentProfile` carregado estiver inválido, THEN THE AgentPool SHALL ignorar o perfil inválido, registrar um erro no log com o índice do perfil e continuar com os perfis válidos restantes.
5. THE Kernel SHALL incluir o arquivo `src/config/agentProfiles.json` com os cinco perfis padrão atuais como configuração inicial.

---

### Requisito 6: Documentação explícita do Benchmark Simulado

**User Story:** Como desenvolvedor do Kernel, quero que o benchmark de modelos seja documentado como simulado, para que os resultados não sejam interpretados como métricas reais de desempenho de inferência LLM.

#### Critérios de Aceitação

1. THE `ProviderOrchestratorService` SHALL conter um comentário JSDoc no método `benchmarkModel()` declarando explicitamente que o cálculo de score é simulado e não executa inferência real.
2. THE `ProviderOrchestratorService` SHALL conter um comentário JSDoc no método `runGoldenEval()` do `AgentEvolutionService` declarando que os resultados são gerados sinteticamente.
3. WHEN a rota de benchmark retornar um resultado, THE Kernel SHALL incluir o campo `simulated: true` no payload de resposta JSON.

---

### Requisito 7: Validação de ambiente no startup

**User Story:** Como operador do Kernel, quero que o serviço valide as variáveis de ambiente críticas durante o startup, para que falhas de configuração sejam detectadas imediatamente e não silenciosamente em runtime.

#### Critérios de Aceitação

1. WHEN o Kernel iniciar com `PG_REQUIRED=true` e a variável `DATABASE_URL` não estiver definida, THE Kernel SHALL encerrar o processo com código de saída 1 e registrar uma mensagem de erro descritiva antes de aceitar qualquer requisição.
2. WHEN o Kernel iniciar com `PG_REQUIRED=true` e não conseguir estabelecer conexão com o banco de dados em até 5000ms, THE Kernel SHALL encerrar o processo com código de saída 1 e registrar o erro de conexão.
3. THE Kernel SHALL executar a validação de ambiente antes de registrar qualquer rota HTTP no servidor Fastify.
4. WHEN o Kernel iniciar com `PG_REQUIRED=false` e `DATABASE_URL` não estiver definida, THE Kernel SHALL registrar um aviso no log indicando que o banco de dados está desabilitado e continuar o startup normalmente.

---

### Requisito 8: Integração do DependencyValidator no fluxo de loadModule

**User Story:** Como desenvolvedor do Kernel, quero que o `dependencyValidator` seja chamado automaticamente durante o carregamento de módulos, para que dependências circulares sejam detectadas antes que um módulo entre em estado `running`.

#### Critérios de Aceitação

1. WHEN `loadModule()` for invocado, THE LifecycleOrchestrator SHALL chamar `validateAndLoadModule()` antes de executar qualquer transição de estado.
2. IF `validateAndLoadModule()` retornar `valid: false`, THEN THE LifecycleOrchestrator SHALL rejeitar o carregamento do módulo, registrar o erro com o `moduleId` e o motivo, e não executar a transição de estado.
3. WHEN dependências circulares forem detectadas pelo `DependencyValidator`, THE LifecycleOrchestrator SHALL registrar no log os módulos envolvidos no ciclo.
4. THE `loadModule()` SHALL ser chamado pelo `LifecycleOrchestrator.start()` como etapa anterior à transição para o estado `initialized`.

---

### Requisito 9: Documentação do Redis como recurso reservado

**User Story:** Como desenvolvedor do Kernel, quero que o pacote `ioredis` instalado seja documentado como reservado para uso futuro, para que nenhum desenvolvedor o remova inadvertidamente nem assuma que está em uso ativo.

#### Critérios de Aceitação

1. THE Kernel SHALL conter um arquivo `src/store/redisClient.ts` com a configuração básica do cliente `ioredis` comentada e um JSDoc explicando que o Redis está reservado para cache de roteamento e pub/sub de eventos de lifecycle em versões futuras.
2. THE `redisClient.ts` SHALL exportar uma função `getRedisClient()` marcada com `@deprecated` e comentário indicando que não deve ser chamada até que o Redis seja ativado oficialmente.
3. THE Kernel SHALL manter o pacote `ioredis` nas dependências do `package.json` com um comentário no `package.json` (via campo `_comment` ou documentação adjacente) explicando o motivo da presença do pacote.

---

### Requisito 10: Testes para fluxos críticos

**User Story:** Como desenvolvedor do Kernel, quero que os fluxos críticos do sistema possuam cobertura de testes automatizados, para que regressões sejam detectadas antes de chegarem à produção.

#### Critérios de Aceitação

1. THE Kernel SHALL conter testes unitários para `LifecycleOrchestrator` cobrindo as transições de estado `registered → initialized → running` e `running → stopped`.
2. THE Kernel SHALL conter testes unitários para `ProviderOrchestratorService` cobrindo criação de provider, sincronização de modelos, health check e roteamento LLM.
3. THE Kernel SHALL conter testes unitários para `AgentPool` cobrindo atribuição de agentes por capacidade e fallback quando nenhum agente compatível for encontrado.
4. THE Kernel SHALL conter testes de integração para as rotas HTTP `/api/providers`, `/api/llm-router` e `/tasks/multi` usando `supertest`.
5. WHEN os testes forem executados com `vitest run`, THE Kernel SHALL completar a suíte sem falhas.
6. THE Kernel SHALL conter um teste de propriedade para o `ProviderOrchestratorService` verificando que para qualquer lista não-vazia de modelos sincronizados, `inferRoute()` sempre retorna um modelo com `score >= 0`.

---

### Requisito 11: Correlation IDs nas requisições HTTP

**User Story:** Como operador do Kernel, quero que cada requisição HTTP receba um correlation ID único, para que seja possível rastrear o fluxo completo de uma requisição nos logs do sistema.

#### Critérios de Aceitação

1. WHEN uma requisição HTTP for recebida sem o header `x-correlation-id`, THE Kernel SHALL gerar um UUID v4 como correlation ID para aquela requisição.
2. WHEN uma requisição HTTP for recebida com o header `x-correlation-id`, THE Kernel SHALL utilizar o valor fornecido como correlation ID, desde que seja uma string não-vazia com no máximo 128 caracteres.
3. THE Kernel SHALL incluir o correlation ID em todas as entradas de log geradas durante o processamento da requisição.
4. THE Kernel SHALL retornar o correlation ID no header `x-correlation-id` de todas as respostas HTTP.
5. IF o valor do header `x-correlation-id` recebido exceder 128 caracteres, THEN THE Kernel SHALL gerar um novo UUID v4 e registrar um aviso no log indicando que o valor original foi descartado.

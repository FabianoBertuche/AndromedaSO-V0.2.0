# Plano de Implementação: kernel-consolidation

## Visão Geral

Consolidação do `andromeda-core-kernel`: remoção do Prisma, expansão do schema Drizzle, unificação do modelCenter com providers, documentação de mocks e benchmarks simulados, AgentPool configurável, validação de ambiente no startup, integração do DependencyValidator no lifecycle, documentação do Redis como recurso reservado, testes para fluxos críticos e correlation IDs nas requisições HTTP.

## Tarefas

- [x] 1. Remover Prisma do projeto
  - Remover `@prisma/client` das dependências de produção em `core/kernel/package.json`
  - Remover `prisma` das dependências de desenvolvimento em `core/kernel/package.json`
  - Excluir o diretório `core/kernel/prisma/` e todos os seus arquivos (schema.prisma + migrations)
  - Verificar que nenhum arquivo em `src/` importa de `@prisma/client` e corrigir se houver
  - _Requisitos: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Expandir schema Drizzle com as novas tabelas
  - [x] 2.1 Adicionar tabelas `providers`, `model_catalog_items`, `model_benchmark_results` e `routing_decisions` em `src/store/schema.ts`
    - Usar os tipos `uuid`, `varchar`, `text`, `jsonb`, `timestamp`, `real`, `integer`, `boolean` do `drizzle-orm-pg`
    - Manter as tabelas `modules_registry` e `lifecycle_events` sem alteração
    - Adicionar `foreign key` de `model_catalog_items.provider_id` → `providers.id` com `onDelete: 'cascade'`
    - Adicionar campo `simulated boolean NOT NULL DEFAULT true` em `model_benchmark_results`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [-] 2.2 Escrever teste unitário para validar que o schema exporta todas as tabelas esperadas
    - Verificar que `providers`, `model_catalog_items`, `model_benchmark_results`, `routing_decisions`, `modules_registry` e `lifecycle_events` são exportados
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Definir interface `IModelCenterService` e unificar modelCenter com providers
  - [x] 3.1 Criar arquivo `src/modules/providers/domain/interfaces/modelCenter.interface.ts` com a interface `IModelCenterService`
    - Declarar métodos `getCatalog()`, `benchmarkModel()` e `inferRoute()` conforme design
    - O retorno de `benchmarkModel()` deve incluir `simulated: true` no tipo
    - _Requisitos: 3.4_

  - [x] 3.2 Fazer `ProviderOrchestratorService` implementar `IModelCenterService`
    - Adicionar `implements IModelCenterService` na declaração da classe em `src/modules/providers/services/providerOrchestratorService.ts`
    - Garantir que a compilação TypeScript passa sem erros
    - _Requisitos: 3.2, 3.3_

  - [x] 3.3 Remover os diretórios vazios de `src/modules/modelCenter/`
    - Excluir `src/modules/modelCenter/domain/`, `infrastructure/`, `routes/` e `services/`
    - Verificar que não há imports apontando para `src/modules/modelCenter/` em nenhum arquivo
    - _Requisitos: 3.1, 3.5_

- [x] 4. Documentar Mock Adapters com JSDoc e TODOs padronizados
  - Adicionar JSDoc no topo de cada adapter (`openai.adapter.ts`, `anthropic.adapter.ts`, `groq.adapter.ts`, `ollama.adapter.ts`) declarando que a implementação é simulada e não realiza chamadas HTTP reais
  - Adicionar comentário inline no método `ping()` de cada adapter indicando que a latência é um valor fixo simulado
  - Adicionar comentário inline no método `listModels()` de cada adapter indicando que os modelos são dados de seed estáticos
  - Adicionar comentário `TODO(real-integration)` padronizado em cada adapter indicando o caminho para implementação real com link para a documentação da API do provider
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Tornar AgentPool configurável via `agentProfiles.json`
  - [x] 5.1 Criar arquivo `src/config/agentProfiles.json` com os cinco perfis padrão atuais
    - Incluir `agent-planner`, `agent-design`, `agent-copy`, `agent-code`, `agent-review` com seus `role` e `capabilities`
    - _Requisitos: 5.5_

  - [x] 5.2 Refatorar `AgentPool` em `src/services/orchestrator/AgentPool.ts` para carregar perfis do JSON
    - Adicionar schema de validação Zod `AgentProfileSchema` com campos `agentId`, `role` e `capabilities`
    - Implementar lógica de carregamento: tentar ler `src/config/agentProfiles.json`, validar cada perfil, ignorar inválidos com log `error`, usar fallback hardcoded com log `warn` se arquivo ausente
    - Manter `AGENT_PROFILES` hardcoded como constante de fallback
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.3 Escrever teste de propriedade para validação de AgentProfile (Propriedade 1)
    - **Propriedade 1: Validação de AgentProfile rejeita perfis incompletos**
    - Usar `fast-check` para gerar objetos arbitrários com campos faltando ou incorretos
    - Verificar que `AgentProfileSchema.safeParse(x).success === false` para todos os inputs inválidos
    - **Valida: Requisito 5.3**

  - [ ] 5.4 Escrever teste de propriedade para filtragem de perfis inválidos (Propriedade 2)
    - **Propriedade 2: Filtragem de perfis inválidos preserva apenas os válidos**
    - Usar `fast-check` para gerar listas mistas de perfis válidos e inválidos
    - Verificar que o número de perfis carregados no pool é exatamente igual ao número de perfis válidos na lista
    - **Valida: Requisito 5.4**

  - [ ] 5.5 Escrever testes unitários para AgentPool
    - Testar atribuição de agente por capacidade existente
    - Testar fallback para qualquer agente quando capacidade não existe
    - Testar carregamento de perfis de `agentProfiles.json`
    - Testar fallback para perfis hardcoded quando arquivo ausente
    - Testar que perfis inválidos são ignorados e os válidos são mantidos
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Documentar benchmark simulado e adicionar campo `simulated: true` na resposta
  - Adicionar JSDoc no método `benchmarkModel()` de `ProviderOrchestratorService` declarando que o cálculo de score é simulado e não executa inferência real
  - Adicionar JSDoc no método `runGoldenEval()` de `AgentEvolutionService` declarando que os resultados são gerados sinteticamente
  - Modificar o retorno de `benchmarkModel()` para incluir `simulated: true` no objeto `ModelBenchmarkResult`
  - Atualizar o tipo `ModelBenchmarkResult` em `src/modules/providers/domain/entities/provider.entity.ts` para incluir o campo `simulated: boolean`
  - _Requisitos: 6.1, 6.2, 6.3_

  - [ ] 6.1 Escrever teste de propriedade para campo `simulated` (Propriedade 3)
    - **Propriedade 3: Resultado de benchmark sempre contém `simulated: true`**
    - Usar `fast-check` para gerar `modelId` e `taskType` arbitrários válidos
    - Verificar que `result.simulated === true` para todos os inputs
    - **Valida: Requisito 6.3**

- [x] 7. Criar `validateEnvironment.ts` e integrar no startup
  - [x] 7.1 Criar arquivo `src/config/validateEnvironment.ts` com a função `validateEnvironment()`
    - Se `PG_REQUIRED=true` e `DATABASE_URL` não definida: logar erro descritivo e chamar `process.exit(1)`
    - Se `PG_REQUIRED=true` e conexão falhar em 5000ms: logar erro de conexão e chamar `process.exit(1)`
    - Se `PG_REQUIRED=false` e `DATABASE_URL` não definida: logar `warn` e retornar normalmente
    - _Requisitos: 7.1, 7.2, 7.4_

  - [x] 7.2 Integrar `validateEnvironment()` em `src/server.ts` antes de qualquer `server.register()`
    - Chamar `await validateEnvironment()` como primeira instrução dentro de `buildServer()` antes de registrar rotas
    - _Requisitos: 7.3_

  - [ ] 7.3 Escrever testes unitários para `validateEnvironment`
    - Testar `PG_REQUIRED=true` + `DATABASE_URL` ausente → `process.exit(1)` chamado
    - Testar `PG_REQUIRED=true` + timeout de conexão → `process.exit(1)` chamado
    - Testar `PG_REQUIRED=false` + `DATABASE_URL` ausente → log `warn` + retorno normal
    - _Requisitos: 7.1, 7.2, 7.4_

- [x] 8. Integrar DependencyValidator no `LifecycleOrchestrator.start()`
  - Modificar `LifecycleOrchestrator.start()` em `src/lifecycle/lifecycleOrchestrator.ts` para chamar `validateAndLoadModule(module, allModules)` antes de qualquer transição de estado
  - Atualizar a assinatura de `start()` para receber `allModules: ModuleRegistryRecord[]` como segundo parâmetro
  - Se `validateAndLoadModule()` retornar `{ valid: false }`: logar erro com `moduleId` e motivo, lançar `LifecycleOrchestratorError` sem executar nenhuma transição
  - Se dependências circulares forem detectadas: logar os módulos envolvidos no ciclo
  - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [ ] 8.1 Escrever teste de propriedade para módulo inválido (Propriedade 4)
    - **Propriedade 4: Módulo inválido nunca executa transição de estado**
    - Usar `fast-check` para gerar módulos com contratos inválidos
    - Verificar que o estado da máquina de estados permanece inalterado após o erro
    - **Valida: Requisito 8.2**

  - [ ] 8.2 Escrever testes unitários para `LifecycleOrchestrator`
    - Testar transição `registered → initialized → running` com módulo válido
    - Testar transição `running → stopped`
    - Testar rejeição de módulo quando `validateAndLoadModule()` retorna `valid: false`
    - Verificar que `validateAndLoadModule()` é chamado antes de qualquer transição de estado
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 10.1_

- [x] 9. Checkpoint — Garantir que o projeto compila e os testes passam até aqui
  - Executar `tsc --noEmit` para verificar que não há erros de compilação TypeScript
  - Garantir que todos os testes implementados passam, perguntar ao usuário se houver dúvidas.

- [x] 10. Criar `redisClient.ts` documentado como recurso reservado
  - Criar arquivo `src/store/redisClient.ts` com a configuração básica do cliente `ioredis` comentada
  - Adicionar JSDoc explicando que o Redis está reservado para cache de roteamento e pub/sub de eventos de lifecycle em versões futuras
  - Exportar função `getRedisClient()` marcada com `@deprecated` e comentário indicando que não deve ser chamada até ativação oficial
  - Não remover o arquivo `src/store/redis.ts` existente — apenas criar o novo arquivo documentado
  - _Requisitos: 9.1, 9.2, 9.3_

- [x] 11. Criar plugin `correlationId` para Fastify e integrar em `server.ts`
  - [x] 11.1 Criar arquivo `src/plugins/correlationId.plugin.ts` com o plugin Fastify
    - Usar `fastify.decorateRequest('correlationId', '')` para adicionar o campo ao request
    - Se header `x-correlation-id` ausente ou vazio: gerar UUID v4 com `randomUUID()`
    - Se header presente com até 128 caracteres: usar o valor fornecido
    - Se header presente com mais de 128 caracteres: logar `warn` com valor original truncado e gerar novo UUID v4
    - Definir `reply.header('x-correlation-id', correlationId)` em cada requisição
    - Criar child logger pino com `{ correlationId }` e anexar ao request
    - _Requisitos: 11.1, 11.2, 11.4, 11.5_

  - [x] 11.2 Registrar o plugin como primeiro plugin em `src/server.ts`
    - Adicionar `server.register(correlationIdPlugin)` antes de qualquer outra chamada `server.register()`
    - _Requisitos: 11.3_

  - [ ] 11.3 Escrever teste de propriedade para correlation ID preservado (Propriedade 6)
    - **Propriedade 6: Correlation ID válido é preservado na resposta**
    - Usar `fast-check` para gerar strings de 1–128 caracteres
    - Verificar que `response.headers['x-correlation-id'] === sentHeader` para todos os inputs
    - **Valida: Requisitos 11.2, 11.4**

  - [ ] 11.4 Escrever teste de propriedade para UUID gerado (Propriedade 7)
    - **Propriedade 7: Requisição sem correlation ID sempre recebe UUID v4 válido**
    - Usar `fast-check` para gerar requisições sem o header `x-correlation-id`
    - Verificar que o header da resposta corresponde ao regex UUID v4 `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
    - **Valida: Requisitos 11.1, 11.4**

  - [ ] 11.5 Escrever testes unitários para `correlationIdPlugin`
    - Testar requisição sem header → UUID v4 gerado na resposta
    - Testar requisição com header válido (≤128 chars) → mesmo valor na resposta
    - Testar header com 129+ caracteres → novo UUID gerado + log `warn`
    - _Requisitos: 11.1, 11.2, 11.4, 11.5_

- [x] 12. Escrever testes para `ProviderOrchestratorService`
  - [x] 12.1 Escrever testes unitários para `ProviderOrchestratorService`
    - Testar criação de provider com nome normalizado
    - Testar erro ao criar provider duplicado
    - Testar sincronização de modelos via adapter mock
    - Testar health check com latência dentro e fora do threshold
    - Testar roteamento LLM com lista de modelos variada
    - Testar erro quando nenhum modelo está sincronizado
    - _Requisitos: 10.2_

  - [ ] 12.2 Escrever teste de propriedade para `inferRoute()` (Propriedade 5)
    - **Propriedade 5: `inferRoute()` sempre retorna score não-negativo**
    - Usar `fast-check` para gerar listas não-vazias de modelos com scores aleatórios (incluindo zero)
    - Verificar que `decision.score >= 0` para todos os inputs
    - **Valida: Requisito 10.6**

- [x] 13. Escrever testes de integração para rotas HTTP
  - Criar testes de integração usando `supertest` com servidor Fastify em modo de teste
  - Testar `GET /api/providers` → lista providers com status 200
  - Testar `POST /api/providers` → cria provider e retorna 201
  - Testar `POST /api/providers/:id/sync` → sincroniza modelos
  - Testar `GET /api/llm-router/route?taskType=coding` → retorna decisão de roteamento
  - Testar `POST /tasks/multi` → cria tarefa multi-agente
  - Verificar que o header `x-correlation-id` está presente em todas as respostas
  - _Requisitos: 10.4_

- [x] 14. Checkpoint final — Garantir que todos os testes passam
  - Executar `vitest run` e garantir que a suíte completa passa sem falhas
  - Garantir que todos os testes implementados passam, perguntar ao usuário se houver dúvidas.
  - _Requisitos: 10.5_

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental
- Os testes de propriedade usam `fast-check` (instalar com `npm install --save-dev fast-check` em `core/kernel/`)
- Comando de execução dos testes: `vitest run` (sem modo watch)

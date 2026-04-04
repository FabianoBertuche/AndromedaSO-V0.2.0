# Features Implementadas

Registro de todas as features implementadas no projeto, com status e referências aos specs.

---

## kernel-consolidation ✅ Concluído

**Spec:** `.kiro/specs/kernel-consolidation/`
**Objetivo:** Consolidar inconsistências acumuladas no kernel.

### O que foi feito

- **Prisma removido** — projeto usa exclusivamente Drizzle ORM
- **Schema Drizzle expandido** — tabelas `providers`, `model_catalog_items`, `model_benchmark_results`, `routing_decisions` adicionadas
- **ModelCenter unificado** — diretórios vazios removidos, funcionalidades consolidadas em `src/modules/providers/`
- **Interface `IModelCenterService`** — contrato formal para catálogo, benchmark e roteamento
- **Mock adapters documentados** — JSDoc + TODO padronizado em cada adapter
- **AgentPool configurável** — perfis carregados de `src/config/agentProfiles.json` com validação Zod
- **Benchmark documentado como simulado** — campo `simulated: true` sempre presente
- **`validateEnvironment()`** — validação de variáveis de ambiente no startup
- **DependencyValidator integrado** — chamado em `LifecycleOrchestrator.start()` antes de qualquer transição
- **Redis documentado como reservado** — `src/store/redisClient.ts` com `@deprecated`
- **Correlation ID** — plugin Fastify em todas as requisições
- **Testes** — 101 testes passando (2 falham por falta de Docker, pré-existentes)

---

## mvp04-frontend ✅ Concluído

**Spec:** `.kiro/specs/mvp04-frontend/`
**Objetivo:** Completar a UI do MVP04 — benchmark ao vivo, health em tempo real, feedback visual.

### O que foi feito

- **`HealthBadge`** — badge com cores (verde/amarelo/vermelho) e latência real
- **`SimulatedBadge`** — badge âmbar para resultados de benchmark simulados
- **`ToastNotification`** — notificação de erro com auto-dismiss
- **`ModelSelector`** — seletor de modelo agrupado por provider
- **`BenchmarkPanel`** — benchmark ao vivo com seleção de modelo, spinner, resultados em tabela
- **`useProviderHealthStream` refatorado** — usa `setQueryData` em vez de `invalidateQueries` (sem re-fetch)
- **`useProviderLoadingState`** — loading por provider nos botões Sync/Test
- **`useBenchmark`** — hook para execução de benchmarks
- **`ModelProviders` atualizado** — HealthBadge, HealthStreamSubscriber, loading por provider, toast de erro
- **`RouterIntelligence` atualizado** — usa BenchmarkPanel
- **Bug corrigido** — `fetchAgents()` não chama mais `GET /agents` (404), usa `/api/modules`

---

## real-provider-adapters ✅ Concluído

**Spec:** `.kiro/specs/real-provider-adapters/`
**Objetivo:** Substituir adapters mock por implementações reais com chamadas HTTP.

### O que foi feito

- **`adapter.interface.ts`** — interface `ProviderAdapter` e tipo `AdapterFactory`
- **`http.utils.ts`** — `fetchWithTimeout` e `pingWithTimeout` com `AbortController` nativo
- **OpenAI adapter** — factory function, listModels real (filtra por prefixos gpt-/o1/o3/o4), ping com latência real, fallback para seed
- **Anthropic adapter** — factory function, listModels real com `display_name`, ping real, fallback para seed
- **Groq adapter** — factory function, listModels real (API compatível OpenAI), ping real, fallback para seed
- **Ollama adapter** — factory function, listModels de `/api/tags`, ping real, fallback para seed
- **`ProviderOrchestratorService` atualizado** — usa `adapterFactories` com `decodeApiKey()` por chamada
- **Testes de integração de factory** — 3 novos testes cobrindo decodificação de apiKey e uso correto das factories

---

## local-dev-setup ✅ Concluído

**Spec:** `.kiro/specs/local-dev-setup/`
**Objetivo:** Rodar kernel e frontend localmente, apenas PostgreSQL e Redis no Docker.

### O que foi feito

- ✅ `docker-compose.infra.yml` — postgres:16 + redis:7-alpine
- ✅ `core/kernel/.env` — variáveis corretas para desenvolvimento local (PORT=4000, DATABASE_URL, REDIS_URL, PROVIDER_REPOSITORY_MODE=auto, OLLAMA_BASE_URL, NODE_ENV, PG_REQUIRED=false)
- ✅ Ollama adapter lê `OLLAMA_BASE_URL` da env
- ✅ Provider repository factory usa Pino em vez de console.warn
- ✅ Script `dev` no package.json do kernel (`tsx --watch src/index.ts`)
- ✅ Testes de verificação do ambiente local (`local-env.test.ts`, skippados em CI)
- ✅ `docs/local-dev.md` — documentação completa do fluxo de desenvolvimento

---

## provider-persistence-docker ⚠️ Substituído por local-dev-setup

**Spec:** `.kiro/specs/provider-persistence-docker/`
**Status:** Substituído — o spec `local-dev-setup` resolve o mesmo problema de forma mais abrangente.

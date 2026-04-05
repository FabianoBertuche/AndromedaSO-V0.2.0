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

---

## openai-codex-user-docs ✅ Concluído

**Spec:** `.kiro/specs/openai-codex-user-docs/`
**Objetivo:** Documentar o fluxo de login `openai-codex` para iniciantes, sem mudanças de código.

### O que foi feito

- **Feature somente de documentação** — sem alterações em código, configuração ou testes
- **`docs/suporte/openai-codex-setup.md`** — guia principal em português para configurar `OPENAI_CODEX_WEB_CLIENT_ID` em `core/kernel/.env`
- **Redirect URIs documentadas** — destaque para `http://localhost:5173/oauth/callback`, `https://app.example.com/oauth/callback` e aviso de que `/auth/callback` está errado
- **Passo a passo local + checklist manual** — fluxo observável por usuários não técnicos, com checkboxes em Markdown
- **Troubleshooting incluído** — cobertura para env var ausente, redirect URI incorreta e erro `missing_codex_entitlement`
- **Cross-references adicionadas** — `docs/suporte/logincodex.md` e `docs/local-dev.md` agora apontam para o guia principal

---

## openai-codex-manual-flow-docs ✅ Concluído

**Spec:** `.kiro/specs/openai-codex-manual-flow-docs/`
**Objetivo:** Atualizar a camada de documentação para separar com clareza o comportamento atual do login OpenAI Codex, sua limitação atual e a direção de evolução que então estava em análise.

### O que foi feito

- **Feature somente de documentação** — sem alterações em código, testes, configs ou arquivos de ambiente
- **Status canônico adicionado** — `docs/suporte/openai-codex-auth-status.md` passou a centralizar comportamento implementado, limitação atual e a direção então registrada na documentação
- **Comportamento atual explicitado** — a documentação passou a afirmar com clareza que o comportamento implementado hoje é um fluxo **BYO web OAuth client** com `OPENAI_CODEX_WEB_CLIENT_ID`
- **Limitação atual destacada** — os docs agora deixam explícito que esse fluxo não é a UX desejada no longo prazo e não é geralmente equivalente à experiência de openclaw/opencode
- **Direção da época registrada** — a documentação daquele momento passou a registrar o fluxo manual **link/copy-return** como direção em análise, antes dos updates posteriores que o consolidaram como comportamento implementado do repositório
- **Referências históricas contextualizadas** — materiais antigos, incluindo a exploração hardcoded-client, agora são contextualizados como referência histórica, sem reescrever o histórico do repositório

---

## openai-codex-pause-status ✅ Concluído

**Spec:** `.kiro/specs/openai-codex-pause-status/`
**Objetivo:** Registrar, somente na documentação, que o fluxo manual `openai-codex` continua implementado, mas que o trabalho mais amplo foi pausado/deferido.

### O que foi feito

- **Feature somente de documentação** — sem alterações em código, testes, configuração ou ambiente
- **Status canônico atualizado** — `docs/suporte/openai-codex-auth-status.md` agora deixa explícito que o fluxo manual implementado permanece válido, mas a frente mais ampla está pausada/deferida
- **Bloqueador prático documentado** — a documentação passou a registrar que ainda falta um auth/client model viável que não dependa de premissas impraticáveis
- **Guias existentes preservados com novo enquadramento** — `docs/suporte/openai-codex-setup.md`, `docs/suporte/logincodex.md` e `docs/local-dev.md` continuam descrevendo o que funciona hoje, sem sugerir avanço ativo
- **Lembrete de retomada adicionado** — a documentação agora aponta para `.kiro/specs/openai-codex-manual-auth-flow/`, `docs/suporte/openai-codex-setup.md` e `docs/suporte/openai-codex-auth-status.md` antes de reabrir a investigação

---

## chat-console-docs ✅ Concluído

**Spec:** `.kiro/specs/chat-console-docs/`
**Objetivo:** Registrar na documentação o estado entregue do chat separado do console de modelos.

### O que foi feito

- **Feature somente de documentação** — sem alterações em código, testes, configuração ou ambiente
- **Models preservado como console de providers/modelos** — `Models` continua sendo a superfície de gestão
- **Chat separado no frontend** — uso disponível separadamente via `?tab=chat`
- **Pré-requisito backend registrado** — o frontend usa `POST /api/providers/chat` para chat
- **Fluxo local resumido** — `docs/local-dev.md` agora registra uso de `?tab=models`, `?tab=chat` e a observação de restart do frontend após mudanças de backend em desenvolvimento

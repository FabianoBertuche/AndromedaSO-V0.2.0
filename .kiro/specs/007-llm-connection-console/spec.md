# Spec — 007-llm-connection-console

## Contexto

O domínio de providers do Andromeda já possui manifests distintos para `openai-api`, `openai-oauth` e `ollama` em `modules/providers/variants/...`, mas a experiência atual de UI/runtime ainda está presa a tipos planos legados como `openai` e `openai-codex`. Hoje a página `frontend/src/pages/ModelProviders.tsx` mantém uma lista `PROVIDER_OPTIONS` hardcoded e mistura, em um mesmo fluxo, catálogo, criação, OAuth manual, sync, health e seleção de modelos.

No backend, já existem rotas reutilizáveis para criar/listar/deletar provider, sincronizar modelos, obter catálogo, salvar modelos selecionados, consultar health, consumir health stream e operar o fluxo manual atual de OAuth/Codex. Também existe infraestrutura reutilizável em `ProviderOrchestratorService` e nos repositórios, mas ela centraliza demais e ainda carrega a nomenclatura legada `IModelCenterService`, o que representa risco arquitetural se a feature simplesmente expandir o design atual.

Além disso, não existe hoje um endpoint formal para listar variantes registradas a partir de manifests/registry, e os contratos atuais são insuficientes para um console orientado por variantes — exceto por um `provider.contract.json` mínimo.

## Objetivo

Entregar um conjunto de artefatos SDD para implementar um **Llm Connection Console** orientado por variantes, com source of truth vindo de manifests/registry + backend catalog endpoint, substituindo a abordagem hardcoded plana e preservando compatibilidade temporária interna no backend.

## User Stories

### US-01 — Descobrir variantes suportadas
Como operador,
quero ver as variantes suportadas pela console vindas do backend,
para confiar que a UI reflete o registry/manifests e não uma lista fixa local.

### US-02 — Configurar OpenAI por API key como variante própria
Como usuário,
quero configurar `openai-api` com seus campos mínimos corretos,
para usar API key sem misturar esse fluxo com OAuth.

### US-03 — Configurar OpenAI por OAuth manual como variante própria
Como usuário,
quero configurar `openai-oauth` sem informar segredo bruto,
para concluir o fluxo manual de autenticação de forma coerente com o backend atual.

### US-04 — Configurar Ollama como variante própria
Como usuário,
quero configurar `ollama` exigindo apenas a `baseUrl`,
para conectar endpoints locais/remotos compatíveis sem campos irrelevantes.

### US-05 — Testar conexão antes de salvar
Como usuário,
quero um teste de conexão explícito antes do save,
para evitar persistir configuração inválida ou incompleta.

### US-06 — Sincronizar e selecionar modelo com segurança
Como usuário,
quero sincronizar modelos e escolher um modelo preferido sem perder configuração e seleção anterior em caso de falha,
para operar o provider com segurança.

### US-07 — Ler health estruturado sem bloquear indevidamente o save
Como usuário,
quero ver health estruturado da conexão,
para entender o risco operacional e saber quando o save ainda é permitido pelas regras da variante.

## Edge Cases

### EC-01 — Registry sem variantes suportadas para a console
Se o backend não encontrar variantes suportadas na v1, a UI deve exibir estado vazio explícito, sem fallback para arrays hardcoded.

### EC-02 — Compatibilidade temporária com runtime legado
Se o runtime interno ainda depender de `openai` ou `openai-codex`, o backend pode mapear internamente, mas a UI e os contratos públicos devem continuar exibindo `openai-api` e `openai-oauth`.

### EC-03 — `openai-api` sem `apiKey`
O teste e o save devem falhar por validação de variante, sem persistência silenciosa.

### EC-04 — `openai-oauth` tentando usar segredo bruto
O console não deve expor campo raw secret; se payload incompatível chegar ao backend, a validação deve rejeitar.

### EC-05 — `ollama` sem `baseUrl`
O teste e o save devem falhar por validação de variante.

### EC-06 — Teste de conexão falha antes do save
A configuração temporária pode ser corrigida, mas nada deve ser persistido automaticamente.

### EC-07 — Health retorna degradado ou erro estruturado
A UI deve mostrar status e mensagem estruturados; o save só bloqueia quando a regra específica da variante assim exigir.

### EC-08 — Sync falha depois de existir configuração válida
O sistema deve manter config salva, manter `selectedModelIds` anterior e exibir erro estruturado.

### EC-09 — Health falha, mas o contrato da variante permite save
A UI deve permitir salvar quando a política da variante permitir, sem mascarar o estado degradado/erro.

### EC-10 — UI com affordance singular e contrato em array
A UI pode expor um modelo preferido/ativo, mas a persistência v1 continua em `selectedModelIds`.

## Functional Requirements

### FR-01 — Variants catalog endpoint
O backend deve expor endpoint formal para listar variantes registradas da console, usando registry/manifests como source of truth.

### FR-02 — Variantes suportadas na v1
A console v1 deve suportar apenas `ollama`, `openai-api` e `openai-oauth`.

### FR-03 — Nomes públicos de variantes
A UI deve refletir exatamente os nomes de variantes do manifesto: `openai-api`, `openai-oauth`, `ollama`.

### FR-04 — Distinção explícita entre OpenAI API e OpenAI OAuth
`openai-api` e `openai-oauth` permanecem variantes distintas em UI, contratos, validação e payloads.

### FR-05 — Campos mínimos por variante
- `openai-api`: `apiKey` obrigatório, `baseUrl` opcional, `organization` opcional em contrato.
- `openai-oauth`: sem segredo bruto; iniciar/completar fluxo manual compatível com o backend atual.
- `ollama`: `baseUrl` obrigatório.

### FR-06 — Test connection dedicado
O usuário deve poder testar conexão antes de salvar via endpoint dedicado; falhas não podem persistir dados silenciosamente.

### FR-07 — Sync seguro
Falha de sync não pode apagar configuração válida nem limpar automaticamente seleção anterior.

### FR-08 — Health estruturado
Health deve ser apresentado em contrato estruturado consumível pela UI, com estado degradado/erro claramente exibível.

### FR-09 — Persistência v1 compatível
A feature deve persistir apenas configuração de conexão, `selectedModelIds` e catalog snapshot já suportados pelo repositório atual.

### FR-10 — Sem novo acoplamento fora do escopo
A feature não deve exigir nova integração com router, channels ou agents.

## Assumptions

1. Os manifests em `modules/providers/variants/` permanecem a fonte canônica de variantes suportadas.
2. Os endpoints existentes de providers continuam disponíveis e são reutilizáveis.
3. O fluxo manual atual de OAuth/Codex é a base operacional para o auth mode público `openai-oauth` na v1.
4. O repositório atual já suporta persistir config, catálogo e `selectedModelIds` suficientes para a v1.
5. O rename/refactor completo de `ProviderOrchestratorService` e `IModelCenterService` está fora do escopo desta feature.

## Success Criteria

1. A nova console deixa de depender de `PROVIDER_OPTIONS` hardcoded como source of truth.
2. A UI pública passa a trabalhar com `ollama`, `openai-api` e `openai-oauth`.
3. O backend passa a expor catálogo formal de variantes e endpoint dedicado de teste de conexão.
4. O fluxo `test before save` existe para a console.
5. Falhas de sync preservam config salva e `selectedModelIds`.
6. O design deixa explícito que não há novo acoplamento com router/channels nesta feature.

## Clarifications

### Decisões fechadas

1. **Variantes suportadas na v1**: `ollama`, `openai-api`, `openai-oauth` apenas.
2. **Source of truth da UI**: registry/manifests + backend catalog endpoint; não arrays hardcoded no frontend.
3. **Naming público da console**: usar `openai-api`, `openai-oauth`, `ollama`, mesmo que exista compat mapping interno temporário.
4. **Campos mínimos v1 por variante**:
   - `openai-api`: `apiKey` obrigatório, `baseUrl` opcional, `organization` opcional em contrato.
   - `openai-oauth`: sem raw secret; usar metadados/start flow + completion inputs compatíveis com o fluxo manual atual.
   - `ollama`: `baseUrl` obrigatório.
5. **Teste antes de salvar**: obrigatório via endpoint dedicado; não persistir silenciosamente config inválida.
6. **Falha de sync**: manter config atual, exibir erro estruturado e não apagar seleção de modelo anterior automaticamente.
7. **Falha de health**: exibir estado degradado/erro estruturado; save permitido apenas conforme regra de validação da variante.
8. **Seleção de modelo v1**: persistir via `selectedModelIds`, mas a UI pode oferecer uma affordance singular de preferred/active model.
9. **Persistência v1**: apenas config de conexão, `selectedModelIds` e catalog snapshot; sem novo acoplamento com router/channels.
10. **Arquitetura alvo**: página dedicada `frontend/src/pages/LlmConnectionConsole.tsx` com componentes/hooks/tipos próprios.

### Riscos conhecidos explicitados

- `ModelProviders.tsx` é referência legada e anti-pattern para a nova arquitetura.
- `IModelCenterService` é nomenclatura legada e não deve dirigir o design público da feature.
- `ProviderOrchestratorService` é reutilizável, mas não deve virar o ponto único de crescimento da lógica por variante.

## Rastreabilidade mínima para tasks

- US-01 → catálogo de variantes, contracts, endpoint, loading/empty/error.
- US-02 → formulário/test/save `openai-api`.
- US-03 → formulário/test/save `openai-oauth` sem raw secret.
- US-04 → formulário/test/save `ollama`.
- US-05 → endpoint e fluxo `test connection` antes do save.
- US-06 → sync seguro + preferred model compatível com `selectedModelIds`.
- US-07 → health estruturado e política de save por variante.

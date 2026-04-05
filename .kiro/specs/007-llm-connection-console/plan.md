# Plan — 007-llm-connection-console

## Objetivo

Planejar a implementação do novo console de conexão LLM com arquitetura modular, orientada por variantes e compatível com o domínio atual de providers sem expandir o escopo para router/channels/agents.

## Phase Order

### Phase 1 — Contracts and backend boundaries
- Introduzir contratos explícitos da console.
- Criar catálogo formal de variantes.
- Criar endpoint de teste de conexão sem persistência.

### Phase 2 — Backend integration and safety rules
- Encapsular compat mapping interno por variante.
- Reutilizar create/list/delete/sync/catalog/select/health existentes.
- Garantir regras de preservação em falha de sync e sinalização estruturada de health.

### Phase 3 — Frontend console surface
- Criar `LlmConnectionConsole.tsx`.
- Criar componentes e hook agregador próprios.
- Remover dependência arquitetural do hardcode de `ModelProviders.tsx`.

### Phase 4 — Tests and rollout verification
- Cobertura backend e frontend para catálogo, teste, save, sync, health e modelo preferido.
- Verificações finais de TypeScript e não-regressão.

## Arquitetura da tela

### Layout proposto

1. **Variant catalog panel**
   - Cards/lista das variantes suportadas
   - Nome da variante, capabilities, auth mode, descrição curta

2. **Connection form panel**
   - Form dinâmico por variante
   - Campos mínimos por variante
   - CTA de `Test connection`
   - CTA de `Save configuration`

3. **Connection status panel**
   - Health estruturado
   - Último resultado do teste
   - Erros operacionais exibíveis

4. **Models panel**
   - Sync models
   - Catálogo sincronizado
   - Preferred/active model com persistência via `selectedModelIds`

## Backend integration

### Reuso explícito

- `POST /api/providers`
- `GET /api/providers`
- `DELETE /api/providers/:id`
- `POST /api/providers/:id/sync`
- `GET /api/providers/:id/models`
- `POST /api/providers/:id/models/select`
- `GET /api/providers/:id/health`
- `GET /api/providers/:id/health/stream`
- Rotas manuais atuais de OAuth/Codex como base operacional para `openai-oauth`

### Adições mínimas recomendadas

- `GET /api/providers/variants`
- `POST /api/providers/connection-test`

### Estratégia backend

- Serviço específico para catálogo de variantes
- Serviço específico para teste de conexão
- Mapper específico para compatibilidade com runtime legado
- Reuso controlado de `ProviderOrchestratorService` apenas onde ele já resolve bem o problema

## Contracts consumed/created

### Consumidos

- `provider.contract.json` existente como contrato mínimo legado
- contratos atuais dos endpoints de create/list/sync/catalog/select/health

### Criados

- `provider-variant-catalog.contract.json`
- `provider-connection-test.contract.json`
- `provider-console-save.contract.json`
- `provider-health.contract.json`

### Decisões de contrato

- Variante pública sempre explícita
- `openai-api` e `openai-oauth` não colapsam em um tipo público único
- `organization` existe em contrato de `openai-api` mesmo que o adapter ainda ignore o campo
- `openai-oauth` usa auth mode distinto e não trafega raw secret

## Frontend components

- `LlmConnectionConsole.tsx`
- `VariantCatalogPanel.tsx`
- `VariantConnectionForm.tsx`
- `ConnectionTestPanel.tsx`
- `VariantHealthSummary.tsx`
- `PreferredModelSelector.tsx`

### Reuso planejado

- `HealthBadge`
- `ToastNotification`
- partes úteis de `useProviders.ts` e `frontend/src/api/kernel.ts`

## Hooks

### Novo hook principal

`useLlmConnectionConsole.ts` deve:

- buscar variants catalog
- buscar providers salvos
- testar conexão
- salvar configuração
- sincronizar catálogo
- consultar/exibir health
- salvar seleção de modelo preferido via `selectedModelIds`

### Hooks legados

`useProviders.ts` pode continuar sendo usado como base, mas não deve se tornar a nova página inteira por acoplamento indireto.

## API routes

### New

- `GET /api/providers/variants`
- `POST /api/providers/connection-test`

### Existing reused

- `POST /api/providers`
- `GET /api/providers`
- `DELETE /api/providers/:id`
- `POST /api/providers/:id/sync`
- `GET /api/providers/:id/models`
- `POST /api/providers/:id/models/select`
- `GET /api/providers/:id/health`
- `GET /api/providers/:id/health/stream`

## Tests

### Backend tests

- unit: variant catalog service
- unit: connection test service
- route: variants endpoint
- route: connection-test endpoint
- regression: sync failure preserves config and `selectedModelIds`

### Frontend tests

- page loading/empty/error
- variant-specific form rendering
- test before save flow
- health degraded/error rendering
- sync failure rendering with preserved selection
- preferred model payload compatibility

## Rollout criteria

1. A nova console não depende de arrays hardcoded como source of truth.
2. Variantes públicas visíveis são apenas `ollama`, `openai-api`, `openai-oauth`.
3. O backend oferece catálogo de variantes e teste de conexão dedicados.
4. O fluxo `test connection` não persiste automaticamente configs inválidas.
5. Falha de sync preserva config e `selectedModelIds`.
6. Não há novo acoplamento com router/channels/agents.
7. `ModelProviders.tsx` fica explicitamente tratado como legado, não como target architecture.

## Decisões arquiteturais-chave fechadas

- Manifest/registry é a fonte de verdade das variantes.
- UI pública usa naming de manifesto.
- Compat mapping legado existe apenas internamente no backend.
- `openai-api` e `openai-oauth` continuam variantes distintas.
- Teste e save são operações separadas.
- Persistência v1 permanece limitada a config, catálogo e `selectedModelIds`.

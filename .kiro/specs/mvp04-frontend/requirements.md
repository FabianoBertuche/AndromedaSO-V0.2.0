# Documento de Requisitos — MVP04 Frontend

## Introdução

Esta feature completa o MVP04 do frontend do Andromeda SO, corrigindo e aprimorando três áreas da interface React existente:

1. **Benchmark ao vivo com seleção de modelo** — o botão "Run Benchmark" está hardcoded para `gpt-4o`; deve permitir selecionar qualquer modelo do catálogo sincronizado, exibir progresso durante execução e mostrar o campo `simulated` como badge no resultado.
2. **Health badge em tempo real** — o badge de health na tabela de providers não reflete visualmente os eventos SSE recebidos; deve atualizar cor e exibir latência ao lado do status.
3. **Feedback visual de ações** — Sync, Health Check e Benchmark não possuem feedback de loading/sucesso/erro; devem exibir estado de loading nos botões e mensagem inline em caso de erro.

Stack: React 18 + Vite 5 + TailwindCSS 3 + TanStack React Query 5. Visual language: neon matrix (verde/ciano sobre fundo escuro).

---

## Glossário

- **BenchmarkPanel**: Componente da página `RouterIntelligence` responsável por disparar e exibir resultados de benchmark.
- **BenchmarkResult**: Objeto retornado pelo endpoint `/api/llm-router/benchmark`, contendo `modelId`, `taskType`, `score`, `latencyMs` e `simulated`.
- **CatalogModel**: Modelo sincronizado de um provider, disponível via `/api/providers/{id}/models`.
- **HealthBadge**: Elemento visual que exibe o status de saúde de um provider com cor e latência.
- **HealthEvent**: Evento SSE emitido pelo stream `/api/providers/{id}/health/stream` contendo `health` e `latencyMs`.
- **ModelSelector**: Componente de seleção de modelo dentro do BenchmarkPanel.
- **Provider**: Entidade que representa um provedor de LLM registrado no sistema.
- **ProvidersTable**: Tabela da página `ModelProviders` que lista os providers cadastrados.
- **RouterIntelligence**: Página que exibe rankings, histórico de decisões, LLMTestbed e BenchmarkPanel.
- **SimulatedBadge**: Badge visual exibido quando `BenchmarkResult.simulated === true`.
- **ToastNotification**: Mensagem inline ou flutuante exibida em resposta a erros de ações do usuário.

---

## Requisitos

### Requisito 1: Seleção de modelo para benchmark

**User Story:** Como operador, quero selecionar qualquer modelo do catálogo sincronizado antes de executar um benchmark, para que eu possa comparar modelos específicos em vez de sempre testar o `gpt-4o`.

#### Critérios de Aceitação

1. THE **BenchmarkPanel** SHALL exibir um seletor (`<select>`) populado com todos os `CatalogModel` disponíveis nos providers cadastrados.
2. WHEN o usuário não tiver nenhum modelo sincronizado, THE **BenchmarkPanel** SHALL exibir a mensagem "Nenhum modelo disponível. Sincronize um provider primeiro." no lugar do seletor.
3. WHEN o usuário selecionar um modelo e clicar em "Run Benchmark", THE **BenchmarkPanel** SHALL chamar o endpoint `/api/llm-router/benchmark` com o `modelId` do modelo selecionado.
4. THE **BenchmarkPanel** SHALL proibir o envio do formulário de benchmark enquanto nenhum modelo estiver selecionado, mantendo o botão desabilitado.

---

### Requisito 2: Estado de loading durante benchmark

**User Story:** Como operador, quero ver um indicador de progresso enquanto o benchmark está sendo executado, para que eu saiba que a ação foi disparada e o sistema está processando.

#### Critérios de Aceitação

1. WHEN o benchmark estiver em execução, THE **BenchmarkPanel** SHALL exibir o botão "Run Benchmark" no estado desabilitado com o texto "Executando...".
2. WHEN o benchmark estiver em execução, THE **BenchmarkPanel** SHALL exibir um indicador de progresso visível (spinner ou animação de pulso) adjacente ao botão.
3. WHEN o benchmark for concluído com sucesso, THE **BenchmarkPanel** SHALL restaurar o botão ao estado habilitado com o texto original "Run Benchmark".
4. IF o benchmark falhar, THEN THE **BenchmarkPanel** SHALL restaurar o botão ao estado habilitado e exibir uma mensagem de erro inline.

---

### Requisito 3: Exibição imediata do resultado na tabela

**User Story:** Como operador, quero ver o resultado do benchmark aparecer imediatamente na tabela após a execução, para que eu não precise recarregar a página.

#### Critérios de Aceitação

1. WHEN o benchmark for concluído com sucesso, THE **BenchmarkPanel** SHALL inserir o `BenchmarkResult` no topo da tabela de benchmarks sem recarregar a página.
2. THE **BenchmarkPanel** SHALL manter no máximo 10 resultados visíveis na tabela, descartando os mais antigos.
3. WHEN o `BenchmarkResult` contiver `simulated: true`, THE **BenchmarkPanel** SHALL exibir um **SimulatedBadge** na coluna "Model" da linha correspondente.
4. THE **SimulatedBadge** SHALL ser renderizado como um elemento `<span>` com texto "Simulated" e estilo visual distinto (ex.: borda amarela/âmbar no padrão neon matrix).

---

### Requisito 4: Health badge com cor e latência em tempo real

**User Story:** Como operador, quero que o badge de health na tabela de providers atualize sua cor e exiba a latência em tempo real conforme os eventos SSE chegam, para que eu possa monitorar a saúde dos providers sem recarregar a página.

#### Critérios de Aceitação

1. THE **HealthBadge** SHALL exibir cor verde quando `health === 'ok'`, cor amarela quando `health === 'warning'` e cor vermelha quando `health === 'error'` ou qualquer outro valor.
2. THE **HealthBadge** SHALL exibir a latência em milissegundos ao lado do status (ex.: "OK 120ms").
3. WHEN um **HealthEvent** for recebido via SSE, THE **HealthBadge** SHALL atualizar sua cor e latência sem recarregar a página ou refazer a query de providers.
4. THE **ProvidersTable** SHALL aplicar o **HealthBadge** a cada linha de provider usando os dados mais recentes disponíveis (SSE ou último valor da query).
5. WHILE nenhum dado de health estiver disponível para um provider, THE **HealthBadge** SHALL exibir o estado "Unknown" com cor neutra (cinza).

---

### Requisito 5: Atualização de health via SSE sem re-fetch completo

**User Story:** Como operador, quero que a atualização de health via SSE seja aplicada diretamente no estado local, para que a tabela de providers não pisque ou recarregue desnecessariamente.

#### Critérios de Aceitação

1. WHEN um **HealthEvent** SSE for recebido, THE **useProviderHealthStream** hook SHALL atualizar o cache do React Query do provider correspondente diretamente via `queryClient.setQueryData`, sem disparar um novo fetch.
2. THE **useProviderHealthStream** hook SHALL extrair os campos `health` e `latencyMs` do payload do **HealthEvent** e aplicá-los ao provider correto no cache.
3. IF o **HealthEvent** não contiver `latencyMs`, THEN THE **useProviderHealthStream** hook SHALL preservar o valor de `latencyMs` já existente no cache.

---

### Requisito 6: Feedback visual de loading nos botões de ação

**User Story:** Como operador, quero que os botões "Sync", "Test" e "Run Benchmark" mostrem estado de loading durante a execução, para que eu saiba que a ação foi recebida e estou aguardando o resultado.

#### Critérios de Aceitação

1. WHEN a ação de Sync estiver em execução para um provider, THE **ProvidersTable** SHALL exibir o botão "Sync" daquele provider no estado desabilitado com texto "Syncing...".
2. WHEN a ação de Health Check estiver em execução para um provider, THE **ProvidersTable** SHALL exibir o botão "Test" daquele provider no estado desabilitado com texto "Testing...".
3. WHEN qualquer ação (Sync, Test) for concluída com sucesso, THE **ProvidersTable** SHALL restaurar o botão ao estado habilitado com o texto original.
4. THE **ProvidersTable** SHALL desabilitar os botões "Sync" e "Test" de um provider enquanto qualquer uma das duas ações estiver em execução para aquele provider.

---

### Requisito 7: Feedback de erro inline para ações

**User Story:** Como operador, quero ver uma mensagem de erro clara quando uma ação falhar, para que eu saiba o que aconteceu e possa tomar uma ação corretiva.

#### Critérios de Aceitação

1. IF a ação de Sync falhar, THEN THE **ProvidersTable** SHALL exibir uma **ToastNotification** com a mensagem de erro retornada pelo backend ou "Falha ao sincronizar modelos." como fallback.
2. IF a ação de Health Check falhar, THEN THE **ProvidersTable** SHALL exibir uma **ToastNotification** com a mensagem de erro retornada pelo backend ou "Falha ao verificar health." como fallback.
3. IF o benchmark falhar, THEN THE **BenchmarkPanel** SHALL exibir uma **ToastNotification** com a mensagem de erro retornada pelo backend ou "Falha ao executar benchmark." como fallback.
4. THE **ToastNotification** SHALL ser exibida por no mínimo 4 segundos e no máximo 8 segundos antes de desaparecer automaticamente.
5. THE **ToastNotification** SHALL ser renderizada com estilo visual de erro (borda vermelha/rosa no padrão neon matrix).
6. WHEN o usuário clicar no botão de fechar da **ToastNotification**, THE **ToastNotification** SHALL ser removida imediatamente.

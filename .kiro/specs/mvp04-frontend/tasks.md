# Plano de Implementação: MVP04 Frontend

## Visão Geral

Implementação incremental dos componentes, hooks e refatorações necessários para completar o MVP04 do frontend do Andromeda SO. Cada tarefa constrói sobre a anterior, terminando com a integração completa nas páginas `ModelProviders` e `RouterIntelligence`.

## Tarefas

- [x] 1. Estender tipos em `frontend/src/types/model.ts`
  - Adicionar campo `simulated?: boolean` à interface `ModelBenchmark`
  - Adicionar campo `latencyMs?: number` à interface `Provider`
  - _Requisitos: 3.3, 4.2, 5.2_

- [x] 2. Criar componentes atômicos
  - [x] 2.1 Criar `frontend/src/components/HealthBadge.tsx`
    - Implementar mapeamento de `health` para classes Tailwind: `ok` → emerald, `warning` → yellow, `error` → red, `undefined` → slate/"Unknown"
    - Exibir latência em ms ao lado do status quando `latencyMs` estiver presente
    - _Requisitos: 4.1, 4.2, 4.5_

  - [x]* 2.2 Escrever teste de propriedade para `HealthBadge` — Propriedade 6 e 7
    - **Propriedade 6: HealthBadge mapeia health para cor correta**
    - **Valida: Requisito 4.1**
    - **Propriedade 7: HealthBadge exibe latência para qualquer valor numérico**
    - **Valida: Requisito 4.2**
    - Arquivo: `frontend/src/components/__tests__/HealthBadge.property.test.tsx`

  - [x]* 2.3 Escrever testes unitários para `HealthBadge`
    - Testar estado Unknown, ok/warning/error com e sem latência
    - Arquivo: `frontend/src/components/__tests__/HealthBadge.test.tsx`
    - _Requisitos: 4.1, 4.2, 4.5_

  - [x] 2.4 Criar `frontend/src/components/SimulatedBadge.tsx`
    - Renderizar `<span>` com texto "Simulated" e classes âmbar neon
    - _Requisitos: 3.3, 3.4_

  - [x]* 2.5 Escrever testes unitários para `SimulatedBadge`
    - Verificar renderização do span com texto e classes corretas
    - Arquivo: `frontend/src/components/__tests__/SimulatedBadge.test.tsx`
    - _Requisitos: 3.4_

  - [x] 2.6 Criar `frontend/src/components/ToastNotification.tsx`
    - Implementar auto-dismiss via `useEffect` + `setTimeout` com `durationMs` padrão 5000ms
    - Botão de fechar chama `onClose` imediatamente
    - Estilo: borda vermelha/rosa neon, posição `fixed bottom-4 right-4`
    - _Requisitos: 7.4, 7.5, 7.6_

  - [x]* 2.7 Escrever teste de propriedade para `ToastNotification` — Propriedade 12
    - **Propriedade 12: ToastNotification desaparece dentro do intervalo [4000, 8000]ms**
    - **Valida: Requisito 7.4**
    - Usar `vi.useFakeTimers()` para controlar o tempo
    - Arquivo: `frontend/src/components/__tests__/ToastNotification.property.test.tsx`

  - [x]* 2.8 Escrever testes unitários para `ToastNotification`
    - Testar auto-dismiss, fechar manualmente e estilo de erro
    - Arquivo: `frontend/src/components/__tests__/ToastNotification.test.tsx`
    - _Requisitos: 7.4, 7.5, 7.6_

- [x] 3. Checkpoint — Garantir que todos os testes dos componentes atômicos passam
  - Garantir que todos os testes passam; perguntar ao usuário se houver dúvidas.

- [x] 4. Criar componente `ModelSelector`
  - [x] 4.1 Criar `frontend/src/components/ModelSelector.tsx`
    - Renderizar `<select>` com `<optgroup>` agrupado por provider
    - Exibir mensagem de fallback "Nenhum modelo disponível. Sincronize um provider primeiro." quando `models` estiver vazio
    - _Requisitos: 1.1, 1.2_

- [x] 5. Criar hooks auxiliares
  - [x] 5.1 Criar hook `useProviderLoadingState` em `frontend/src/hooks/useProviders.ts`
    - Implementar com `useState<Set<string>>` para rastrear loading por provider
    - Exportar `isLoading(providerId)` e `setLoading(providerId, loading)`
    - _Requisitos: 6.1, 6.2, 6.4_

  - [x] 5.2 Criar hook `useBenchmark` em `frontend/src/hooks/useProviders.ts`
    - Usar `useMutation` do React Query internamente
    - Mapear resposta do endpoint para `BenchmarkResultRow` incluindo campo `simulated`
    - Exportar `run(modelId, taskType)` e `isPending`
    - _Requisitos: 1.3, 2.1, 2.2, 2.3, 2.4_

  - [x] 5.3 Refatorar `useProviderHealthStream` em `frontend/src/hooks/useProviders.ts`
    - Substituir `invalidateQueries` por `queryClient.setQueryData` no handler do evento SSE
    - Extrair `health` e `latencyMs` do payload e aplicar ao provider correto no cache
    - Preservar `latencyMs` existente quando o evento não contiver esse campo
    - Fechar `EventSource` no handler de erro para evitar reconexões infinitas
    - _Requisitos: 5.1, 5.2, 5.3_

  - [x]* 5.4 Escrever teste de propriedade para `useProviderHealthStream` — Propriedades 9 e 10
    - **Propriedade 9: useProviderHealthStream usa setQueryData, nunca invalidateQueries**
    - **Valida: Requisito 5.1**
    - **Propriedade 10: useProviderHealthStream aplica health e latencyMs ao provider correto**
    - **Valida: Requisitos 5.2, 5.3**
    - Arquivo: `frontend/src/hooks/__tests__/useProviderHealthStream.property.test.ts`

  - [x]* 5.5 Escrever testes unitários para `useProviderHealthStream`
    - Testar atualização via setQueryData, preservação de latencyMs e fechamento no erro
    - Arquivo: `frontend/src/hooks/__tests__/useProviderHealthStream.test.ts`
    - _Requisitos: 5.1, 5.2, 5.3_

- [x] 6. Criar `BenchmarkPanel` (extração de `RouterIntelligence`)
  - [x] 6.1 Criar `frontend/src/components/BenchmarkPanel.tsx`
    - Extrair bloco de benchmark de `RouterIntelligence.tsx` para componente próprio
    - Usar `useBenchmark` internamente para executar benchmarks
    - Usar `ModelSelector` para seleção de modelo; desabilitar botão quando nenhum modelo selecionado
    - Exibir spinner/animação de pulso durante execução (`isPending`)
    - Inserir resultado no topo de `results` e limitar a 10 itens
    - Renderizar `SimulatedBadge` na coluna "Model" quando `simulated === true`
    - Exibir `ToastNotification` em caso de erro
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 7.3_

  - [x]* 6.2 Escrever testes de propriedade para `BenchmarkPanel` — Propriedades 1 a 5
    - **Propriedade 1: Seletor populado com todos os modelos disponíveis** — Valida: Requisito 1.1
    - **Propriedade 2: Chamada de benchmark usa o modelId selecionado** — Valida: Requisito 1.3
    - **Propriedade 3: Resultado de benchmark inserido no topo da tabela** — Valida: Requisito 3.1
    - **Propriedade 4: Tabela limitada a 10 resultados** — Valida: Requisito 3.2
    - **Propriedade 5: SimulatedBadge presente se e somente se simulated=true** — Valida: Requisito 3.3
    - Arquivo: `frontend/src/components/__tests__/BenchmarkPanel.property.test.tsx`

  - [x]* 6.3 Escrever testes unitários para `BenchmarkPanel`
    - Testar estado loading, estado erro, estado sem modelos e inserção de resultado
    - Arquivo: `frontend/src/components/__tests__/BenchmarkPanel.test.tsx`
    - _Requisitos: 1.2, 1.4, 2.1, 2.4, 7.3_

- [x] 7. Atualizar `ModelProviders` para usar novos componentes e hooks
  - [x] 7.1 Atualizar `frontend/src/pages/ModelProviders.tsx`
    - Substituir função `healthBadge` inline pelo componente `<HealthBadge>`
    - Adicionar componente auxiliar `HealthStreamSubscriber` (render-nothing) para chamar `useProviderHealthStream` por provider
    - Integrar `useProviderLoadingState` para controlar loading por provider nos botões Sync e Test
    - Desabilitar ambos os botões de um provider enquanto qualquer ação estiver em execução
    - Exibir `ToastNotification` em caso de erro nas ações Sync e Test
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.1, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

  - [x]* 7.2 Escrever testes de propriedade para `ProvidersTable` — Propriedades 8 e 11
    - **Propriedade 8: HealthBadge presente em cada linha da ProvidersTable** — Valida: Requisito 4.4
    - **Propriedade 11: Ambos os botões desabilitados durante qualquer ação por provider** — Valida: Requisito 6.4
    - Arquivo: `frontend/src/components/__tests__/ModelProviders.property.test.tsx`

  - [x]* 7.3 Escrever testes unitários para `ModelProviders`
    - Testar botões Sync/Test com loading por provider e toast de erro
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

- [x] 8. Atualizar `RouterIntelligence` para usar `BenchmarkPanel`
  - Remover bloco de benchmark inline de `frontend/src/pages/RouterIntelligence.tsx`
  - Substituir pelo componente `<BenchmarkPanel />`
  - Remover imports e estado local que foram movidos para `BenchmarkPanel`
  - _Requisitos: 1.1, 1.3, 2.1, 3.1_

- [x] 9. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam; perguntar ao usuário se houver dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Testes de propriedade usam `@fast-check/vitest` com mínimo de 100 iterações
- Testes de `ToastNotification` usam `vi.useFakeTimers()` para controle de tempo

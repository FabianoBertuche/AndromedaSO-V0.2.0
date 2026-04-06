# MVP04: Model Center & Intelligent LLM Router - Documentação Técnica

Este documento detalha o progresso e as especificações do **MVP04**, focado na gestão centralizada de modelos de IA, benchmarks baseados em evidência e um algoritmo de roteamento inteligente para o Andromeda OS.

## 🎯 Objetivo
Transformar o Andromeda de um sistema de "modelo único" em uma plataforma multi-modelo capaz de escolher automaticamente a melhor ferramenta para cada tarefa, equilibrando **Qualidade**, **Latência** e **Custo**.

---

## ✅ O que já foi Implementado

### 1. Catalogação e Inferência de Capacidades
- **Ollama Adapter**: Refatoramos o [OllamaProviderAdapter.ts](file:///c:/FB/Andromeda-SO/packages/api/src/infrastructure/adapters/providers/OllamaProviderAdapter.ts) para inferir capacidades reais via regex nos nomes dos modelos.
- **Taxonomia de Capabilities**: Implementamos suporte inicial para:
  - `coding`, `reasoning` (DeepSeek-R1, Coder), `vision` (LLaVA), `structured_output` (JSON), `tools` (Function Calling).
- **Metadados de Custo**: Adicionamos placeholders de `Pricing` no catálogo, permitindo que o roteador trate modelos locais como "custo zero" e modelos cloud como custos variáveis.

### 2. Algoritmo de Roteamento Inteligente (Weighted Scoring)
- **Engine de Decisão**: Atualizamos o [RouteTaskUseCase.ts](file:///c:/FB/Andromeda-SO/packages/core/src/application/use-cases/model-center/RouteTaskUseCase.ts) com um sistema de pontuação ponderada.
- **Fatores de Escolha**:
  - **Qualidade (50%)**: Baseada nos scores de benchmark passados para a categoria da tarefa.
  - **Latência (20%)**: Penaliza modelos lentos acima de 1000ms.
  - **Custo (20%)**: Privilegia modelos locais ou cloud mais baratos.
- **Justificativa Transparente**: Cada decisão agora carrega um log detalhando os scores de cada candidato avaliado.

### 3. Engine de Benchmark Baseada em Evidência
- **Prompts Padronizados**: O [RunBenchmarkUseCase.ts](file:///c:/FB/Andromeda-SO/packages/core/src/application/use-cases/model-center/RunBenchmarkUseCase.ts) agora utiliza prompts reais (`coding`, `chat`) para testar os modelos.
- **Métricas Reais**: O sistema mede o tempo de resposta (latência) e valida o sucesso da execução antes de persistir o `BenchmarkResult` e atualizar o score no catálogo.

### 4. Correções de Infraestrutura (Build & UI)
- **Fix Web Build**: Eliminados erros de tipagem e variáveis órfãs em `ModelCatalogPanel.tsx`, permitindo `npm run build` bem-sucedido.
- **Feedback visual**: O playground do catálogo agora fornece status em tempo real ("Processando...", "Sucesso", "Erro").

---

## 🚧 O que está sendo Implementado (Próximas Etapas)

### 1. Pricing Registry Dinâmico
- Implementação de um repositório central para gerenciar tabelas de preços de modelos Cloud (OpenAI, Anthropic) para que o roteamento seja financeiramente preciso.

### 2. Integração Ollama Cloud & Remote
- Expansão dos adapters para suportar instâncias remotas do Ollama, garantindo que o `locality: "cloud"` seja devidamente tratado pelo Kernel.

### 3. Painel de Observabilidade de Decisão
- Melhoria visual no **Router Intelligence** para exibir gráficos comparativos de scores entre o modelo escolhido e os candidatos descartados (transparência de decisão).

### 4. Configuração de Pesos via UI
- Permitir que o administrador ajuste manualmente os pesos do roteador (ex: dar 90% de peso para Custo em tarefas simples).

---

## 💡 Validação
- **Frontend**: `apps/web` compila 100% sem erros de lint.
- **Roteamento**: Simulando tarefas de "coding" escolhe corretamente modelos com a tag `coder` que possuam score alto e latência aceitável.
- **Benchmark**: Execuções manuais via `POST /model-center/benchmarks/run` refletem imediatamente no Catálogo de Modelos.

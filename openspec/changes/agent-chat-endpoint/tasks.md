## Task List

### Backend Tasks

- [x] **Task 1.1**: Adicionar schema de request `agentChatRequestSchema` em `core/kernel/src/modules/agents/routes/agentRoutes.ts`
  - Verificação: `cd core/kernel && npx tsc --noEmit` sem erros

- [x] **Task 1.2**: Modificar factory `getAgentApplicationService()` para injetar `providerOrchestratorService`
  - Arquivo: `core/kernel/src/modules/agents/routes/agentRoutes.ts` (linhas 82-90)
  - Verificação: compilação passa

- [x] **Task 1.3**: Adicionar método `chat()` no `AgentApplicationService`
  - Arquivo: `core/kernel/src/modules/agents/services/agentApplicationService.ts`
  - Deve: carregar agente, verificar status, verificar modelo, injetar system prompt, chamar provider
  - Verificação: compilação passa

- [x] **Task 1.4**: Adicionar rota POST `/api/agents/:id/chat` em `agentRoutes.ts`
  - Usar schema de validação
  - Chamar service.chat()
  - Retornar resposta formatada
  - Verificação: `npx tsc --noEmit` sem erros

### Frontend Tasks

- [x] **Task 2.1**: Adicionar tipos `AgentChatRequest` e `AgentChatResponse` em `frontend/src/types/kernel.ts`
  - Verificação: `cd frontend && npx tsc --noEmit` sem erros

- [x] **Task 2.2**: Adicionar função `chatWithAgent()` em `frontend/src/api/kernel.ts`
  - Endpoint: POST /api/agents/{agentId}/chat
  - Parâmetros: agentId, messages, stream?
  - Retorno: ChatResponse ou AsyncIterable para streaming
  - Verificação: compilação passa

- [x] **Task 2.3**: Simplificar hook `useAgentChatConsole.ts`
  - REMOVER: `useProviders()`, `getProviderCatalog()`, `buildChatModelOptions()`
  - REMOVER: Lógica de verificação de modelos ambíguos
  - MANTER: Apenas seleção de agente e envio de mensagens
  - ALTERAR: `sendMessage()` para usar `chatWithAgent()` ao invés de `sendModelChatMessage()`
  - Verificação: compilação passa

### Validation Tasks

- [x] **Task 3.1**: Verificar que nenhuma chamada a `/api/providers/*` é feita durante chat
  - Buscar em todos os arquivos de chat do frontend

- [x] **Task 3.2**: Testar chat com agente ativo
  - Criar agente, configurar modelo, testar conversa
  - Verificar que system prompt é injetado (via logs)

- [x] **Task 3.3**: Testar erro quando agente não tem modelo configurado
  - Deve retornar erro 400 com mensagem clara

## Execution Order

1. Backend primeiro (Tasks 1.1-1.4)
2. Frontend depois (Tasks 2.1-2.3)
3. Validação final (Tasks 3.1-3.3)

## Critical Success Criteria

- [x] Endpoint `/api/agents/:id/chat` existe e funciona
- [x] Frontend não chama mais `/api/providers/chat` para conversar com agentes
- [x] System prompt do agente é automaticamente injetado
- [x] Modelo do agente é usado automaticamente
- [x] Erros claros quando agente não tem modelo ou está inativo

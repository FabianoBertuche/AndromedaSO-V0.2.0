## Why

Atualmente o sistema permite chat diretamente com modelos via `/api/providers/chat`, o que viola a lei canônica do projeto: **o foco deve ser nos agentes, não nos modelos**. O usuário deve conversar com o agente, que por sua vez utiliza seu modelo configurado, system prompt e comportamento. Este é o princípio fundamental que diferencia este projeto de simples UIs de LLM.

## What Changes

1. **Novo endpoint de chat para agentes**: `POST /api/agents/:id/chat` - permite conversar diretamente com um agente específico
2. **Método `chat()` no AgentApplicationService**: carrega o agente, verifica permissões, injeta system prompt e chama o provider
3. **Simplificação do frontend**: o hook `useAgentChatConsole` deve enviar apenas `{ agentId, messages }` ao invés de buscar providers e modelos
4. **Remoção de dependência de providers no chat**: frontend nunca deve chamar `/api/providers/*` durante chat com agente
5. **Injeção automática de system prompt**: o backend usa `effectiveSystemPrompt` do agente resolvido

## Capabilities

### New Capabilities
- `agent-chat`: Endpoint de chat específico para agentes onde o agente processa mensagens usando suas configurações (modelo, systemPrompt, comportamento)

### Modified Capabilities
- `agent-management`: Adicionar operação de chat aos agentes existentes

## Impact

**Backend (`core/kernel/`):**
- Novo endpoint em `agentRoutes.ts`
- Modificação em `AgentApplicationService` para injetar `providerOrchestratorService`
- Novo método `chat()` que orquestra a comunicação com providers

**Frontend (`frontend/`):**
- Simplificação de `useAgentChatConsole.ts` - remover lógica de providers/models
- Nova função em `kernel.ts` para chamar endpoint de agente
- Atualização de tipos em `types/kernel.ts`

**Documentação:**
- Nova regra canônica em AGENTS.md
- Documentação em `docs/suporte/andromeda-agents-canonical-fields.md`

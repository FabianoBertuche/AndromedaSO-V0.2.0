## Context

O sistema atual permite chat direto com modelos via `/api/providers/chat`, mas o usuário deve conversar com AGENTES. Cada agente possui:
- Um modelo configurado (`preferredModel` em `overrides` ou `effectiveModelPolicy.preferredModel` quando resolvido)
- Um system prompt composto (`systemInstructions` + personality + tone + etc.)
- Comportamentos e restrições definidos

A arquitetura deve garantir que:
1. O frontend envie apenas `{ agentId, messages }`
2. O backend resolva o agente completo
3. O backend injete o system prompt e use o modelo do agente
4. O backend chame o provider apropriado

## Goals

1. Criar endpoint `POST /api/agents/:id/chat` que recebe mensagens e retorna resposta do agente
2. Implementar método `chat()` no `AgentApplicationService` que orquestra a comunicação
3. Modificar factory para injetar `providerOrchestratorService` no service de agentes
4. Simplificar frontend removendo lógica de providers/models do hook de chat
5. Garantir que o system prompt do agente seja injetado automaticamente

## Architecture

### Backend

```
POST /api/agents/:id/chat
  ↓
agentRoutes.ts
  ↓
AgentApplicationService.chat(agentId, messages, stream?)
  ↓
1. loadAgent(id) → ResolvedAgentConfig
2. Verifica status === 'active'
3. Verifica preferredModel !== null
4. Prepara messages: [systemPrompt, ...userMessages]
5. Chama providerOrchestratorService.chat({
     modelId: resolvedConfig.effectiveModelPolicy.preferredModel,
     messages: preparedMessages,
     stream
   })
  ↓
Retorna resposta ao cliente
```

### Frontend

```
AgentChatConsole
  ↓
useAgentChatConsole
  ↓
chatWithAgent(agentId, messages)  ← NOVO: sem modelId!
  ↓
POST /api/agents/{agentId}/chat
  ↓
Resposta exibida no console
```

### Data Flow

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Olá!" }
  ],
  "stream": false
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Olá! Sou o agente configurado. Como posso ajudar?"
  },
  "metadata": {
    "agentId": "uuid",
    "modelUsed": "gpt-4",
    "timestamp": "2026-04-06T..."
  }
}
```

## Key Decisions

1. **Por que injetar providerOrchestratorService no AgentApplicationService?**
   - O service de agentes já tem acesso ao resolvedConfig
   - Centraliza a lógica de orquestração no domínio de agentes
   - Mantém separation of concerns: agentes sabem COMO conversar, providers sabem COMO executar

2. **Por que simplificar o frontend?**
   - Segue a lei canônica: foco em agentes, não em modelos
   - Reduz complexidade: frontend não precisa saber de providers, catalogs, etc.
   - Facilita futuros canais (Slack, Discord): todos usam o mesmo endpoint de agente

3. **Por que verificar preferredModel no backend?**
   - Fail fast: erro claro se agente não tem modelo configurado
   - Segurança: evita chamadas a providers sem modelo válido

## Risks and Mitigations

| Risco | Mitigação |
|-------|-----------|
| Provider não disponível | Try/catch com erro específico "Provider unavailable" |
| Agente sem modelo | Verificação explícita antes de chamar provider |
| Agente inativo | Verificação de status antes de processar |
| System prompt muito grande | Limite configurável (futuro) |

## Implementation Notes

- Manter compatibilidade com streaming (se suportado pelo provider)
- Usar mesmo schema de mensagens do provider existente
- Logger deve registrar: agentId, modelId, providerId (para auditoria)

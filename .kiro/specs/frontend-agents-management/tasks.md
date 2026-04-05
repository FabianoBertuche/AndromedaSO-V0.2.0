---
name: frontend-agents-management
description: Tasks para implementação da interface de gestão de agentes no frontend
---

# Tasks — Frontend Agents Management

## Task List

- [x] 1. Criar tipos em frontend/src/types/kernel.ts
- [x] 2. Adicionar funções de API em frontend/src/api/kernel.ts
- [x] 3. Criar hook useAgents.ts
- [x] 4. Criar página Agents.tsx
- [x] 5. Atualizar App.tsx
- [x] 6. Verificar compilação

---

## Task Details

### Task 1: Criar tipos em frontend/src/types/kernel.ts

**Descrição**: Adicionar os tipos TypeScript para AgentInstance, AgentTemplateManifest, ResolvedAgentConfig, CreateAgentInput, UpdateAgentInput, DuplicateAgentInput e LoadAgentInput.

**Arquivo-alvo**: `frontend/src/types/kernel.ts`

**Tipos a adicionar**:
- `AgentInstance`
- `AgentTemplateManifest`
- `ResolvedAgentConfig`
- `CreateAgentInput`
- `UpdateAgentInput`
- `DuplicateAgentInput`
- `LoadAgentInput`

**Critério de aceite**: Todos os tipos exportados e com campos conforme especificado no design.

---

### Task 2: Adicionar funções de API em frontend/src/api/kernel.ts

**Descrição**: Implementar as funções para consumir os endpoints HTTP do módulo de agentes.

**Arquivo-alvo**: `frontend/src/api/kernel.ts`

**Funções a adicionar**:
- `listAgentTemplates()`
- `listAgents()`
- `getAgent(agentId)`
- `createAgent(payload)`
- `updateAgent(agentId, payload)`
- `deleteAgent(agentId)`
- `duplicateAgent(agentId, payload)`
- `activateAgent(agentId)`
- `deactivateAgent(agentId)`
- `loadAgentConfig(agentId, payload?)`

**Critério de aceite**: Todas as funções exportadas e funcionando com os endpoints definidos.

---

### Task 3: Criar hook useAgents.ts

**Descrição**: Criar o hook TanStack Query para gerenciamento de estado e caching das operações de agentes.

**Arquivo-alvo**: `frontend/src/hooks/useAgents.ts`

**Hooks a criar**:
- `useAgentTemplates()`
- `useAgents()`
- `useAgent(agentId)`
- `useAgentConfig(agentId, options?)`
- `useCreateAgent()`
- `useUpdateAgent()`
- `useDeleteAgent()`
- `useDuplicateAgent()`
- `useActivateAgent()`
- `useDeactivateAgent()`

**Critério de aceite**: Hooks funcionando com React Query e invalidando cache apropriadamente.

---

### Task 4: Criar página Agents.tsx

**Descrição**: Implementar a página completa com tabs Templates/Agentes, modais e estilo neon matrix.

**Arquivo-alvo**: `frontend/src/pages/Agents.tsx`

**Componentes a criar**:
- Página Agents com tabs internas
- TemplatesTab - listagem de templates
- AgentsTab - listagem de agentes com ações
- AgentFormModal - criação/edição
- AgentDetailModal - visualização de detalhes
- ConfirmDialog - confirmação de exclusão

**Estilo**: Visual neon matrix (verde/ciano sobre fundo escuro)

**Critério de aceite**: Página funcional com todas as operações CRUD e visualização.

---

### Task 5: Atualizar App.tsx

**Descrição**: Integrar a nova página Agents na tab "Agents" existente.

**Arquivo-alvo**: `frontend/src/App.tsx`

**Alterações**:
- Importar componente Agents
- Substituir AgentTable pela nova página Agents na renderização da tab 'agents'

**Critério de aceite**: Tab "Agents" renderiza a nova página corretamente.

---

### Task 6: Verificar compilação

**Descrição**: Executar verificação de tipos TypeScript para garantir que não há erros.

**Comandos**:
```bash
cd frontend && npx tsc --noEmit
```

**Critério de aceite**: Compilação sem erros TypeScript.

---

## Order de Execução

As tasks DEVEM ser executadas na ordem acima (1 → 6), seguindo o workflow OpenSpec:
1. Cada task obrigatória deve ser marcada com `- [-]` ao iniciar
2. Ao concluir, marcar com `- [x]`
3. Executar verificação de compilação após cada task obrigatória
4. Não avançar para a próxima task sem corrigir erros de compilação

# Frontend Agents Management

Módulo frontend para gerenciamento de agentes do sistema Andromeda. Fornece hooks TanStack Query e funções de API para operações CRUD de agentes, templates e configurações.

## Visão Geral

O módulo `frontend-agents-management` abrange toda a comunicação entre o frontend React e a API de agentes do kernel. Ele permite:

- Listar e buscar templates de agentes disponíveis
- Criar, editar e excluir instâncias de agentes
- Ativar/desativar agentes
- Carregar configurações resolvidas de agentes
- Duplicar agentes existentes

## Estrutura de Arquivos

```
frontend/src/
├── api/kernel.ts         # Funções de API para agentes
├── hooks/useAgents.ts    # Hooks TanStack Query
└── types/kernel.ts       # Tipos TypeScript
```

## Endpoint API Consumidos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/agents/templates` | Lista templates disponíveis |
| GET | `/api/agents` | Lista todas as instâncias de agentes |
| GET | `/api/agents/:id` | Obtém detalhe de um agente |
| POST | `/api/agents` | Cria novo agente |
| PUT | `/api/agents/:id` | Atualiza agente existente |
| DELETE | `/api/agents/:id` | Remove agente (soft delete) |
| POST | `/api/agents/:id/duplicate` | Duplica agente |
| POST | `/api/agents/:id/activate` | Ativa agente |
| POST | `/api/agents/:id/deactivate` | Desativa agente |
| POST | `/api/agents/:id/load` | Carrega configuração resolvida |

## Tipos TypeScript Disponíveis

### AgentInstance

Instância de agente criada pelo usuário.

```typescript
type AgentInstance = {
  id: string;
  name: string;
  slug: string;
  description: string;
  templateId: string;
  sourceTemplateId: string;
  status: 'active' | 'disabled';
  visibility: 'private' | 'team' | 'public';
  role: string;
  goal: string;
  personality: string;
  tone: string;
  responseStyle: string;
  systemInstructions: string[];
  restrictions: string[];
  securityRules: string[];
  defaultLanguage: string;
  tags: string[];
  preferredModel: string | null;
  compatibleModelStrategy: string | null;
  allowedChannels: string[];
  enabledCapabilities: string[];
  overrides: Record<string, unknown>;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};
```

### AgentTemplateManifest

Manifesto de template de agente.

```typescript
type AgentTemplateManifest = {
  templateId: string;
  name: string;
  group: string;
  variant: string;
  version: string;
  status: 'active' | 'disabled' | 'deprecated';
  metadata: Record<string, unknown>;
  config: Record<string, unknown>;
  defaults: {
    operationalParameters: Record<string, unknown>;
  };
  tests: Record<string, unknown>;
  scenarios: Record<string, unknown>;
};
```

### ResolvedAgentConfig

Configuração resolvida do agente (merge de template + overrides).

```typescript
type ResolvedAgentConfig = {
  agentId: string;
  templateId: string;
  sourceTemplateId: string;
  name: string;
  slug: string;
  description: string;
  role: string;
  goal: string;
  personality: string;
  tone: string;
  responseStyle: string;
  systemInstructions: string[];
  restrictions: string[];
  securityRules: string[];
  defaultLanguage: string;
  tags: string[];
  status: 'active' | 'disabled';
  visibility: 'private' | 'team' | 'public';
  preferredModel: string | null;
  compatibleModelStrategy: string | null;
  allowedChannels: string[];
  enabledCapabilities: string[];
  operationalParameters: Record<string, unknown>;
  bindings: {
    provider?: string;
    model?: string;
    channel?: string;
  };
  resolutionTrace: Array<{
    sourceType: 'template' | 'template-defaults' | 'agent-overrides' | 'operational-parameters' | 'bindings';
    sourceId: string;
  }>;
  configHash: string;
};
```

### Tipos de Input

```typescript
type CreateAgentInput = {
  templateId: string;
  name?: string;
  slug?: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  overrides?: AgentOverrides;
  status?: 'active' | 'disabled';
};

type UpdateAgentInput = {
  name?: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  overrides?: AgentOverrides;
  status?: 'active' | 'disabled';
};

type DuplicateAgentInput = {
  name?: string;
  slug?: string;
};

type LoadAgentInput = {
  bindings?: {
    provider?: string;
    model?: string;
    channel?: string;
  };
  operationalParameters?: Record<string, unknown>;
};
```

## Hooks TanStack Query

### Query Hooks

| Hook | Descrição |
|------|-----------|
| `useAgentTemplates()` | Lista todos os templates disponíveis |
| `useAgents()` | Lista todas as instâncias de agentes |
| `useAgent(agentId)` | Obtém detalhe de um agente específico |
| `useAgentConfig(agentId, options?)` | Carrega configuração resolvida do agente |

### Mutation Hooks

| Hook | Descrição |
|------|-----------|
| `useCreateAgent()` | Cria novo agente |
| `useUpdateAgent()` | Atualiza agente existente |
| `useDeleteAgent()` | Remove agente |
| `useDuplicateAgent()` | Duplica agente existente |
| `useActivateAgent()` | Ativa agente |
| `useDeactivateAgent()` | Desativa agente |

## Componentes React

### AgentTable

Componente para exibir tabela de agentes com métricas em tempo real.

```typescript
type AgentTableProps = {
  discoveredAgentIds: string[];
};
```

Localização: `frontend/src/components/AgentTable.tsx`

Exemplo de uso:

```tsx
import { AgentTable } from './components/AgentTable';

function Dashboard() {
  const discoveredAgents = ['agent-001', 'agent-002'];

  return (
    <AgentTable discoveredAgentIds={discoveredAgents} />
  );
}
```

## Exemplo de Uso

### Listando Agentes

```tsx
import { useAgents, useAgentTemplates } from './hooks/useAgents';

function AgentList() {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: templates, isLoading: loadingTemplates } = useAgentTemplates();

  if (loadingAgents || loadingTemplates) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h2>Agentes</h2>
      {agents?.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  );
}
```

### Criando Novo Agente

```tsx
import { useCreateAgent } from './hooks/useAgents';

function CreateAgentForm() {
  const createAgent = useCreateAgent();

  const handleCreate = async () => {
    try {
      const newAgent = await createAgent.mutateAsync({
        templateId: 'codex-assistant-v1',
        name: 'Meu Novo Agente',
        description: 'Agente personalizado',
        visibility: 'private'
      });
      console.log('Agente criado:', newAgent);
    } catch (error) {
      console.error('Erro ao criar agente:', error);
    }
  };

  return (
    <button onClick={handleCreate} disabled={createAgent.isPending}>
      {createAgent.isPending ? 'Criando...' : 'Criar Agente'}
    </button>
  );
}
```

### Ativando/Desativando Agente

```tsx
import { useActivateAgent, useDeactivateAgent } from './hooks/useAgents';

function AgentToggle({ agentId, currentStatus }) {
  const activate = useActivateAgent();
  const deactivate = useDeactivateAgent();

  const handleToggle = async () => {
    if (currentStatus === 'active') {
      await deactivate.mutateAsync(agentId);
    } else {
      await activate.mutateAsync(agentId);
    }
  };

  return (
    <button onClick={handleToggle}>
      {currentStatus === 'active' ? 'Desativar' : 'Ativar'}
    </button>
  );
}
```

### Carregando Configuração Resolvida

```tsx
import { useAgentConfig } from './hooks/useAgents';

function AgentConfigViewer({ agentId }) {
  const { data: config, isLoading } = useAgentConfig(agentId);

  if (isLoading) return <div>Carregando configuração...</div>;

  return (
    <div>
      <h3>{config?.name}</h3>
      <p>Role: {config?.role}</p>
      <p>Goal: {config?.goal}</p>
      <pre>{JSON.stringify(config?.resolutionTrace, null, 2)}</pre>
    </div>
  );
}
```

## Configuração de Cache

| Hook | staleTime | invalidate ao criar/atualizar |
|------|-----------|------------------------------|
| `useAgentTemplates()` | 5 min | queries ['agentTemplates'] |
| `useAgents()` | 30s | queries ['agents'] |
| `useAgent(id)` | - | queries ['agent', id] |
| `useCreateAgent()` | - | queries ['agents'] |
| `useUpdateAgent()` | - | queries ['agents'], ['agent', id] |
| `useDeleteAgent()` | - | queries ['agents'] |
| `useDuplicateAgent()` | - | queries ['agents'] |
| `useActivateAgent()` | - | queries ['agents'], ['agent', id] |
| `useDeactivateAgent()` | - | queries ['agents'], ['agent', id] |

## Ver Também

- [Referência de API](./agents-frontend-api.md) - Detalhamento de cada função de API
---
name: frontend-agents-management
description: Arquitetura de tipos, funções de API, hook TanStack Query e UI da página Agents
---

# Design — Frontend Agents Management

## Arquitetura de Tipos

Os tipos a seguir serão definidos em `frontend/src/types/kernel.ts`:

```typescript
// Agent Instance - instância de agente criada pelo usuário
export type AgentInstance = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role?: string;
  goal?: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  systemInstructions?: string;
  restrictions?: string;
  securityRules?: string;
  defaultLanguage?: string;
  tags?: string[];
  status: 'active' | 'inactive';
  visibility: 'public' | 'private';
  sourceTemplateId?: string;
  preferredModel?: string;
  compatibleModelStrategy?: string;
  allowedChannels?: string[];
  enabledCapabilities?: string[];
  operationalParameters?: Record<string, unknown>;
  configHash?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

// Agent Template Manifest - manifesto de template de agente
export type AgentTemplateManifest = {
  templateId: string;
  name: string;
  group: string;
  variant: string;
  version: string;
  status: 'active' | 'inactive';
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
    icon?: string;
  };
  config: {
    role?: string;
    goal?: string;
    personality?: string;
    tone?: string;
    responseStyle?: string;
    systemInstructions?: string;
    restrictions?: string;
    securityRules?: string;
    defaultLanguage?: string;
    preferredModel?: string;
    compatibleModelStrategy?: string;
    allowedChannels?: string[];
    enabledCapabilities?: string[];
    operationalParameters?: Record<string, unknown>;
  };
  tests?: unknown[];
  scenarios?: unknown[];
};

// Resolved Agent Config - configuração resolvida do agente
export type ResolvedAgentConfig = {
  agentId: string;
  templateId: string;
  name: string;
  slug: string;
  description?: string;
  role: string;
  goal: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  systemInstructions: string;
  restrictions: string;
  securityRules?: string;
  defaultLanguage?: string;
  tags?: string[];
  status: 'active' | 'inactive';
  visibility: 'public' | 'private';
  sourceTemplateId: string;
  preferredModel?: string;
  compatibleModelStrategy?: string;
  allowedChannels?: string[];
  enabledCapabilities?: string[];
  operationalParameters?: Record<string, unknown>;
  resolutionTrace: Array<{
    source: string;
    field: string;
    value: unknown;
  }>;
  configHash: string;
};

// Input para criação de agente
export type CreateAgentInput = {
  templateId: string;
  name: string;
  description?: string;
  role?: string;
  goal?: string;
  personality?: string;
  tone?: string;
  responseStyle?: string;
  systemInstructions?: string;
  restrictions?: string;
  securityRules?: string;
  defaultLanguage?: string;
  tags?: string[];
  visibility?: 'public' | 'private';
  preferredModel?: string;
  compatibleModelStrategy?: string;
  allowedChannels?: string[];
  enabledCapabilities?: string[];
  operationalParameters?: Record<string, unknown>;
};

// Input para atualização de agente
export type UpdateAgentInput = Partial<Omit<CreateAgentInput, 'templateId'>>;

// Input para duplicação de agente
export type DuplicateAgentInput = {
  name: string;
};

// Input para carregamento de configuração resolvida
export type LoadAgentInput = {
  includeTrace?: boolean;
};
```

---

## Funções de API

As funções a seguir serão adicionadas em `frontend/src/api/kernel.ts`:

```typescript
// Listar templates disponíveis
export async function listAgentTemplates(): Promise<AgentTemplateManifest[]> {
  const response = await fetch('/api/agents/templates');
  return parseJson<AgentTemplateManifest[]>(response);
}

// Listar todos os agentes
export async function listAgents(): Promise<AgentInstance[]> {
  const response = await fetch('/api/agents');
  return parseJson<AgentInstance[]>(response);
}

// Obter detalhe de um agente
export async function getAgent(agentId: string): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`);
  return parseJson<AgentInstance>(response);
}

// Criar agente a partir de template
export async function createAgent(payload: CreateAgentInput): Promise<AgentInstance> {
  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson<AgentInstance>(response);
}

// Atualizar agente existente
export async function updateAgent(agentId: string, payload: UpdateAgentInput): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson<AgentInstance>(response);
}

// Deletar agente (soft delete)
export async function deleteAgent(agentId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
    method: 'DELETE'
  });
  return parseJson<{ ok: boolean }>(response);
}

// Duplicar agente
export async function duplicateAgent(agentId: string, payload: DuplicateAgentInput): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson<AgentInstance>(response);
}

// Ativar agente
export async function activateAgent(agentId: string): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/activate`, {
    method: 'POST'
  });
  return parseJson<AgentInstance>(response);
}

// Desativar agente
export async function deactivateAgent(agentId: string): Promise<AgentInstance> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/deactivate`, {
    method: 'POST'
  });
  return parseJson<AgentInstance>(response);
}

// Carregar configuração resolvida
export async function loadAgentConfig(agentId: string, payload?: LoadAgentInput): Promise<ResolvedAgentConfig> {
  const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  return parseJson<ResolvedAgentConfig>(response);
}
```

---

## Hook useAgents

Criar novo hook em `frontend/src/hooks/useAgents.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AgentInstance, AgentTemplateManifest, ResolvedAgentConfig, CreateAgentInput, UpdateAgentInput, DuplicateAgentInput, LoadAgentInput } from '../types/kernel';
import * as api from '../api/kernel';

export function useAgentTemplates() {
  return useQuery({
    queryKey: ['agentTemplates'],
    queryFn: api.listAgentTemplates,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: api.listAgents,
    staleTime: 30 * 1000 // 30 segundos
  });
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => api.getAgent(agentId),
    enabled: !!agentId
  });
}

export function useAgentConfig(agentId: string, options?: LoadAgentInput) {
  return useQuery({
    queryKey: ['agentConfig', agentId, options],
    queryFn: () => api.loadAgentConfig(agentId, options),
    enabled: !!agentId
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAgentInput) => api.createAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, payload }: { agentId: string; payload: UpdateAgentInput }) =>
      api.updateAgent(agentId, payload),
    onSuccess: (_data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    }
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}

export function useDuplicateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, payload }: { agentId: string; payload: DuplicateAgentInput }) =>
      api.duplicateAgent(agentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}

export function useActivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.activateAgent(agentId),
    onSuccess: (_data, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    }
  });
}

export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.deactivateAgent(agentId),
    onSuccess: (_data, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    }
  });
}
```

---

## UI da Página Agents.tsx

A página será criada em `frontend/src/pages/Agents.tsx`:

### Estrutura de Componentes

1. **Tabs internas**: "Templates" | "Agentes"
2. **TemplatesTab**: Lista de templates disponíveis em cards ou tabela
3. **AgentsTab**: Lista de agentes instanciados com ações
4. **AgentDetailModal**: Modal de visualização de detalhes
5. **AgentFormModal**: Modal de criação/edição de agente
6. **ConfirmDialog**: Diálogo de confirmação para exclusão

### Estilo Neon Matrix

- Fundo: `bg-slate-950` ou gradiente radial escuro
- Bordas: `border-cyan-500/30` ou `border-green-500/30`
- Textos: `text-cyan-300`, `text-green-400`
- Buttons: Estilo neon com glow
- Badges: Status com cores distintas (ativo=verde, inativo=amarelo)

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  AGENTS                                    [+ Criar]    │
├─────────────────────────────────────────────────────────┤
│  [ Templates ] [ Agentes ]                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Lista de templates ou agentes conforme tab selecionada │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Templates Tab

- Exibir cards com templateId, name, group, variant, version, status
- Badge de status (active/inactive)
- Ícone de template

### Agents Tab

- Tabela com colunas: Nome, Template, Status, Criado em, Ações
- Ações: Editar, Duplicar, Ativar/Desativar, Carregar Config, Excluir
- Ordenação por coluna
- Busca por nome

### Modais

- **AgentFormModal**: Campos do CreateAgentInput com validação
- **ConfirmDialog**: Pergunta "Tem certeza que deseja excluir este agente?"
- **AgentDetailModal**: Exibe AgentInstance completo + ResolvedAgentConfig

---

## Integração com App.tsx

A tab "Agents" existente em App.tsx será atualizada para renderizar a nova página:

```typescript
import { Agents } from './pages/Agents';

// Em MainApp, substituir:
{/* OLD */}
{tab === 'agents' && (
  <main className="mx-auto max-w-6xl">
    <AgentTable discoveredAgentIds={discoveredAgentIds} />
  </main>
)}

{/* NEW */}
{tab === 'agents' && (
  <main className="mx-auto max-w-6xl">
    <Agents />
  </main>
)}
```

---

## Dependências

- React 18
- TanStack React Query 5
- React Router DOM (já existente)
- Tipos definidos em `frontend/src/types/kernel.ts`
- Funções de API em `frontend/src/api/kernel.ts`
- Hooks em `frontend/src/hooks/useAgents.ts`

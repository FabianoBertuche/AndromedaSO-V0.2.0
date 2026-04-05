# API Reference - Frontend Agents Management

Referência completa das funções de API para gerenciamento de agentes no frontend.

## Índice

1. [List Agent Templates](#listagenttemplates)
2. [List Agents](#listagents)
3. [Get Agent](#getagent)
4. [Create Agent](#createagent)
5. [Update Agent](#updateagent)
6. [Delete Agent](#deleteagent)
7. [Duplicate Agent](#duplicateagent)
8. [Activate Agent](#activateagent)
9. [Deactivate Agent](#deactivateagent)
10. [Load Agent Config](#loadagentconfig)

---

## listAgentTemplates()

Lista todos os templates de agentes disponíveis no sistema.

### Assinatura

```typescript
export async function listAgentTemplates(): Promise<AgentTemplateManifest[]>
```

### Descrição

Busca templates de agentes do backend. Templates definem a estrutura base (role, goal, personality, etc.) que será usada ao criar instâncias de agentes.

### Endpoint

```
GET /api/agents/templates
```

### Exemplo de Uso

```typescript
import { listAgentTemplates } from './api/kernel';

const templates = await listAgentTemplates();

console.log('Templates disponíveis:', templates.map(t => t.name));
// Output: ['Codex Assistant', 'Codex Developer', ...]
```

### Retorno

```typescript
AgentTemplateManifest[] = [
  {
    templateId: string,
    name: string,
    group: string,
    variant: string,
    version: string,
    status: 'active' | 'disabled' | 'deprecated',
    metadata: Record<string, unknown>,
    config: Record<string, unknown>,
    defaults: { operationalParameters: Record<string, unknown> },
    tests: Record<string, unknown>,
    scenarios: Record<string, unknown>
  },
  // ...
]
```

---

## listAgents()

Lista todas as instâncias de agentes criadas no sistema.

### Assinatura

```typescript
export async function listAgents(): Promise<AgentInstance[]>
```

### Descrição

Retorna todas as instâncias de agentes (ativas, desativadas ou em trash). Use `useAgents()` hook para integração com React Query.

### Endpoint

```
GET /api/agents
```

### Exemplo de Uso

```typescript
import { listAgents } from './api/kernel';

const agents = await listAgents();

const activeAgents = agents.filter(a => a.status === 'active');
console.log('Agentes ativos:', activeAgents.length);
```

### Retorno

```typescript
AgentInstance[] = [
  {
    id: string,
    name: string,
    slug: string,
    description: string,
    templateId: string,
    sourceTemplateId: string,
    status: 'active' | 'disabled',
    visibility: 'private' | 'team' | 'public',
    role: string,
    goal: string,
    personality: string,
    tone: string,
    responseStyle: string,
    systemInstructions: string[],
    restrictions: string[],
    securityRules: string[],
    defaultLanguage: string,
    tags: string[],
    preferredModel: string | null,
    compatibleModelStrategy: string | null,
    allowedChannels: string[],
    enabledCapabilities: string[],
    overrides: Record<string, unknown>,
    deletedAt: string | null,
    version: number,
    createdAt: string,
    updatedAt: string
  },
  // ...
]
```

---

## getAgent(agentId)

Obtém os detalhes de um agente específico.

### Assinatura

```typescript
export async function getAgent(agentId: string): Promise<AgentInstance>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID único do agente |

### Endpoint

```
GET /api/agents/:id
```

### Exemplo de Uso

```typescript
import { getAgent } from './api/kernel';

const agent = await getAgent('agent-123');

console.log(`Agente: ${agent.name} (${agent.status})`);
console.log('Role:', agent.role);
console.log('Goal:', agent.goal);
```

### Retorno

`AgentInstance` - Objeto com todos os detalhes do agente.

### Erros Comuns

| Código | Descrição |
|--------|-----------|
| 404 | Agente não encontrado |

---

## createAgent(payload)

Cria uma nova instância de agente a partir de um template.

### Assinatura

```typescript
export async function createAgent(payload: CreateAgentInput): Promise<AgentInstance>
```

### Parâmetros

```typescript
type CreateAgentInput = {
  templateId: string;          // Obrigatório - ID do template base
  name?: string;               // Nome opcional do agente
  slug?: string;               // Slug opcional (URL-friendly)
  description?: string;       // Descrição opcional
  visibility?: 'private' | 'team' | 'public';
  overrides?: AgentOverrides;
  status?: 'active' | 'disabled';
};
```

### Endpoint

```
POST /api/agents
```

### Corpo da Requisição

```json
{
  "templateId": "codex-assistant-v1",
  "name": "Meu Agente",
  "description": "Agente personalizado para tarefas X",
  "visibility": "private",
  "overrides": {
    "role": "Desenvolvedor Expert",
    "goal": "Auxiliar na escrita de código",
    "tags": ["coding", "developer"]
  },
  "status": "active"
}
```

### Exemplo de Uso

```typescript
import { createAgent } from './api/kernel';

const newAgent = await createAgent({
  templateId: 'codex-assistant-v1',
  name: 'Agente Backend',
  description: 'Especialista em API REST',
  visibility: 'team',
  overrides: {
    role: 'Backend Developer',
    goal: 'Criar APIs robustas',
    systemInstructions: [
      'Use TypeScript',
      'Siga SOLID principles'
    ]
  },
  status: 'active'
});

console.log('Agente criado com ID:', newAgent.id);
```

### Retorno

`AgentInstance` - Instância do agente recém-criado.

---

## updateAgent(agentId, payload)

Atualiza um agente existente.

### Assinatura

```typescript
export async function updateAgent(agentId: string, payload: UpdateAgentInput): Promise<AgentInstance>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID do agente a ser atualizado |
| `payload` | `UpdateAgentInput` | Sim | Dados a serem atualizados |

```typescript
type UpdateAgentInput = {
  name?: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  overrides?: AgentOverrides;
  status?: 'active' | 'disabled';
};
```

### Endpoint

```
PUT /api/agents/:id
```

### Exemplo de Uso

```typescript
import { updateAgent } from './api/kernel';

const updated = await updateAgent('agent-123', {
  name: 'Agente Atualizado',
  description: 'Nova descrição',
  overrides: {
    tags: ['updated', 'new-tags']
  }
});

console.log('Agente atualizado:', updated.name);
```

### Retorno

`AgentInstance` - Instância do agente com os novos valores.

---

## deleteAgent(agentId)

Remove um agente (soft delete - move para lixeira).

### Assinatura

```typescript
export async function deleteAgent(agentId: string): Promise<void>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID do agente a ser removido |

### Endpoint

```
DELETE /api/agents/:id
```

### Exemplo de Uso

```typescript
import { deleteAgent } from './api/kernel';

try {
  await deleteAgent('agent-123');
  console.log('Agente movido para lixeira');
} catch (error) {
  console.error('Erro ao deletar:', error.message);
}
```

### Retorno

`void` - Não retorna conteúdo em caso de sucesso (HTTP 204).

### Notas

- Soft delete: o agente não é permanentemente removido, apenas marcado com `deletedAt`.
- A listagem padrão (`listAgents()`) não retorna agentes deletados.

---

## duplicateAgent(agentId, payload?)

Duplica um agente existente criando uma nova instância com os mesmos valores.

### Assinatura

```typescript
export async function duplicateAgent(agentId: string, payload?: DuplicateAgentInput): Promise<AgentInstance>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID do agente a ser duplicado |
| `payload` | `DuplicateAgentInput` | Não | Novos valores opcionais |

```typescript
type DuplicateAgentInput = {
  name?: string;    // Novo nome para a cópia
  slug?: string;    // Novo slug opcional
};
```

### Endpoint

```
POST /api/agents/:id/duplicate
```

### Corpo da Requisição (opcional)

```json
{
  "name": "Cópia do Agente Original",
  "slug": "copia-agente"
}
```

### Exemplo de Uso

```typescript
import { duplicateAgent } from './api/kernel';

const original = await getAgent('agent-123');

const copy = await duplicateAgent(original.id, {
  name: `${original.name} - Cópia`,
  slug: `${original.slug}-copy`
});

console.log('Novo agente criado:', copy.id);
```

### Retorno

`AgentInstance` - Nova instância do agente duplicado.

---

## activateAgent(agentId)

Ativa um agente desabilitado.

### Assinatura

```typescript
export async function activateAgent(agentId: string): Promise<AgentInstance>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID do agente a ser ativado |

### Endpoint

```
POST /api/agents/:id/activate
```

### Exemplo de Uso

```typescript
import { activateAgent } from './api/kernel';

const activated = await activateAgent('agent-123');
console.log('Status:', activated.status); // 'active'
```

### Retorno

`AgentInstance` - Instância do agente com status atualizado para `active`.

---

## deactivateAgent(agentId)

Desativa um agente ativo.

### Assinatura

```typescript
export async function deactivateAgent(agentId: string): Promise<AgentInstance>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID do agente a ser desativado |

### Endpoint

```
POST /api/agents/:id/deactivate
```

### Exemplo de Uso

```typescript
import { deactivateAgent } from './api/kernel';

const deactivated = await deactivateAgent('agent-123');
console.log('Status:', deactivated.status); // 'disabled'
```

### Retorno

`AgentInstance` - Instância do agente com status atualizado para `disabled`.

---

## loadAgentConfig(agentId, payload?)

Carrega a configuração resolvida de um agente, mesclando template + defaults + overrides.

### Assinatura

```typescript
export async function loadAgentConfig(agentId: string, payload?: LoadAgentInput): Promise<ResolvedAgentConfig>
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|--------------|------------|
| `agentId` | `string` | Sim | ID do agente |
| `payload` | `LoadAgentInput` | Não | Bindings e parâmetros operacionais opcionais |

```typescript
type LoadAgentInput = {
  bindings?: {
    provider?: string;
    model?: string;
    channel?: string;
  };
  operationalParameters?: Record<string, unknown>;
};
```

### Endpoint

```
POST /api/agents/:id/load
```

### Corpo da Requisição (exemplo)

```json
{
  "bindings": {
    "provider": "openai",
    "model": "gpt-4-turbo"
  },
  "operationalParameters": {
    "maxTokens": 4000,
    "temperature": 0.7
  }
}
```

### Exemplo de Uso

```typescript
import { loadAgentConfig } from './api/kernel';

const config = await loadAgentConfig('agent-123', {
  bindings: {
    provider: 'openai',
    model: 'gpt-4-turbo'
  },
  operationalParameters: {
    maxTokens: 4000
  }
});

console.log('Configuração resolvida:');
console.log('- Role:', config.role);
console.log('- Goal:', config.goal);
console.log('- Provider:', config.bindings?.provider);
console.log('- Hash:', config.configHash);
```

### Retorno

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

### Para Que Serve

- Debugging: ver exatamente quais valores foram resolvidos de cada fonte
- Validação: confirmar se overrides foram aplicados corretamente
- Integração: preparar configuração para envio a outros serviços

---

## Ver Também

- [Visão Geral do Módulo](./agents-frontend.md) - Documentação principal com hooks e componentes
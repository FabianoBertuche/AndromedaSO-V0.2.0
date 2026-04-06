---
name: agent-tabs-components
description: Tasks ordenadas para implementação dos componentes reutilizáveis de tabs de agentes
---

# Tasks — Agent Tabs Components

## Task List

- [ ] 1. Criar tipos compartilhados em frontend/src/types/ui.ts
- [ ] 2. Criar diretório de componentes e arquivo de utilitários
- [ ] 3. Implementar FormSection.tsx
- [ ] 4. Implementar FormSectionHeader.tsx
- [ ] 5. Implementar JSONEditor.tsx
- [ ] 6. Implementar RetryPolicyForm.tsx
- [ ] 7. Implementar AuditMetadataDisplay.tsx
- [ ] 8. Criar arquivo de exportação index.ts
- [ ] 9. Verificar compilação TypeScript

---

## Task Details

### Task 1: Criar tipos compartilhados em frontend/src/types/ui.ts

**Descrição**: Criar arquivo de tipos compartilhados usados pelos componentes de agentes.

**Arquivo-alvo**: `frontend/src/types/ui.ts`

**Tipos a adicionar**:
```typescript
export type ValidationError = {
  message: string;
  severity?: 'error' | 'warning';
};

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';

export type RetryPolicy = {
  maxRetries: number;
  delay: number;
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
};

export type AuditMetadata = {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version: number;
};

export type JSONSchema = {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
};
```

**Critério de aceite**: Tipos exportados e disponíveis para importação.

---

### Task 2: Criar diretório de componentes e arquivo de utilitários

**Descrição**: Criar estrutura de diretórios e verificar disponibilidade de utilitários.

**Comandos**:
```bash
mkdir -p frontend/src/components/agents
```

**Verificações**:
- Confirmar que `frontend/src/lib/utils.ts` existe e exporta função `cn`
- Se não existir, criar utilitário básico:

```typescript
// frontend/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Critério de aceite**: Diretório criado e utilitários disponíveis.

---

### Task 3: Implementar FormSection.tsx

**Descrição**: Implementar componente container para seções de formulário.

**Arquivo-alvo**: `frontend/src/components/agents/FormSection.tsx`

**Código conforme design.md** (copiar da seção "Componente 1: FormSection")

**Critério de aceite**: 
- Componente compila sem erros
- Props funcionam conforme especificado
- Estilos aplicados corretamente
- Indicador de erro funciona

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 4: Implementar FormSectionHeader.tsx

**Descrição**: Implementar componente de cabeçalho para seções.

**Arquivo-alvo**: `frontend/src/components/agents/FormSectionHeader.tsx`

**Código conforme design.md** (copiar da seção "Componente 2: FormSectionHeader")

**Critério de aceite**:
- Componente compila sem erros
- Props de ícone, badge e ações funcionam
- Variantes de badge renderizam cores corretas
- Estilos neon aplicados

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 5: Implementar JSONEditor.tsx

**Descrição**: Implementar editor de JSON com validação.

**Arquivo-alvo**: `frontend/src/components/agents/JSONEditor.tsx`

**Código conforme design.md** (copiar da seção "Componente 3: JSONEditor")

**Critério de aceite**:
- Componente compila sem erros
- Validação JSON em tempo real funciona
- Botão de formatar funciona
- Atalho Ctrl+Enter funciona
- Estados de erro exibem mensagens

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 6: Implementar RetryPolicyForm.tsx

**Descrição**: Implementar formulário de configuração de política de retry.

**Arquivo-alvo**: `frontend/src/components/agents/RetryPolicyForm.tsx`

**Código conforme design.md** (copiar da seção "Componente 4: RetryPolicyForm")

**Critério de aceite**:
- Componente compila sem erros
- Campos numéricos validam range
- Select de estratégia funciona
- Adicionar/remover erros retryáveis funciona
- Preview da política atualiza dinamicamente
- Campos desabilitam quando maxRetries=0

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 7: Implementar AuditMetadataDisplay.tsx

**Descrição**: Implementar componente de exibição de metadados de auditoria.

**Arquivo-alvo**: `frontend/src/components/agents/AuditMetadataDisplay.tsx`

**Código conforme design.md** (copiar da seção "Componente 5: AuditMetadataDisplay")

**Critério de aceite**:
- Componente compila sem erros
- Variantes row, badges e compact funcionam
- Formatação de datas em pt-BR
- Versão exibida conforme showVersion
- Cores do tema neon aplicadas

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 8: Criar arquivo de exportação index.ts

**Descrição**: Criar arquivo de barrel exports para facilitar importação dos componentes.

**Arquivo-alvo**: `frontend/src/components/agents/index.ts`

**Conteúdo**:
```typescript
export { FormSection } from './FormSection.js';
export { FormSectionHeader } from './FormSectionHeader.js';
export { JSONEditor } from './JSONEditor.js';
export { RetryPolicyForm } from './RetryPolicyForm.js';
export { AuditMetadataDisplay } from './AuditMetadataDisplay.js';

export type {
  FormSectionProps,
  FormSectionHeaderProps,
  BadgeVariant,
  JSONEditorProps,
  JSONSchema,
  RetryPolicyFormProps,
  RetryPolicy,
  BackoffStrategy,
  AuditMetadataDisplayProps,
  AuditMetadata,
  ValidationError
} from '../../types/ui.js';
```

**Critério de aceite**: Todas as exportações funcionam corretamente.

---

### Task 9: Verificar compilação TypeScript

**Descrição**: Executar verificação completa de tipos TypeScript.

**Comandos**:
```bash
cd frontend && npx tsc --noEmit
```

**Critério de aceite**: 
- Compilação sem erros TypeScript
- Todos os componentes exportados corretamente
- Tipos resolvidos sem conflitos

---

## Ordem de Execução

As tasks DEVEM ser executadas na ordem acima (1 → 9), seguindo o workflow SDD:

1. Cada task obrigatória deve ser marcada com `- [-]` ao iniciar
2. Ao concluir, marcar com `- [x]`
3. Executar verificação de compilação após cada task obrigatória
4. Não avançar para a próxima task sem corrigir erros de compilação

## Convenções Importantes

- **Imports locais com extensão `.js`** (ESM obrigatório)
- **Sem `console.log`** — usar logger apropriado se necessário
- **TailwindCSS classes** seguindo tema neon matrix
- **Sem bibliotecas de UI externas**
- **Tipos TypeScript explícitos** em todas as props

## Teste Manual Sugerido

Após concluir todas as tasks, testar os componentes criando uma página temporária:

```typescript
// Test page (temporário, não incluir no commit)
import {
  FormSection,
  FormSectionHeader,
  JSONEditor,
  RetryPolicyForm,
  AuditMetadataDisplay
} from './components/agents';

function TestComponents() {
  return (
    <div className="p-8 space-y-6">
      {/* Teste de cada componente aqui */}
    </div>
  );
}
```

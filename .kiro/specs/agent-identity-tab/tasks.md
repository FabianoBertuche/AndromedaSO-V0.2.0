---
name: agent-identity-tab
description: Tasks ordenadas para implementação da tab Identity com ~34 campos canônicos
---

# Tasks — Agent Identity Tab

## Task List

- [ ] 1. Criar diretório para tabs de agentes
- [ ] 2. Criar arquivo IdentityTab.tsx com estrutura base
- [ ] 3. Implementar Seção 1: Identidade (9 campos)
- [ ] 4. Implementar Seção 2: Origem e Template (10 campos)
- [ ] 5. Implementar Seção 3: Papel e Objetivo (5 campos)
- [ ] 6. Implementar Seção 4: Governança e Edição (6 campos)
- [ ] 7. Implementar Seção 5: Ciclo de Vida (8 campos)
- [ ] 8. Implementar componente ChipInput auxiliar
- [ ] 9. Adicionar função utilitária formatDate
- [ ] 10. Verificar compilação TypeScript
- [ ]* 11. Criar arquivo de exportação index.ts para tabs
- [ ]* 12. Integrar IdentityTab na página Agents.tsx

---

## Task Details

### Task 1: Criar diretório para tabs de agentes

**Descrição**: Criar estrutura de diretórios para organizar as tabs de agentes.

**Comando**:
```bash
mkdir -p frontend/src/components/agents/tabs
```

**Critério de aceite**: Diretório criado e acessível.

---

### Task 2: Criar arquivo IdentityTab.tsx com estrutura base

**Descrição**: Criar arquivo base da IdentityTab com imports, tipos e estrutura inicial.

**Arquivo-alvo**: `frontend/src/components/agents/tabs/IdentityTab.tsx`

**Estrutura inicial**:
```typescript
import { useCallback } from 'react';
import { 
  Fingerprint, 
  GitBranch, 
  Target, 
  Shield, 
  Clock 
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import { AuditMetadataDisplay } from '../AuditMetadataDisplay.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type IdentityTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function IdentityTab({ agent, onChange, readOnly = false, disabled = false }: IdentityTabProps) {
  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback((field: keyof AgentInstance, value: unknown) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  return (
    <div className="space-y-8">
      {/* Seções serão implementadas nas próximas tasks */}
    </div>
  );
}
```

**Critério de aceite**:
- Arquivo criado com estrutura base
- Imports corretos
- Props tipadas corretamente
- Componente exportado

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 3: Implementar Seção 1: Identidade (9 campos)

**Descrição**: Implementar a seção de Identidade com todos os 9 campos.

**Campos a implementar**:
1. `id` (string, read-only)
2. `name` (string, obrigatório)
3. `slug` (string, obrigatório)
4. `shortDescription` (string, textarea)
5. `longDescription` (string, textarea)
6. `owner` (string)
7. `source` (string)
8. `version` (string)
9. `status` (enum, select)

**Layout**: Grid 2 colunas, descrições em full-width

**Código conforme design.md** (copiar da seção "Seção 1: Identidade")

**Critério de aceite**:
- Todos os 9 campos presentes
- Campos obrigatórios marcados com *
- ID em modo read-only
- Descrições em textarea multilinha
- Status em select dropdown
- Estilos aplicados corretamente

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 4: Implementar Seção 2: Origem e Template (10 campos)

**Descrição**: Implementar a seção de Origem e Template com todos os 10 campos.

**Campos a implementar**:
1. `isTemplateDerived` (boolean, read-only/info)
2. `templateId` (string \| null, read-only)
3. `templateSource` (string \| null, read-only)
4. `templateVariant` (string \| null, read-only)
5. `templateManifestRef` (string \| null, read-only)
6. `originTemplateVersion` (string \| null, read-only)
7. `templateDefaultsSnapshot` (object \| null, JSON read-only)
8. `templateInheritanceMode` (enum, select)
9. `templateLockPolicy` (enum, select)
10. `cloneOfAgentId` (string \| null, read-only, conditional)

**Código conforme design.md** (copiar da seção "Seção 2: Origem e Template")

**Critério de aceite**:
- Todos os 10 campos presentes
- Campos de template em modo read-only
- Selects para inheritanceMode e lockPolicy
- Snapshot em textarea JSON formatado
- cloneOfAgentId exibido condicionalmente
- Badge indicando "Derivado" ou "Manual"

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 5: Implementar Seção 3: Papel e Objetivo (5 campos)

**Descrição**: Implementar a seção de Papel e Objetivo com todos os 5 campos.

**Campos a implementar**:
1. `role` (string, obrigatório, destaque visual)
2. `domain` (string)
3. `mission` (string, textarea)
4. `objective` (string, obrigatório, textarea, destaque visual)
5. `successCriteria` (array, chip input)

**Destaque visual**: Borda lateral cyan (`border-l-4 border-cyan-500 pl-3`) em campos críticos

**Código conforme design.md** (copiar da seção "Seção 3: Papel e Objetivo")

**Critério de aceite**:
- Todos os 5 campos presentes
- role e objective com destaque visual (borda lateral)
- Campos obrigatórios marcados com *
- successCriteria em chip input funcional
- mission e objective em textarea

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 6: Implementar Seção 4: Governança e Edição (6 campos)

**Descrição**: Implementar a seção de Governança e Edição com todos os 6 campos.

**Campos a implementar**:
1. `isActive` (boolean, toggle switch)
2. `isEditable` (boolean, toggle switch)
3. `visibility` (enum, select)
4. `tags` (array, chip input)
5. `categories` (array, chip input)
6. `auditMetadata` (object, AuditMetadataDisplay)

**Código conforme design.md** (copiar da seção "Seção 4: Governança e Edição")

**Critério de aceite**:
- Todos os 6 campos presentes
- Toggle switches para isActive e isEditable
- Select para visibility
- Chip inputs para tags e categories
- AuditMetadataDisplay no rodapé da seção

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 7: Implementar Seção 5: Ciclo de Vida (8 campos)

**Descrição**: Implementar a seção de Ciclo de Vida com todos os 8 campos.

**Campos a implementar**:
1. `originType` (enum, read-only)
2. `configSnapshotVersion` (number, read-only)
3. `createdAt` (datetime, read-only)
4. `updatedAt` (datetime, read-only)
5. `activatedAt` (datetime \| null, read-only, conditional)
6. `deactivatedAt` (datetime \| null, read-only, conditional)
7. `isDeleted` (boolean, badge, conditional)
8. `deletedAt` (datetime \| null, read-only, conditional)

**Código conforme design.md** (copiar da seção "Seção 5: Ciclo de Vida")

**Critério de aceite**:
- Todos os 8 campos presentes
- Todos em modo read-only
- Campos nulos exibidos como "-"
- Datas formatadas em pt-BR
- Campos condicionais (activatedAt, deactivatedAt, isDeleted, deletedAt) só exibidos quando tiverem valor
- Badge "Excluído" em vermelho quando isDeleted for true

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 8: Implementar componente ChipInput auxiliar

**Descrição**: Implementar componente interno ChipInput para campos de array (tags, categories, successCriteria).

**Localização**: Dentro do mesmo arquivo IdentityTab.tsx (função auxiliar)

**Interface**:
```typescript
interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**Funcionalidades**:
- Exibir valores como chips/tags
- Permitir adicionar novo valor pressionando Enter
- Permitir remover valor clicando no ×
- Suportar remoção via Backspace quando input vazio
- Estilos neon (bg-cyan-500/20, text-cyan-100)

**Código conforme design.md** (copiar da seção "Componente de Chip Input")

**Critério de aceite**:
- Componente funcional
- Adicionar/remover chips funcionando
- Estilos aplicados
- Suporte a disabled state

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 9: Adicionar função utilitária formatDate

**Descrição**: Implementar função auxiliar para formatação de datas no padrão pt-BR.

**Localização**: Dentro do mesmo arquivo IdentityTab.tsx (função auxiliar)

**Código**:
```typescript
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
```

**Critério de aceite**:
- Função presente no arquivo
- Retorna "-" para valores nulos
- Formato pt-BR correto
- Usado em todos os campos de data

**Verificação**:
```bash
cd frontend && npx tsc --noEmit
```

---

### Task 10: Verificar compilação TypeScript

**Descrição**: Executar verificação completa de tipos TypeScript para todo o componente.

**Comando**:
```bash
cd frontend && npx tsc --noEmit
```

**Critério de aceite**:
- Compilação sem erros TypeScript
- Todos os imports resolvidos
- Tipos compatíveis com AgentInstance

---

### Task 11*: Criar arquivo de exportação index.ts para tabs (OPCIONAL)

**Descrição**: Criar arquivo de barrel exports para facilitar importação das tabs.

**Arquivo-alvo**: `frontend/src/components/agents/tabs/index.ts`

**Conteúdo**:
```typescript
export { IdentityTab } from './IdentityTab.js';
export type { IdentityTabProps } from './IdentityTab.js';
```

**Critério de aceite**: Exportações funcionam corretamente.

---

### Task 12*: Integrar IdentityTab na página Agents.tsx (OPCIONAL)

**Descrição**: Integrar o componente IdentityTab na página de gestão de agentes.

**Contexto**: Esta task depende da estrutura de edição de agentes já existir na página Agents.tsx. Se ainda não existir estrutura de tabs na página, esta task pode ser adiada.

**Exemplo de integração**:
```typescript
// Em Agents.tsx ou componente de modal de edição
import { IdentityTab } from '../components/agents/tabs/IdentityTab.js';

// No render do modal de edição
{activeTab === 'identity' && (
  <IdentityTab
    agent={selectedAgent}
    onChange={handleAgentChange}
  />
)}
```

**Critério de aceite**: IdentityTab renderizada e funcional na interface.

---

## Ordem de Execução

As tasks DEVEM ser executadas na ordem acima (1 → 10 obrigatórias, 11-12 opcionais), seguindo o workflow SDD:

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
- **Campos obrigatórios** marcados com asterisco cyan
- **Campos read-only** com estilo visual distinto (bg-slate-900/50, text-slate-400)

## Resumo de Campos por Seção

| Seção | Campos | Implementados |
|-------|--------|---------------|
| 1. Identidade | 9 | id, name, slug, shortDescription, longDescription, owner, source, version, status |
| 2. Origem e Template | 10 | templateId, isTemplateDerived, templateSource, templateVariant, templateManifestRef, originTemplateVersion, templateDefaultsSnapshot, templateInheritanceMode, templateLockPolicy, cloneOfAgentId |
| 3. Papel e Objetivo | 5 | role, mission, domain, objective, successCriteria |
| 4. Governança e Edição | 6 | isActive, isEditable, visibility, tags, categories, auditMetadata |
| 5. Ciclo de Vida | 8 | originType, cloneOfAgentId*, isDeleted, deletedAt, activatedAt, deactivatedAt, createdAt, updatedAt, configSnapshotVersion |

*Nota: cloneOfAgentId aparece em ambas seções 2 e 5, mas é o mesmo campo

**Total: ~34 campos canônicos implementados**

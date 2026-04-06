---
name: agent-identity-tab
description: Arquitetura de tipos, layout em grid, componentes UI, estados e handlers para a tab Identity
---

# Design — Agent Identity Tab

## Visão Geral da Arquitetura

A Identity Tab é um componente React que renderiza um formulário organizado em 5 seções, cada uma agrupando campos canônicos relacionados. O componente segue o padrão de controlled component, recebendo o agente atual e callbacks de alteração via props.

```
frontend/src/components/agents/tabs/
└── IdentityTab.tsx
```

---

## Interface de Props

```typescript
// frontend/src/components/agents/tabs/IdentityTab.tsx
import type { AgentInstance } from '../../../types/kernel.js';

export type IdentityTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};
```

---

## Layout Visual

### Estrutura de Container

```
┌─────────────────────────────────────────────────────────────────┐
│  IDENTITY TAB                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Seção: Identidade ─────────────────────────────────────┐   │
│  │ Grid 2 colunas                                          │   │
│  │ [id][read-only] [name][required]                        │   │
│  │ [slug][required] [version]                              │   │
│  │ [shortDescription][textarea, full-width]                │   │
│  │ [longDescription][textarea, full-width]                 │   │
│  │ [owner][source][status]                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Seção: Origem e Template ──────────────────────────────┐   │
│  │ [isTemplateDerived][checkbox] [templateId][read-only]   │   │
│  │ [templateSource][templateVariant]                       │   │
│  │ [templateInheritanceMode][select] [templateLockPolicy]   │   │
│  │ [originTemplateVersion][templateManifestRef]            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Seção: Papel e Objetivo ───────────────────────────────┐   │
│  │ [role][required] [domain]                               │   │
│  │ [mission][textarea, full-width]                         │   │
│  │ [objective][required][textarea, full-width]             │   │
│  │ [successCriteria][chips]                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Seção: Governança e Edição ────────────────────────────┐   │
│  │ [isActive][toggle] [isEditable][toggle]                 │   │
│  │ [visibility][select]                                    │   │
│  │ [tags][chips] [categories][chips]                         │   │
│  │ [AuditMetadataDisplay]                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Seção: Ciclo de Vida ──────────────────────────────────┐   │
│  │ [originType][read-only] [configSnapshotVersion]           │   │
│  │ [createdAt][updatedAt][read-only]                         │   │
│  │ [activatedAt][deactivatedAt][read-only, conditional]    │   │
│  │ [isDeleted][badge] [deletedAt][read-only, conditional]    │   │
│  │ [cloneOfAgentId][read-only, conditional]                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Seção 1: Identidade

### Componente de Layout

```typescript
// Exemplo de estrutura da seção Identidade
<div className="space-y-6">
  <FormSectionHeader
    title="Identidade"
    icon={Fingerprint}
    description="Informações básicas de identificação do agente"
  />
  
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* Campos de identidade */}
  </div>
</div>
```

### Mapeamento de Campos

| Campo | Tipo UI | Configuração | Largura |
|-------|---------|--------------|---------|
| `id` | text input | readOnly: true | col-span-1 |
| `name` | text input | required: true, placeholder: "Nome do agente" | col-span-1 |
| `slug` | text input | required: true, placeholder: "identificador-amigavel" | col-span-1 |
| `version` | text input | placeholder: "1.0.0" | col-span-1 |
| `shortDescription` | textarea | rows: 2, placeholder: "Resumo curto..." | col-span-2 |
| `longDescription` | textarea | rows: 4, placeholder: "Descrição detalhada..." | col-span-2 |
| `owner` | text input | placeholder: "system" | col-span-1 |
| `source` | text input | placeholder: "manual" | col-span-1 |
| `status` | select | options: ['draft', 'active', 'inactive', 'archived', 'deleted'] | col-span-1 |

### Estilos TailwindCSS

```typescript
const sectionClasses = 'space-y-6';
const gridClasses = 'grid grid-cols-1 lg:grid-cols-2 gap-4';
const fullWidthClasses = 'lg:col-span-2';
const inputClasses = 'w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
const textareaClasses = `${inputClasses} min-h-[80px] resize-y`;
const labelClasses = 'text-sm font-medium text-slate-200';
const requiredMarkerClasses = 'ml-1 text-cyan-400';
const readOnlyClasses = 'bg-slate-900/50 text-slate-400 cursor-not-allowed';
```

---

## Seção 2: Origem e Template

### Regras de Exibição

- Esta seção DEVE ser sempre renderizada, mas campos vazios podem ser ocultados ou exibidos com valor "-"
- Quando `isTemplateDerived` for false, os campos de template DEVEM ser visualmente desabilitados

### Mapeamento de Campos

| Campo | Tipo UI | Configuração | Largura |
|-------|---------|--------------|---------|
| `isTemplateDerived` | checkbox toggle | readOnly: true (informativo) | col-span-1 |
| `templateId` | text input | readOnly: true | col-span-1 |
| `templateSource` | text input | readOnly: true | col-span-1 |
| `templateVariant` | text input | readOnly: true | col-span-1 |
| `templateManifestRef` | text input | readOnly: true | col-span-1 |
| `originTemplateVersion` | text input | readOnly: true | col-span-1 |
| `templateInheritanceMode` | select | options: ['copy-on-create', 'linked-metadata'] | col-span-1 |
| `templateLockPolicy` | select | options: ['none', 'future', 'strict'] | col-span-1 |
| `templateDefaultsSnapshot` | JSON textarea | readOnly: true, rows: 4 | col-span-2 |
| `cloneOfAgentId` | text input | readOnly: true, conditional (se não null) | col-span-1 |

---

## Seção 3: Papel e Objetivo

### Destaque de Campos Críticos

Os campos `role` e `objective` são críticos e DEVEM ter destaque visual:

```typescript
const criticalFieldClasses = 'border-l-4 border-l-cyan-500 pl-3';
```

### Mapeamento de Campos

| Campo | Tipo UI | Configuração | Largura |
|-------|---------|--------------|---------|
| `role` | text input | required: true, critical: true | col-span-1 |
| `domain` | text input | placeholder: "general" | col-span-1 |
| `mission` | textarea | rows: 2, placeholder: "Missão resumida..." | col-span-2 |
| `objective` | textarea | required: true, rows: 3, critical: true | col-span-2 |
| `successCriteria` | chip input | placeholder: "Adicionar critério..." | col-span-2 |

### Componente de Chip Input

```typescript
// Interface para chip input (arrays de strings)
interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Renderização
<div className="flex flex-wrap gap-2 items-center min-h-[2.5rem] p-2 rounded border border-slate-700 bg-slate-950/70">
  {values.map((value, index) => (
    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-100 text-sm">
      {value}
      <button onClick={() => removeChip(index)} className="text-cyan-300 hover:text-cyan-100">×</button>
    </span>
  ))}
  <input
    type="text"
    placeholder={placeholder}
    className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none min-w-[120px]"
    onKeyDown={handleKeyDown}
  />
</div>
```

---

## Seção 4: Governança e Edição

### Toggle Switch para Booleanos

```typescript
// Toggle switch para isActive e isEditable
<label className="flex items-center gap-3 cursor-pointer">
  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-slate-700'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </div>
  <span className="text-sm text-slate-300">{label}</span>
</label>
```

### Mapeamento de Campos

| Campo | Tipo UI | Configuração | Largura |
|-------|---------|--------------|---------|
| `isActive` | toggle switch | label: "Agente ativo" | col-span-1 |
| `isEditable` | toggle switch | label: "Permitir edição" | col-span-1 |
| `visibility` | select | options: ['private', 'internal', 'public'] | col-span-1 |
| `tags` | chip input | placeholder: "Adicionar tag..." | col-span-2 |
| `categories` | chip input | placeholder: "Adicionar categoria..." | col-span-2 |
| `auditMetadata` | AuditMetadataDisplay | variant: 'compact' | col-span-2 |

---

## Seção 5: Ciclo de Vida

### Formatação de Datas

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

### Exibição Condicional

```typescript
// Campos só exibidos quando tiverem valor
{agent.activatedAt && (
  <div className="...">
    <Label>Ativado em</Label>
    <ReadOnlyField value={formatDate(agent.activatedAt)} />
  </div>
)}

{agent.isDeleted && (
  <div className="...">
    <Badge variant="error">Excluído</Badge>
    <ReadOnlyField value={formatDate(agent.deletedAt)} />
  </div>
)}
```

### Mapeamento de Campos

| Campo | Tipo UI | Configuração | Largura | Condicional |
|-------|---------|--------------|---------|-------------|
| `originType` | text input | readOnly: true | col-span-1 | Não |
| `configSnapshotVersion` | number input | readOnly: true | col-span-1 | Não |
| `createdAt` | read-only text | formatted date | col-span-1 | Não |
| `updatedAt` | read-only text | formatted date | col-span-1 | Não |
| `activatedAt` | read-only text | formatted date | col-span-1 | Sim (se não null) |
| `deactivatedAt` | read-only text | formatted date | col-span-1 | Sim (se não null) |
| `isDeleted` | badge | variant: 'error' | col-span-1 | Sim (se true) |
| `deletedAt` | read-only text | formatted date | col-span-1 | Sim (se não null) |
| `cloneOfAgentId` | read-only text | - | col-span-2 | Sim (se não null) |

---

## Implementação Completa

```typescript
// frontend/src/components/agents/tabs/IdentityTab.tsx
import { useCallback } from 'react';
import { 
  Fingerprint, 
  GitBranch, 
  Target, 
  Shield, 
  Clock,
  User,
  Tag,
  Folder
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
      {/* Seção 1: Identidade */}
      <FormSection
        title="Identidade"
        description="Informações básicas de identificação do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Dados Principais"
            icon={Fingerprint}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ID (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">ID</label>
            <input
              type="text"
              value={agent.id}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-200">
              Nome <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={isDisabled}
              placeholder="Nome do agente"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-200">
              Slug <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.slug}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
              disabled={isDisabled}
              placeholder="identificador-amigavel"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Version */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão</label>
            <input
              type="text"
              value={agent.version}
              onChange={(e) => handleFieldChange('version', e.target.value)}
              disabled={isDisabled}
              placeholder="1.0.0"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Short Description */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Descrição Curta</label>
            <textarea
              value={agent.shortDescription}
              onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
              disabled={isDisabled}
              rows={2}
              placeholder="Resumo curto para listagens..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Long Description */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Descrição Detalhada</label>
            <textarea
              value={agent.longDescription}
              onChange={(e) => handleFieldChange('longDescription', e.target.value)}
              disabled={isDisabled}
              rows={4}
              placeholder="Descrição detalhada do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Owner */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Proprietário</label>
            <input
              type="text"
              value={agent.owner}
              onChange={(e) => handleFieldChange('owner', e.target.value)}
              disabled={isDisabled}
              placeholder="system"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Source */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Origem</label>
            <input
              type="text"
              value={agent.source}
              onChange={(e) => handleFieldChange('source', e.target.value)}
              disabled={isDisabled}
              placeholder="manual"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <select
              value={agent.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="archived">Arquivado</option>
              <option value="deleted">Excluído</option>
            </select>
          </div>
        </div>
      </FormSection>

      {/* Seção 2: Origem e Template */}
      <FormSection
        title="Origem e Template"
        description="Informações sobre o template de origem e herança"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Vínculo com Template"
            icon={GitBranch}
            badge={agent.isTemplateDerived ? { text: 'Derivado', variant: 'info' } : { text: 'Manual', variant: 'success' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Template ID */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">ID do Template</label>
            <input
              type="text"
              value={agent.templateId || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Source */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Origem do Template</label>
            <input
              type="text"
              value={agent.templateSource || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Variant */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Variante do Template</label>
            <input
              type="text"
              value={agent.templateVariant || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Origin Template Version */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão do Template</label>
            <input
              type="text"
              value={agent.originTemplateVersion || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Inheritance Mode */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Modo de Herança</label>
            <select
              value={agent.templateInheritanceMode}
              onChange={(e) => handleFieldChange('templateInheritanceMode', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="copy-on-create">Copiar na Criação</option>
              <option value="linked-metadata">Metadados Vinculados</option>
            </select>
          </div>

          {/* Template Lock Policy */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Política de Travamento</label>
            <select
              value={agent.templateLockPolicy}
              onChange={(e) => handleFieldChange('templateLockPolicy', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="none">Nenhuma</option>
              <option value="future">Futura</option>
              <option value="strict">Estrita</option>
            </select>
          </div>

          {/* Template Defaults Snapshot */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Snapshot dos Defaults</label>
            <textarea
              value={agent.templateDefaultsSnapshot ? JSON.stringify(agent.templateDefaultsSnapshot, null, 2) : '-'}
              readOnly
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-xs text-slate-400 cursor-not-allowed font-mono resize-y"
            />
          </div>

          {/* Clone Of Agent ID (conditional) */}
          {agent.cloneOfAgentId && (
            <div className="lg:col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-300">Clone do Agente</label>
              <input
                type="text"
                value={agent.cloneOfAgentId}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </FormSection>

      {/* Seção 3: Papel e Objetivo */}
      <FormSection
        title="Papel e Objetivo"
        description="Definição do propósito e função do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Propósito Funcional"
            icon={Target}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Role */}
          <div className="space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Papel <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.role}
              onChange={(e) => handleFieldChange('role', e.target.value)}
              disabled={isDisabled}
              placeholder="Ex: Assistente de Suporte"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Domain */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Domínio</label>
            <input
              type="text"
              value={agent.domain}
              onChange={(e) => handleFieldChange('domain', e.target.value)}
              disabled={isDisabled}
              placeholder="general"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Mission */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Missão</label>
            <textarea
              value={agent.mission}
              onChange={(e) => handleFieldChange('mission', e.target.value)}
              disabled={isDisabled}
              rows={2}
              placeholder="Missão resumida do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Objective */}
          <div className="lg:col-span-2 space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Objetivo <span className="text-cyan-400">*</span>
            </label>
            <textarea
              value={agent.objective}
              onChange={(e) => handleFieldChange('objective', e.target.value)}
              disabled={isDisabled}
              rows={3}
              placeholder="Objetivo funcional primário do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Success Criteria */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Critérios de Sucesso</label>
            <ChipInput
              values={agent.successCriteria}
              onChange={(values) => handleFieldChange('successCriteria', values)}
              disabled={isDisabled}
              placeholder="Adicionar critério..."
            />
          </div>
        </div>
      </FormSection>

      {/* Seção 4: Governança e Edição */}
      <FormSection
        title="Governança e Edição"
        description="Controles de acesso, visibilidade e categorização"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Configurações de Governança"
            icon={Shield}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Toggles */}
          <div className="space-y-4">
            {/* isActive */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agent.isActive ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={agent.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agent.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-slate-300">Agente ativo</span>
            </label>

            {/* isEditable */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agent.isEditable ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={agent.isEditable}
                  onChange={(e) => handleFieldChange('isEditable', e.target.checked)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agent.isEditable ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-slate-300">Permitir edição</span>
            </label>
          </div>

          {/* Visibility */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Visibilidade</label>
            <select
              value={agent.visibility}
              onChange={(e) => handleFieldChange('visibility', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="private">Privado</option>
              <option value="internal">Interno</option>
              <option value="public">Público</option>
            </select>
          </div>

          {/* Tags */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Tags</label>
            <ChipInput
              values={agent.tags}
              onChange={(values) => handleFieldChange('tags', values)}
              disabled={isDisabled}
              placeholder="Adicionar tag..."
            />
          </div>

          {/* Categories */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Categorias</label>
            <ChipInput
              values={agent.categories}
              onChange={(values) => handleFieldChange('categories', values)}
              disabled={isDisabled}
              placeholder="Adicionar categoria..."
            />
          </div>

          {/* Audit Metadata */}
          <div className="lg:col-span-2 pt-4 border-t border-slate-700/50">
            <AuditMetadataDisplay
              metadata={{
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
                createdBy: agent.auditMetadata?.createdBy || undefined,
                updatedBy: agent.auditMetadata?.updatedBy || undefined,
                version: agent.configSnapshotVersion
              }}
              variant="compact"
            />
          </div>
        </div>
      </FormSection>

      {/* Seção 5: Ciclo de Vida */}
      <FormSection
        title="Ciclo de Vida"
        description="Histórico e metadados de ciclo de vida do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Histórico"
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Origin Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Tipo de Origem</label>
            <input
              type="text"
              value={agent.originType}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Config Snapshot Version */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão do Snapshot</label>
            <input
              type="number"
              value={agent.configSnapshotVersion}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Created At */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Criado em</label>
            <input
              type="text"
              value={formatDate(agent.createdAt)}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Updated At */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Atualizado em</label>
            <input
              type="text"
              value={formatDate(agent.updatedAt)}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Activated At (conditional) */}
          {agent.activatedAt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Ativado em</label>
              <input
                type="text"
                value={formatDate(agent.activatedAt)}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          {/* Deactivated At (conditional) */}
          {agent.deactivatedAt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Desativado em</label>
              <input
                type="text"
                value={formatDate(agent.deactivatedAt)}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          {/* Is Deleted & Deleted At (conditional) */}
          {agent.isDeleted && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <div className="w-full rounded border border-red-500/50 bg-red-950/20 p-2 text-sm text-red-400">
                  Excluído
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Excluído em</label>
                <input
                  type="text"
                  value={formatDate(agent.deletedAt)}
                  readOnly
                  className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </>
          )}
        </div>
      </FormSection>
    </div>
  );
}

// Helper function for date formatting
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

// Chip Input Component
interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChipInput({ values, onChange, disabled, placeholder }: ChipInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !values.includes(value)) {
        onChange([...values, value]);
        e.currentTarget.value = '';
      }
    } else if (e.key === 'Backspace' && !e.currentTarget.value && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 min-h-[2.5rem] p-2 rounded border border-slate-700 bg-slate-950/70 ${disabled ? 'opacity-50' : ''}`}>
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-100 text-sm">
          {value}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(index)}
              className="ml-1 text-cyan-300 hover:text-cyan-100 focus:outline-none"
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder || 'Adicionar...'}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none min-w-[120px] py-1"
      />
    </div>
  );
}
```

---

## Exportação do Componente

```typescript
// frontend/src/components/agents/tabs/index.ts
export { IdentityTab } from './IdentityTab.js';
export type { IdentityTabProps } from './IdentityTab.js';
```

---

## Integração com a Página Agents

```typescript
// Em frontend/src/pages/Agents.tsx (ou componente de edição)
import { IdentityTab } from '../components/agents/tabs/IdentityTab.js';

function AgentEditModal({ agent, onUpdate }) {
  const [activeTab, setActiveTab] = useState('identity');
  const [formData, setFormData] = useState(agent);

  const handleChange = (updates: Partial<AgentInstance>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="agent-edit-modal">
      {/* Tabs Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab('identity')} className={activeTab === 'identity' ? 'active' : ''}>
          Identity
        </button>
        {/* Outras tabs... */}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'identity' && (
          <IdentityTab
            agent={formData}
            onChange={handleChange}
          />
        )}
        {/* Outros conteúdos de tabs... */}
      </div>
    </div>
  );
}
```

---

## Estados e Handlers

### Estados Locais

```typescript
// Não há estados locais complexos - componente é puro controlled component
// Props gerenciam todo o estado:
// - agent: AgentInstance (dados atuais)
// - onChange: (updates: Partial<AgentInstance>) => void (callback de alteração)
// - readOnly: boolean (modo somente leitura)
// - disabled: boolean (desabilitado)
```

### Handlers de Eventos

```typescript
// Handler genérico para campos simples
const handleTextChange = (field: keyof AgentInstance) => (e: React.ChangeEvent<HTMLInputElement>) => {
  onChange({ [field]: e.target.value } as Partial<AgentInstance>);
};

// Handler para arrays (tags, categories, successCriteria)
const handleArrayChange = (field: keyof AgentInstance) => (values: string[]) => {
  onChange({ [field]: values } as Partial<AgentInstance>);
};

// Handler para booleanos
const handleBooleanChange = (field: keyof AgentInstance) => (checked: boolean) => {
  onChange({ [field]: checked } as Partial<AgentInstance>);
};
```

---

## Dependências

- **React**: Componentes funcionais com hooks (useCallback)
- **Lucide React**: Ícones (Fingerprint, GitBranch, Target, Shield, Clock, User, Tag, Folder)
- **Componentes internos**:
  - `FormSection`: Container de seção
  - `FormSectionHeader`: Cabeçalho com ícone e badge
  - `AuditMetadataDisplay`: Exibição de metadados de auditoria
- **Tipos**: `AgentInstance` de `../../../types/kernel.js`
- **Utilitários**: Função `formatDate` para formatação de datas

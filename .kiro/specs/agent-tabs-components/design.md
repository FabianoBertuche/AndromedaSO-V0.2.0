---
name: agent-tabs-components
description: Arquitetura de componentes reutilizáveis para tabs de agentes com props, estilos e exemplos
---

# Design — Agent Tabs Components

## Visão Geral da Arquitetura

Os componentes são organizados em uma hierarquia modular onde cada componente tem responsabilidade única e pode ser composto com outros. Todos seguem o padrão de componentes controlados (controlled components) para facilitar integração com formulários.

```
frontend/src/components/agents/
├── FormSection.tsx
├── FormSectionHeader.tsx
├── JSONEditor.tsx
├── RetryPolicyForm.tsx
├── AuditMetadataDisplay.tsx
└── index.ts
```

---

## Componente 1: FormSection

Container para agrupar campos relacionados em uma seção visualmente distinta.

### Props Interface

```typescript
export type ValidationError = {
  message: string;
  severity?: 'error' | 'warning';
};

export type FormSectionProps = {
  title: string;
  description?: string;
  error?: ValidationError;
  children: React.ReactNode;
  className?: string;
};
```

### Implementação

```typescript
// frontend/src/components/agents/FormSection.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ValidationError } from '../../types/ui';

export type FormSectionProps = {
  title: string;
  description?: string;
  error?: ValidationError;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  error,
  children,
  className
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        'bg-slate-900/50',
        error
          ? 'border-red-500/50 bg-red-950/10'
          : 'border-cyan-500/30',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-cyan-300">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {children}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}
```

### Estilos TailwindCSS

| Elemento | Classes |
|------------|---------|
| Container | `rounded-lg border p-4 bg-slate-900/50 border-cyan-500/30` |
| Container (erro) | `border-red-500/50 bg-red-950/10` |
| Título | `text-sm font-medium text-cyan-300` |
| Descrição | `text-xs text-slate-400` |
| Mensagem de erro | `text-xs text-red-400 flex items-center gap-2` |

### Exemplo de Uso

```typescript
import { FormSection } from '../components/agents/FormSection';

function AgentForm() {
  return (
    <FormSection
      title="Configurações Básicas"
      description="Configure os parâmetros essenciais do agente"
      error={hasError ? { message: 'Nome é obrigatório' } : undefined}
    >
      <input
        type="text"
        className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        placeholder="Nome do agente"
      />
      <select className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200">
        <option>Template A</option>
        <option>Template B</option>
      </select>
    </FormSection>
  );
}
```

---

## Componente 2: FormSectionHeader

Cabeçalho reutilizável para seções com título, ícone, badge e ações.

### Props Interface

```typescript
import type { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export type FormSectionHeaderProps = {
  title: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  actions?: React.ReactNode;
  className?: string;
};
```

### Implementação

```typescript
// frontend/src/components/agents/FormSectionHeader.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export type FormSectionHeaderProps = {
  title: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  actions?: React.ReactNode;
  className?: string;
};

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
};

export function FormSectionHeader({
  title,
  icon: Icon,
  badge,
  actions,
  className
}: FormSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pb-3 border-b border-cyan-500/20',
        className
      )}
    >
      {/* Left: Icon + Title + Badge */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-cyan-400" />
        )}
        <h3 className="text-sm font-semibold text-cyan-300">
          {title}
        </h3>
        {badge && (
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded border',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
```

### Estilos TailwindCSS

| Elemento | Classes |
|------------|---------|
| Container | `flex items-center justify-between pb-3 border-b border-cyan-500/20` |
| Ícone | `h-4 w-4 text-cyan-400` |
| Título | `text-sm font-semibold text-cyan-300` |
| Badge | `px-2 py-0.5 text-xs font-medium rounded border` |
| Badge success | `bg-green-500/20 text-green-400 border-green-500/30` |
| Badge warning | `bg-yellow-500/20 text-yellow-400 border-yellow-500/30` |
| Badge error | `bg-red-500/20 text-red-400 border-red-500/30` |
| Badge info | `bg-cyan-500/20 text-cyan-400 border-cyan-500/30` |

### Exemplo de Uso

```typescript
import { FormSectionHeader } from '../components/agents/FormSectionHeader';
import { Settings, Plus, Trash2 } from 'lucide-react';

function ConfigSection() {
  return (
    <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4">
      <FormSectionHeader
        title="Configurações Avançadas"
        icon={Settings}
        badge={{ text: '3 campos', variant: 'info' }}
        actions={
          <>
            <button className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-400">
              <Plus className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        }
      />
      {/* Conteúdo da seção */}
    </div>
  );
}
```

---

## Componente 3: JSONEditor

Editor de JSON com validação, syntax highlighting e formatação automática.

### Props Interface

```typescript
export type JSONSchema = {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
};

export type JSONEditorProps = {
  value: object | string;
  onChange: (value: string, isValid: boolean, parsed?: object) => void;
  schema?: JSONSchema;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
};
```

### Implementação

```typescript
// frontend/src/components/agents/JSONEditor.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Wand2, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { JSONSchema } from '../../types/ui';

export type JSONEditorProps = {
  value: object | string;
  onChange: (value: string, isValid: boolean, parsed?: object) => void;
  schema?: JSONSchema;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
};

export function JSONEditor({
  value,
  onChange,
  schema,
  label,
  placeholder = '{\n  "/\* Cole o JSON aqui \/\/\n}',
  disabled = false,
  minHeight = '150px',
  className
}: JSONEditorProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Inicializar com valor formatado
  useEffect(() => {
    const initialText = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    setText(initialText);
    validateJson(initialText);
  }, []);

  const validateJson = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Validação de schema (se fornecido)
      if (schema) {
        const schemaErrors = validateSchema(parsed, schema);
        if (schemaErrors.length > 0) {
          setError(schemaErrors.join(', '));
          setIsValid(false);
          return false;
        }
      }
      
      setError(null);
      setIsValid(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON inválido');
      setIsValid(false);
      return false;
    }
  }, [schema]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    const valid = validateJson(newText);
    const parsed = valid ? JSON.parse(newText) : undefined;
    onChange(newText, valid, parsed);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      setText(formatted);
      setError(null);
      setIsValid(true);
      onChange(formatted, true, parsed);
    } catch (e) {
      // Mantém o erro atual se o JSON estiver inválido
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleFormat();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label e Ações */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-medium text-cyan-300">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          {isValid && !error && text && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check className="h-3 w-3" />
              Válido
            </span>
          )}
          <button
            onClick={handleFormat}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
            title="Formatar JSON (Ctrl+Enter)"
          >
            <Wand2 className="h-3 w-3" />
            Formatar
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          'w-full rounded-md border bg-slate-900 p-3 font-mono text-xs leading-relaxed',
          'resize-y focus:outline-none focus:ring-2',
          error
            ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/30 text-red-100'
            : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-500/50 text-slate-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ minHeight }}
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span className="font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}

// Função auxiliar de validação de schema (simplificada)
function validateSchema(data: unknown, schema: JSONSchema): string[] {
  const errors: string[] = [];
  
  if (schema.required) {
    if (typeof data !== 'object' || data === null) {
      errors.push('Dados devem ser um objeto');
    } else {
      const obj = data as Record<string, unknown>;
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push(`Campo obrigatório ausente: "${field}"`);
        }
      }
    }
  }
  
  return errors;
}
```

### Estilos TailwindCSS

| Elemento | Classes |
|------------|---------|
| Label | `text-xs font-medium text-cyan-300` |
| Textarea | `w-full rounded-md border bg-slate-900 p-3 font-mono text-xs leading-relaxed resize-y` |
| Textarea focus | `focus:outline-none focus:ring-2 focus:border-cyan-400 focus:ring-cyan-500/50` |
| Textarea erro | `border-red-500/50 focus:border-red-400 focus:ring-red-500/30 text-red-100` |
| Textarea normal | `border-cyan-500/30 text-slate-300` |
| Botão formatar | `flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20` |
| Mensagem de erro | `flex items-start gap-2 text-xs text-red-400 font-mono` |
| Badge válido | `flex items-center gap-1 text-xs text-green-400` |

### Exemplo de Uso

```typescript
import { JSONEditor } from '../components/agents/JSONEditor';

function AgentConfig() {
  const [config, setConfig] = useState({ timeout: 30, retries: 3 });
  const [jsonText, setJsonText] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleChange = (text: string, valid: boolean, parsed?: object) => {
    setJsonText(text);
    setIsValid(valid);
    if (valid && parsed) {
      setConfig(parsed);
    }
  };

  return (
    <JSONEditor
      value={config}
      onChange={handleChange}
      label="Configuração JSON"
      placeholder="{\n  \"timeout\": 30,\n  \"retries\": 3\n}"
      minHeight="200px"
    />
  );
}
```

---

## Componente 4: RetryPolicyForm

Formulário para configuração de políticas de retry.

### Props Interface

```typescript
export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';

export type RetryPolicy = {
  maxRetries: number;
  delay: number;
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
};

export type RetryPolicyFormProps = {
  value: RetryPolicy;
  onChange: (policy: RetryPolicy) => void;
  disabled?: boolean;
  className?: string;
};
```

### Implementação

```typescript
// frontend/src/components/agents/RetryPolicyForm.tsx
import React, { useState, useCallback } from 'react';
import { RotateCcw, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FormSectionHeader } from './FormSectionHeader';
import type { RetryPolicy, BackoffStrategy } from '../../types/ui';

export type RetryPolicyFormProps = {
  value: RetryPolicy;
  onChange: (policy: RetryPolicy) => void;
  disabled?: boolean;
  className?: string;
};

const backoffStrategyLabels: Record<BackoffStrategy, string> = {
  fixed: 'Fixo',
  exponential: 'Exponencial',
  linear: 'Linear'
};

export function RetryPolicyForm({
  value,
  onChange,
  disabled = false,
  className
}: RetryPolicyFormProps) {
  const [newErrorCode, setNewErrorCode] = useState('');
  const isRetryDisabled = value.maxRetries === 0;

  const updateField = useCallback(<K extends keyof RetryPolicy>(
    field: K,
    fieldValue: RetryPolicy[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  }, [value, onChange]);

  const addRetryableError = () => {
    if (newErrorCode.trim() && !value.retryableErrors.includes(newErrorCode.trim())) {
      updateField('retryableErrors', [...value.retryableErrors, newErrorCode.trim()]);
      setNewErrorCode('');
    }
  };

  const removeRetryableError = (errorCode: string) => {
    updateField('retryableErrors', value.retryableErrors.filter(e => e !== errorCode));
  };

  const formatDelay = (ms: number): string => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  };

  return (
    <div className={cn('rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4', className)}>
      <FormSectionHeader
        title="Política de Retry"
        icon={RotateCcw}
        badge={value.maxRetries > 0 
          ? { text: `${value.maxRetries} tentativas`, variant: 'info' }
          : { text: 'Desativado', variant: 'warning' }
        }
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Max Retries */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cyan-300">
            Máximo de Tentativas
          </label>
          <input
            type="number"
            min={0}
            max={10}
            value={value.maxRetries}
            onChange={(e) => updateField('maxRetries', parseInt(e.target.value) || 0)}
            disabled={disabled}
            className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
          />
          <p className="text-xs text-slate-500">
            0 para desativar retry
          </p>
        </div>

        {/* Delay */}
        <div className={cn('space-y-1.5', isRetryDisabled && 'opacity-50')}>
          <label className="text-xs font-medium text-cyan-300">
            Delay entre Tentativas
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={100}
              value={value.delay}
              onChange={(e) => updateField('delay', parseInt(e.target.value) || 0)}
              disabled={disabled || isRetryDisabled}
              className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 pr-16 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {formatDelay(value.delay)}
            </span>
          </div>
        </div>

        {/* Backoff Strategy */}
        <div className={cn('space-y-1.5', isRetryDisabled && 'opacity-50')}>
          <label className="text-xs font-medium text-cyan-300">
            Estratégia de Backoff
          </label>
          <select
            value={value.backoffStrategy}
            onChange={(e) => updateField('backoffStrategy', e.target.value as BackoffStrategy)}
            disabled={disabled || isRetryDisabled}
            className="w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
          >
            {(['fixed', 'exponential', 'linear'] as BackoffStrategy[]).map(strategy => (
              <option key={strategy} value={strategy}>
                {backoffStrategyLabels[strategy]}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div className={cn('flex items-end', isRetryDisabled && 'opacity-50')}>
          <div className="w-full rounded bg-slate-950/50 px-3 py-2 text-xs text-slate-400 font-mono">
            {!isRetryDisabled ? (
              <span>
                {value.maxRetries} tentativas com delay {formatDelay(value.delay)} ({value.backoffStrategy})
              </span>
            ) : (
              <span className="text-slate-600">Retry desativado</span>
            )}
          </div>
        </div>
      </div>

      {/* Retryable Errors */}
      <div className={cn('mt-4 pt-4 border-t border-cyan-500/20', isRetryDisabled && 'opacity-50')}>
        <label className="text-xs font-medium text-cyan-300">
          Erros Retryáveis
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {value.retryableErrors.map(errorCode => (
            <span
              key={errorCode}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs text-red-300"
            >
              {errorCode}
              <button
                onClick={() => removeRetryableError(errorCode)}
                disabled={disabled || isRetryDisabled}
                className="hover:text-red-200 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          
          {/* Add new error */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newErrorCode}
              onChange={(e) => setNewErrorCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRetryableError()}
              disabled={disabled || isRetryDisabled}
              placeholder="Código do erro"
              className="w-32 rounded border border-cyan-500/30 bg-slate-800 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={addRetryableError}
              disabled={disabled || isRetryDisabled || !newErrorCode.trim()}
              className="rounded p-1 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {value.retryableErrors.length === 0 && !isRetryDisabled && (
          <p className="mt-2 text-xs text-slate-500">
            Todos os erros serão retryáveis por padrão
          </p>
        )}
      </div>
    </div>
  );
}
```

### Estilos TailwindCSS

| Elemento | Classes |
|------------|---------|
| Container | `rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4` |
| Grid | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| Label | `text-xs font-medium text-cyan-300` |
| Input | `w-full rounded border border-cyan-500/30 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50` |
| Select | Mesmas classes do input |
| Preview box | `rounded bg-slate-950/50 px-3 py-2 text-xs text-slate-400 font-mono` |
| Error tags | `inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs text-red-300` |
| Add error input | `w-32 rounded border border-cyan-500/30 bg-slate-800 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600` |
| Disabled state | `opacity-50` aplicado aos campos quando `maxRetries === 0` |

### Exemplo de Uso

```typescript
import { RetryPolicyForm } from '../components/agents/RetryPolicyForm';

function AgentConfig() {
  const [policy, setPolicy] = useState({
    maxRetries: 3,
    delay: 1000,
    backoffStrategy: 'exponential' as const,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT']
  });

  return (
    <RetryPolicyForm
      value={policy}
      onChange={setPolicy}
    />
  );
}
```

---

## Componente 5: AuditMetadataDisplay

Exibição de metadados de auditoria em diferentes formatos.

### Props Interface

```typescript
export type AuditMetadata = {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version: number;
};

export type AuditMetadataDisplayProps = {
  metadata: AuditMetadata;
  variant?: 'row' | 'badges' | 'compact';
  showVersion?: boolean;
  className?: string;
};
```

### Implementação

```typescript
// frontend/src/components/agents/AuditMetadataDisplay.tsx
import React from 'react';
import { Clock, RefreshCw, User, Hash } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AuditMetadata } from '../../types/ui';

export type AuditMetadataDisplayProps = {
  metadata: AuditMetadata;
  variant?: 'row' | 'badges' | 'compact';
  showVersion?: boolean;
  className?: string;
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(dateString);
}

export function AuditMetadataDisplay({
  metadata,
  variant = 'row',
  showVersion = true,
  className
}: AuditMetadataDisplayProps) {
  const { createdAt, updatedAt, createdBy, updatedBy, version } = metadata;
  const hasBeenUpdated = createdAt !== updatedAt;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 text-xs text-slate-500', className)}>
        <span title={`Criado em ${formatDate(createdAt)}`}>
          <Clock className="inline h-3 w-3 mr-1" />
          {formatRelative(createdAt)}
        </span>
        {hasBeenUpdated && (
          <span title={`Atualizado em ${formatDate(updatedAt)}`}>
            <RefreshCw className="inline h-3 w-3 mr-1" />
            {formatRelative(updatedAt)}
          </span>
        )}
        {showVersion && (
          <span>
            <Hash className="inline h-3 w-3 mr-1" />
            v{version}
          </span>
        )}
      </div>
    );
  }

  // Badges variant
  if (variant === 'badges') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          Criado: {formatDate(createdAt)}
        </span>
        {createdBy && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
            <User className="h-3 w-3" />
            Por: {createdBy}
          </span>
        )}
        {hasBeenUpdated && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-900/30 border border-cyan-500/30 px-2.5 py-1 text-xs text-cyan-400">
            <RefreshCw className="h-3 w-3" />
            Atualizado: {formatDate(updatedAt)}
          </span>
        )}
        {showVersion && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/30 border border-green-500/30 px-2.5 py-1 text-xs text-green-400">
            <Hash className="h-3 w-3" />
            v{version}
          </span>
        )}
      </div>
    );
  }

  // Row variant (default)
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400', className)}>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-slate-500" />
        <span>Criado: {formatDate(createdAt)}</span>
        {createdBy && (
          <span className="text-slate-500">por {createdBy}</span>
        )}
      </div>
      
      {hasBeenUpdated && (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-cyan-500/70" />
          <span>Atualizado: {formatDate(updatedAt)}</span>
          {updatedBy && updatedBy !== createdBy && (
            <span className="text-slate-500">por {updatedBy}</span>
          )}
        </div>
      )}
      
      {showVersion && (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-green-500/70" />
          <span className="text-green-400/80">v{version}</span>
        </div>
      )}
    </div>
  );
}
```

### Estilos TailwindCSS

| Elemento | Classes |
|------------|---------|
| Compact container | `flex items-center gap-3 text-xs text-slate-500` |
| Row container | `flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400` |
| Badges container | `flex flex-wrap gap-2` |
| Badge padrão | `inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-400` |
| Badge atualizado | `bg-cyan-900/30 border-cyan-500/30 text-cyan-400` |
| Badge versão | `bg-green-900/30 border-green-500/30 text-green-400` |
| Ícones | `h-3.5 w-3.5` (row), `h-3 w-3` (compact/badges) |

### Exemplo de Uso

```typescript
import { AuditMetadataDisplay } from '../components/agents/AuditMetadataDisplay';

function AgentDetail() {
  const metadata = {
    createdAt: '2026-04-05T10:30:00Z',
    updatedAt: '2026-04-05T15:45:00Z',
    createdBy: 'admin',
    updatedBy: 'operator',
    version: 3
  };

  return (
    <div className="space-y-4">
      {/* Row variant */}
      <AuditMetadataDisplay metadata={metadata} variant="row" />
      
      {/* Badges variant */}
      <AuditMetadataDisplay metadata={metadata} variant="badges" />
      
      {/* Compact variant */}
      <AuditMetadataDisplay metadata={metadata} variant="compact" />
    </div>
  );
}
```

---

## Integração entre Componentes

Os componentes podem ser compostos para criar formulários complexos:

```typescript
function AgentConfigForm() {
  return (
    <div className="space-y-6">
      {/* Seção com header e campos */}
      <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4">
        <FormSectionHeader
          title="Configurações Gerais"
          icon={Settings}
          badge={{ text: 'Obrigatório', variant: 'info' }}
        />
        <div className="mt-4 space-y-4">
          <FormSection
            title="Parâmetros do Template"
            description="Configure os parâmetros específicos do template"
          >
            {/* Campos do formulário */}
          </FormSection>
        </div>
      </div>

      {/* JSON Editor */}
      <FormSection
        title="Configuração Avançada"
        description="JSON com configurações customizadas"
      >
        <JSONEditor
          value={{ timeout: 30 }}
          onChange={(text, valid) => console.log(text, valid)}
          label="JSON Config"
        />
      </FormSection>

      {/* Retry Policy */}
      <RetryPolicyForm
        value={retryPolicy}
        onChange={setRetryPolicy}
      />

      {/* Audit Metadata */}
      <div className="pt-4 border-t border-slate-800">
        <AuditMetadataDisplay
          metadata={agentMetadata}
          variant="row"
        />
      </div>
    </div>
  );
}
```

---

## Index de Exportação

```typescript
// frontend/src/components/agents/index.ts
export { FormSection } from './FormSection.js';
export { FormSectionHeader } from './FormSectionHeader.js';
export { JSONEditor } from './JSONEditor.js';
export { RetryPolicyForm } from './RetryPolicyForm.js';
export { AuditMetadataDisplay } from './AuditMetadataDisplay.js';

// Re-export types
export type {
  FormSectionProps,
  FormSectionHeaderProps,
  JSONEditorProps,
  RetryPolicyFormProps,
  RetryPolicy,
  BackoffStrategy,
  AuditMetadataDisplayProps,
  AuditMetadata,
  ValidationError,
  BadgeVariant
} from './types.js';
```

---

## Dependências

- **React 18** — Componentes funcionais com hooks
- **Lucide React** — Ícones (`RotateCcw`, `Clock`, `AlertCircle`, `Check`, `Wand2`, `Plus`, `X`, `Hash`, `RefreshCw`, `User`, `Settings`)
- **TailwindCSS** — Estilização com classes utilitárias
- **cn utility** — Função de merge de classes (já existe em `frontend/src/lib/utils.ts`)
- **Tipos** — Definidos em `frontend/src/types/ui.ts` (novo arquivo)

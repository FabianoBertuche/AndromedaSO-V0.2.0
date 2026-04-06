// frontend/src/components/agents/tabs/ModelTab.tsx
import { useCallback } from 'react';
import { Cpu, Zap, Settings2, Clock, Layers } from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import { RetryPolicyForm } from '../RetryPolicyForm.js';
import type { AgentInstance } from '../../../types/kernel.js';
import type { RetryPolicy } from '../../../types/ui.js';

export type ModelTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
  availableModels?: Array<{ id: string; displayName: string }>; // Nova prop opcional
};

const responseFormatLabels: Record<string, string> = {
  text: 'Texto',
  markdown: 'Markdown',
  json: 'JSON',
  structured: 'Estruturado'
};

const reasoningModeLabels: Record<string, string> = {
  default: 'Padrão',
  light: 'Leve',
  standard: 'Padrão',
  deep: 'Profundo'
};

export function ModelTab({ agent, onChange, readOnly = false, disabled = false, availableModels }: ModelTabProps) {


  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback(<K extends keyof AgentInstance>(
    field: K,
    value: AgentInstance[K]
  ) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  const handleRetryPolicyChange = useCallback((policy: RetryPolicy) => {
    const kernelRetryPolicy: AgentInstance['retryPolicy'] = {
      maxRetries: policy.maxRetries,
      backoffMs: policy.delay,
      strategy: policy.backoffStrategy === 'linear' ? 'fixed' : policy.backoffStrategy
    };
    onChange({ retryPolicy: kernelRetryPolicy });
  }, [onChange]);

  const retryPolicyForForm: RetryPolicy = {
    maxRetries: agent.retryPolicy?.maxRetries ?? 3,
    delay: agent.retryPolicy?.backoffMs ?? 1000,
    backoffStrategy: agent.retryPolicy?.strategy === 'exponential' ? 'exponential' : 'fixed',
    retryableErrors: []
  };

  return (
    <div className="space-y-8">
      {/* Seção 1: Modelo Preferido */}
      <FormSection
        title="Modelo Preferido"
        description="Configuração do modelo de linguagem e parâmetros de geração"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Configuração do Modelo"
            icon={Cpu}
            badge={agent.preferredModel ? { text: agent.preferredModel, variant: 'info' } : { text: 'Não definido', variant: 'warning' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Preferred Model */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Modelo Preferido
            </label>
            {availableModels && availableModels.length > 0 ? (
              <select
                value={agent.preferredModel || ''}
                onChange={(e) => handleFieldChange('preferredModel', e.target.value || null)}
                disabled={isDisabled}
                className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
              >
                <option value="">Selecionar modelo...</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={agent.preferredModel || ''}
                onChange={(e) => handleFieldChange('preferredModel', e.target.value || null)}
                disabled={isDisabled}
                placeholder="Ex: gpt-4, claude-3-opus, llama-3.1-70b"
                className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
              />
            )}
            <p className="text-xs text-slate-500">
              Identificador do modelo de linguagem preferido para este agente
            </p>
          </div>

          {/* Allowed Models */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Modelos Permitidos
            </label>
            {availableModels && availableModels.length > 0 ? (
              <ModelMultiSelect
                values={agent.allowedModels || []}
                onChange={(values) => handleFieldChange('allowedModels', values)}
                options={availableModels}
                disabled={isDisabled}
              />
            ) : (
              <StringArrayInput
                values={agent.allowedModels || []}
                onChange={(values) => handleFieldChange('allowedModels', values)}
                disabled={isDisabled}
                placeholder="Adicionar modelo permitido..."
              />
            )}
            <p className="text-xs text-slate-500">
              Lista de modelos alternativos permitidos (fallback)
            </p>
          </div>

          {/* Provider Constraints */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Restrições de Provider
            </label>
            <StringArrayInput
              values={agent.providerConstraints || []}
              onChange={(values) => handleFieldChange('providerConstraints', values)}
              disabled={isDisabled}
              placeholder="Ex: openai, anthropic, local..."
            />
            <p className="text-xs text-slate-500">
              Providers permitidos para este agente
            </p>
          </div>
        </div>
      </FormSection>

      {/* Seção 2: Parâmetros de Geração */}
      <FormSection
        title="Parâmetros de Geração"
        description="Configurações de temperatura, tokens e formato de resposta"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Configurações de Saída"
            icon={Zap}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Temperature */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Temperatura <span className="text-slate-400">({agent.temperature ?? 0.7})</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={agent.temperature ?? 0.7}
                onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
                disabled={isDisabled}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-cyan-500 disabled:opacity-50"
              />
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={agent.temperature ?? 0.7}
                onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value) || 0.7)}
                disabled={isDisabled}
                className="w-20 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white text-center focus:border-cyan-500/50 focus:outline-none disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-slate-500">
              0 = determinístico, 2 = altamente criativo
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Top P <span className="text-slate-400">({agent.topP ?? 1.0})</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={agent.topP ?? 1.0}
                onChange={(e) => handleFieldChange('topP', parseFloat(e.target.value))}
                disabled={isDisabled}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-cyan-500 disabled:opacity-50"
              />
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={agent.topP ?? 1.0}
                onChange={(e) => handleFieldChange('topP', parseFloat(e.target.value) || 1.0)}
                disabled={isDisabled}
                className="w-20 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white text-center focus:border-cyan-500/50 focus:outline-none disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-slate-500">
              Amostragem nucleus (0-1)
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Max Tokens
            </label>
            <input
              type="number"
              min={1}
              max={128000}
              value={agent.maxTokens || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                handleFieldChange('maxTokens', value);
              }}
              disabled={isDisabled}
              placeholder="Ilimitado"
              className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Limite máximo de tokens na resposta (vazio = ilimitado)
            </p>
          </div>

          {/* Response Format */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Formato de Resposta
            </label>
            <select
              value={agent.responseFormat || 'text'}
              onChange={(e) => handleFieldChange('responseFormat', e.target.value as AgentInstance['responseFormat'])}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
            >
              <option value="text">{responseFormatLabels.text}</option>
              <option value="markdown">{responseFormatLabels.markdown}</option>
              <option value="json">{responseFormatLabels.json}</option>
              <option value="structured">{responseFormatLabels.structured}</option>
            </select>
            <p className="text-xs text-slate-500">
              Formato esperado das respostas do modelo
            </p>
          </div>

          {/* Reasoning Mode */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Modo de Raciocínio
            </label>
            <select
              value={agent.reasoningMode || 'default'}
              onChange={(e) => handleFieldChange('reasoningMode', e.target.value as AgentInstance['reasoningMode'])}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
            >
              <option value="default">{reasoningModeLabels.default}</option>
              <option value="light">{reasoningModeLabels.light}</option>
              <option value="standard">{reasoningModeLabels.standard}</option>
              <option value="deep">{reasoningModeLabels.deep}</option>
            </select>
            <p className="text-xs text-slate-500">
              Nível de profundidade do raciocínio
            </p>
          </div>
        </div>
      </FormSection>

      {/* Seção 3: Execução e Timeout */}
      <FormSection
        title="Execução"
        description="Configurações de timeout e retry"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Timeout"
            icon={Clock}
            badge={{ text: `${agent.timeoutMs ?? 30000}ms`, variant: 'info' }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Timeout Ms */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-cyan-400">
              Timeout (ms)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1000}
                max={300000}
                step={1000}
                value={agent.timeoutMs ?? 30000}
                onChange={(e) => handleFieldChange('timeoutMs', parseInt(e.target.value) || 30000)}
                disabled={isDisabled}
                className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 pr-16 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                {formatDuration(agent.timeoutMs ?? 30000)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tempo máximo de espera por resposta do modelo (1000ms - 300000ms)
            </p>
          </div>
        </div>

        {/* Retry Policy Form */}
        <div className="mt-6">
          <RetryPolicyForm
            value={retryPolicyForForm}
            onChange={handleRetryPolicyChange}
            disabled={isDisabled}
          />
        </div>
      </FormSection>

      {/* Seção 4: Channel Constraints */}
      <FormSection
        title="Restrições de Canal"
        description="Canais permitidos para execução deste agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Canais"
            icon={Layers}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-cyan-400">
            Restrições de Canal
          </label>
          <StringArrayInput
            values={agent.channelConstraints || []}
            onChange={(values) => handleFieldChange('channelConstraints', values)}
            disabled={isDisabled}
            placeholder="Ex: chat, email, slack, webhook..."
          />
          <p className="text-xs text-slate-500">
            Canais pelos quais este agente pode ser executado (vazio = todos permitidos)
          </p>
        </div>
      </FormSection>
    </div>
  );
}

// Helper: Model Multi Select Component
interface ModelMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: Array<{ id: string; displayName: string }>;
  disabled?: boolean;
}

function ModelMultiSelect({ values, onChange, options, disabled }: ModelMultiSelectProps) {
  const toggleModel = (modelId: string) => {
    if (values.includes(modelId)) {
      onChange(values.filter((v) => v !== modelId));
    } else {
      onChange([...values, modelId]);
    }
  };

  const removeModel = (modelId: string) => {
    onChange(values.filter((v) => v !== modelId));
  };

  const selectedModels = options.filter((opt) => values.includes(opt.id));
  const availableOptions = options.filter((opt) => !values.includes(opt.id));

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      {/* Selected Models Chips */}
      <div className="flex flex-wrap items-center gap-2 min-h-[2.5rem] p-2 rounded border border-slate-700 bg-slate-950/70">
        {selectedModels.length === 0 && (
          <span className="text-sm text-slate-500">Nenhum modelo selecionado</span>
        )}
        {selectedModels.map((model) => (
          <span
            key={model.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 text-xs"
          >
            {model.displayName}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeModel(model.id)}
                className="ml-1 text-cyan-300 hover:text-cyan-100 focus:outline-none"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Dropdown to add more models */}
      {!disabled && availableOptions.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              toggleModel(e.target.value);
              e.target.value = '';
            }
          }}
          disabled={disabled}
          className="w-full rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
        >
          <option value="">Adicionar modelo...</option>
          {availableOptions.map((model) => (
            <option key={model.id} value={model.id}>
              {model.displayName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// Helper: String Array Input Component
interface StringArrayInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function StringArrayInput({ values, onChange, disabled, placeholder }: StringArrayInputProps) {
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

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 min-h-[2.5rem] p-2 rounded border border-slate-700 bg-slate-950/70 ${disabled ? 'opacity-50' : ''}`}>
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 text-xs">
          {value}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeItem(index)}
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
        placeholder={values.length === 0 ? placeholder : 'Adicionar...'}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none min-w-[120px] py-1"
      />
    </div>
  );
}

// Helper: Format duration
function formatDuration(ms: number): string {
  if (ms >= 60000) {
    return `${Math.round(ms / 60000)}min`;
  } else if (ms >= 1000) {
    return `${Math.round(ms / 1000)}s`;
  }
  return `${ms}ms`;
}

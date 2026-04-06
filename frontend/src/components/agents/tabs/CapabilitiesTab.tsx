// frontend/src/components/agents/tabs/CapabilitiesTab.tsx
import { useCallback } from 'react';
import {
  Zap,
  Database,
  Brain,
  Route,
  ArrowRightLeft,
  UserCheck,
  Puzzle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type CapabilitiesTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function CapabilitiesTab({ agent, onChange, readOnly = false, disabled = false }: CapabilitiesTabProps) {
  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback((field: keyof AgentInstance, value: unknown) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  const capabilities = [
    {
      key: 'toolsEnabled' as const,
      label: 'Ferramentas',
      description: 'Permite uso de ferramentas externas',
      icon: Zap,
      color: 'cyan',
    },
    {
      key: 'knowledgeEnabled' as const,
      label: 'Conhecimento',
      description: 'Acesso a bases de conhecimento',
      icon: Database,
      color: 'blue',
    },
    {
      key: 'memoryEnabled' as const,
      label: 'Memória',
      description: 'Persistência de contexto entre sessões',
      icon: Brain,
      color: 'purple',
    },
    {
      key: 'routingEnabled' as const,
      label: 'Roteamento',
      description: 'Encaminhamento para outros agentes',
      icon: Route,
      color: 'green',
    },
    {
      key: 'handoffEnabled' as const,
      label: 'Handoff',
      description: 'Transferência de controle entre agentes',
      icon: ArrowRightLeft,
      color: 'amber',
    },
    {
      key: 'humanEscalationEnabled' as const,
      label: 'Escalação Humana',
      description: 'Permite escalar para supervisores',
      icon: UserCheck,
      color: 'pink',
    },
  ];

  const getColorClasses = (color: string, enabled: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
      cyan: {
        bg: enabled ? 'bg-cyan-500/20' : 'bg-slate-800',
        border: enabled ? 'border-cyan-500/50' : 'border-slate-700',
        text: enabled ? 'text-cyan-400' : 'text-slate-500',
        glow: enabled ? 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' : '',
      },
      blue: {
        bg: enabled ? 'bg-blue-500/20' : 'bg-slate-800',
        border: enabled ? 'border-blue-500/50' : 'border-slate-700',
        text: enabled ? 'text-blue-400' : 'text-slate-500',
        glow: enabled ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' : '',
      },
      purple: {
        bg: enabled ? 'bg-purple-500/20' : 'bg-slate-800',
        border: enabled ? 'border-purple-500/50' : 'border-slate-700',
        text: enabled ? 'text-purple-400' : 'text-slate-500',
        glow: enabled ? 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' : '',
      },
      green: {
        bg: enabled ? 'bg-green-500/20' : 'bg-slate-800',
        border: enabled ? 'border-green-500/50' : 'border-slate-700',
        text: enabled ? 'text-green-400' : 'text-slate-500',
        glow: enabled ? 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' : '',
      },
      amber: {
        bg: enabled ? 'bg-amber-500/20' : 'bg-slate-800',
        border: enabled ? 'border-amber-500/50' : 'border-slate-700',
        text: enabled ? 'text-amber-400' : 'text-slate-500',
        glow: enabled ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' : '',
      },
      pink: {
        bg: enabled ? 'bg-pink-500/20' : 'bg-slate-800',
        border: enabled ? 'border-pink-500/50' : 'border-slate-700',
        text: enabled ? 'text-pink-400' : 'text-slate-500',
        glow: enabled ? 'shadow-[0_0_15px_rgba(236,72,153,0.3)]' : '',
      },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Core Capabilities */}
      <FormSection
        title="Capacidades Principais"
        description="Habilidades fundamentais do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Toggles de Capacidade"
            icon={ToggleRight}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap) => {
            const enabled = agent[cap.key];
            const colors = getColorClasses(cap.color, enabled);
            const Icon = cap.icon;

            return (
              <button
                key={cap.key}
                onClick={() => !isDisabled && handleFieldChange(cap.key, !enabled)}
                disabled={isDisabled}
                className={`relative rounded-lg border p-4 text-left transition-all duration-200 ${colors.border} ${colors.bg} ${colors.glow} hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${enabled ? 'bg-slate-950/50' : 'bg-slate-800'}`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                    {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                </div>
                <div className="mt-3">
                  <h4 className={`text-sm font-medium ${enabled ? 'text-white' : 'text-slate-400'}`}>
                    {cap.label}
                  </h4>
                  <p className={`mt-1 text-xs ${enabled ? 'text-slate-300' : 'text-slate-500'}`}>
                    {cap.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </FormSection>

      {/* Section 2: Custom Capabilities */}
      <FormSection
        title="Capacidades Personalizadas"
        description="Habilidades adicionais específicas do domínio"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Capabilities Array"
            icon={Puzzle}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Adicione capacidades customizadas específicas para o domínio do agente.
            Ex: "data-analysis", "code-generation", "customer-support"
          </p>
          <ChipInput
            values={agent.capabilities}
            onChange={(values) => handleFieldChange('capabilities', values)}
            disabled={isDisabled}
            placeholder="Adicionar capacidade..."
          />
        </div>

        {/* Quick Presets */}
        {!isDisabled && (
          <div className="mt-4">
            <span className="text-xs text-slate-500 mb-2 block">Presets rápidos:</span>
            <div className="flex flex-wrap gap-2">
              {[
                'text-generation',
                'data-analysis',
                'code-generation',
                'summarization',
                'translation',
                'classification',
                'extraction',
                'sentiment-analysis',
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    if (!agent.capabilities.includes(preset)) {
                      handleFieldChange('capabilities', [...agent.capabilities, preset]);
                    }
                  }}
                  disabled={agent.capabilities.includes(preset)}
                  className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-xs text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-30 disabled:hover:border-slate-700 disabled:hover:text-slate-400"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {/* Section 3: Execution Policy */}
      {agent.effectiveExecutionPolicy && (
        <FormSection
          title="Política de Execução Efetiva"
          description="Configuração resolvida atual"
        >
          <div className="mb-4">
            <FormSectionHeader
              title="Capacidades Aplicadas"
              icon={Sparkles}
              badge={{ text: 'Resolvido', variant: 'success' }}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {[
              { label: 'Ferramentas', value: agent.effectiveExecutionPolicy.toolsEnabled, icon: Zap },
              { label: 'Conhecimento', value: agent.effectiveExecutionPolicy.knowledgeEnabled, icon: Database },
              { label: 'Memória', value: agent.effectiveExecutionPolicy.memoryEnabled, icon: Brain },
              { label: 'Roteamento', value: agent.effectiveExecutionPolicy.routingEnabled, icon: Route },
              { label: 'Handoff', value: agent.effectiveExecutionPolicy.handoffEnabled, icon: ArrowRightLeft },
              { label: 'Escalação Humana', value: agent.effectiveExecutionPolicy.humanEscalationEnabled, icon: UserCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    item.value
                      ? 'border-green-500/30 bg-green-950/20'
                      : 'border-slate-700 bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${item.value ? 'text-green-400' : 'text-slate-600'}`} />
                    <span className={`text-xs ${item.value ? 'text-green-300' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.value ? (
                    <ToggleRight className="h-4 w-4 text-green-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </FormSection>
      )}

      {/* Section 4: Summary */}
      <FormSection
        title="Resumo de Capacidades"
        description="Visão geral ativada"
      >
        <div className="flex flex-wrap gap-2">
          {capabilities
            .filter((cap) => agent[cap.key])
            .map((cap) => {
              const colors = getColorClasses(cap.color, true);
              const Icon = cap.icon;
              return (
                <span
                  key={cap.key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${colors.border} ${colors.bg} ${colors.text}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cap.label}
                </span>
              );
            })}
          {agent.capabilities.map((cap) => (
            <span
              key={cap}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
            >
              <Puzzle className="h-3.5 w-3.5 text-slate-400" />
              {cap}
            </span>
          ))}
          {capabilities.filter((cap) => agent[cap.key]).length === 0 && agent.capabilities.length === 0 && (
            <span className="text-sm text-slate-500">Nenhuma capacidade configurada</span>
          )}
        </div>
      </FormSection>
    </div>
  );
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

// frontend/src/components/agents/tabs/SafeguardsTab.tsx
import { useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  Ban,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type SafeguardsTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function SafeguardsTab({ agent, onChange, readOnly = false, disabled = false }: SafeguardsTabProps) {
  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback((field: keyof AgentInstance, value: unknown) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  return (
    <div className="space-y-8">
      {/* Section 1: Positive Rules */}
      <FormSection
        title="Regras Positivas (Do's)"
        description="O que o agente DEVE fazer"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Diretrizes Obrigatórias"
            icon={ShieldCheck}
            badge={{ text: 'Do Rules', variant: 'success' }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Defina comportamentos e ações que o agente deve seguir obrigatoriamente.
            Ex: "Sempre verificar a identidade do usuário", "Confirmar entendimento antes de prosseguir"
          </p>
          <ChipInput
            values={agent.doRules}
            onChange={(values) => handleFieldChange('doRules', values)}
            disabled={isDisabled}
            placeholder="Adicionar regra positiva..."
            chipColor="green"
          />
        </div>

        {/* Preview of do rules */}
        {agent.doRules.length > 0 && (
          <div className="mt-4 rounded-lg border border-green-500/20 bg-green-950/10 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Regras Configuradas ({agent.doRules.length})
            </h4>
            <ul className="space-y-1">
              {agent.doRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-green-300/80">
                  <span className="mt-0.5 text-green-500">+</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormSection>

      {/* Section 2: Negative Rules */}
      <FormSection
        title="Regras Negativas (Don'ts)"
        description="O que o agente NÃO DEVE fazer"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Restrições e Proibições"
            icon={ShieldOff}
            badge={{ text: "Don't Rules", variant: 'error' }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Defina comportamentos proibidos e limitações do agente.
            Ex: "Não compartilhar informações pessoais", "Não fazer suposições sobre intenções"
          </p>
          <ChipInput
            values={agent.dontRules}
            onChange={(values) => handleFieldChange('dontRules', values)}
            disabled={isDisabled}
            placeholder="Adicionar regra negativa..."
            chipColor="red"
          />
        </div>

        {/* Preview of dont rules */}
        {agent.dontRules.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-950/10 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-red-400">
              <Ban className="h-3.5 w-3.5" />
              Restrições Configuradas ({agent.dontRules.length})
            </h4>
            <ul className="space-y-1">
              {agent.dontRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-red-300/80">
                  <span className="mt-0.5 text-red-500">−</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormSection>

      {/* Section 3: Guardrails */}
      <FormSection
        title="Guardrails"
        description="Barreiras de segurança e limites operacionais"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Barreiras de Segurança"
            icon={Shield}
            badge={{ text: 'Guardrails', variant: 'info' }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Configure guardrails para proteger contra comportamentos indesejados e garantir conformidade.
            Ex: "Limitar respostas a 500 tokens", "Verificar permissões antes de executar ações"
          </p>
          <ChipInput
            values={agent.guardrails}
            onChange={(values) => handleFieldChange('guardrails', values)}
            disabled={isDisabled}
            placeholder="Adicionar guardrail..."
            chipColor="cyan"
          />
        </div>

        {/* Preview of guardrails */}
        {agent.guardrails.length > 0 && (
          <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-400">
              <Shield className="h-3.5 w-3.5" />
              Guardrails Configurados ({agent.guardrails.length})
            </h4>
            <ul className="space-y-1">
              {agent.guardrails.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-cyan-300/80">
                  <span className="mt-0.5 text-cyan-500">◆</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormSection>

      {/* Section 4: Escalation Rules */}
      <FormSection
        title="Regras de Escalação"
        description="Quando e como escalar para supervisão humana"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Escalação Humana"
            icon={ArrowUpRight}
            badge={{ text: 'Escalation', variant: 'warning' }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Defina condições que devem acionar escalação para supervisão humana.
            Ex: "Quando detectar sentimento negativo", "Se o usuário solicitar explicitamente"
          </p>
          <ChipInput
            values={agent.escalationRules}
            onChange={(values) => handleFieldChange('escalationRules', values)}
            disabled={isDisabled}
            placeholder="Adicionar regra de escalação..."
            chipColor="amber"
          />
        </div>

        {/* Preview of escalation rules */}
        {agent.escalationRules.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/10 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Regras de Escalação ({agent.escalationRules.length})
            </h4>
            <ul className="space-y-1">
              {agent.escalationRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-amber-300/80">
                  <span className="mt-0.5 text-amber-500">↑</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormSection>

      {/* Section 5: Summary */}
      <FormSection
        title="Resumo de Salvaguardas"
        description="Visão geral de todas as proteções configuradas"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Visão Geral"
            icon={FileText}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-semibold text-green-400">{agent.doRules.length}</div>
            <div className="text-xs text-green-300/70">Do Rules</div>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-center">
            <Ban className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-semibold text-red-400">{agent.dontRules.length}</div>
            <div className="text-xs text-red-300/70">Don&apos;t Rules</div>
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4 text-center">
            <Shield className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-semibold text-cyan-400">{agent.guardrails.length}</div>
            <div className="text-xs text-cyan-300/70">Guardrails</div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-center">
            <ArrowUpRight className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-semibold text-amber-400">{agent.escalationRules.length}</div>
            <div className="text-xs text-amber-300/70">Escalation Rules</div>
          </div>
        </div>

        {agent.humanEscalationEnabled && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-950/20 p-3">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-300">
              Escalação humana está <strong>HABILITADA</strong> nas capacidades do agente
            </span>
          </div>
        )}
      </FormSection>
    </div>
  );
}

// Chip Input Component with color support
interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  chipColor?: 'cyan' | 'green' | 'red' | 'amber';
}

function ChipInput({ values, onChange, disabled, placeholder, chipColor = 'cyan' }: ChipInputProps) {
  const colorClasses = {
    cyan: 'bg-cyan-500/20 text-cyan-100',
    green: 'bg-green-500/20 text-green-100',
    red: 'bg-red-500/20 text-red-100',
    amber: 'bg-amber-500/20 text-amber-100',
  };

  const buttonColorClasses = {
    cyan: 'text-cyan-300 hover:text-cyan-100',
    green: 'text-green-300 hover:text-green-100',
    red: 'text-red-300 hover:text-red-100',
    amber: 'text-amber-300 hover:text-amber-100',
  };

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
        <span key={`${value}-${index}`} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${colorClasses[chipColor]}`}>
          {value}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(index)}
              className={`ml-1 focus:outline-none ${buttonColorClasses[chipColor]}`}
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

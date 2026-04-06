// frontend/src/components/agents/tabs/BehaviorTab.tsx
import { useCallback } from 'react';
import {
  User,
  MessageSquare,
  Brain,
  Languages,
  Sliders,
  Sparkles,
  FileText,
  List
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type BehaviorTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function BehaviorTab({ agent, onChange, readOnly = false, disabled = false }: BehaviorTabProps) {
  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback((field: keyof AgentInstance, value: unknown) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  return (
    <div className="space-y-8">
      {/* Section 1: Personality */}
      <FormSection
        title="Personalidade"
        description="Características de comportamento e interação do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Perfil Comportamental"
            icon={User}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Persona */}
          <div className="space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Persona <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.persona}
              onChange={(e) => handleFieldChange('persona', e.target.value)}
              disabled={isDisabled}
              placeholder="Ex: Assistente profissional e amigável"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Tone */}
          <div className="space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Tom de Voz <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.tone}
              onChange={(e) => handleFieldChange('tone', e.target.value)}
              disabled={isDisabled}
              placeholder="Ex: Profissional, casual, técnico"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Style */}
          <div className="space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Estilo <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.style}
              onChange={(e) => handleFieldChange('style', e.target.value)}
              disabled={isDisabled}
              placeholder="Ex: Direto, detalhado, conversacional"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Behavior Profile */}
          <div className="space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Perfil de Comportamento <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.behaviorProfile}
              onChange={(e) => handleFieldChange('behaviorProfile', e.target.value)}
              disabled={isDisabled}
              placeholder="Ex: helpful, concise, thorough"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Interaction Mode */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Modo de Interação</label>
            <select
              value={agent.interactionMode}
              onChange={(e) => handleFieldChange('interactionMode', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="reactive">Reativo - Responde apenas quando solicitado</option>
              <option value="proactive">Proativo - Inicia interações quando relevante</option>
              <option value="guided">Guiado - Conduz usuários por processos</option>
              <option value="strict">Estrito - Segue regras rigorosamente</option>
            </select>
          </div>

          {/* Default Language */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Idioma Padrão</label>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={agent.defaultLanguage}
                onChange={(e) => handleFieldChange('defaultLanguage', e.target.value)}
                disabled={isDisabled}
                placeholder="pt-BR, en-US, etc."
                className="flex-1 rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              />
            </div>
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
        </div>
      </FormSection>

      {/* Section 2: Instructions */}
      <FormSection
        title="Instruções"
        description="Prompts e diretrizes operacionais do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Instruções do Sistema"
            icon={Brain}
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-1 border-l-4 border-cyan-500 pl-3 mb-6">
          <label className="text-sm font-medium text-slate-200">
            System Prompt <span className="text-cyan-400">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Define o comportamento base, personalidade e restrições do agente
          </p>
          <textarea
            value={agent.systemPrompt}
            onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
            disabled={isDisabled}
            rows={8}
            placeholder="Você é um assistente..."
            className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y font-mono text-sm"
          />
        </div>

        <div className="mb-4">
          <FormSectionHeader
            title="Instruções Operacionais"
            icon={FileText}
          />
        </div>

        {/* Operating Instructions */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">
            Diretrizes Operacionais
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Passo a passo e procedimentos específicos que o agente deve seguir
          </p>
          <ChipInput
            values={agent.operatingInstructions}
            onChange={(values) => handleFieldChange('operatingInstructions', values)}
            disabled={isDisabled}
            placeholder="Adicionar instrução operacional..."
          />
        </div>
      </FormSection>

      {/* Section 3: Effective Behavior Profile (Read-only) */}
      {agent.effectiveBehaviorProfile && (
        <FormSection
          title="Perfil Comportamental Efetivo"
          description="Configuração resolvida e em uso"
        >
          <div className="mb-4">
            <FormSectionHeader
              title="Valores Efetivos Aplicados"
              icon={Sparkles}
              badge={{ text: 'Resolvido', variant: 'success' }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-70">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Persona Efetiva</label>
              <input
                type="text"
                value={agent.effectiveBehaviorProfile.persona}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Tom Efetivo</label>
              <input
                type="text"
                value={agent.effectiveBehaviorProfile.tone}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Estilo Efetivo</label>
              <input
                type="text"
                value={agent.effectiveBehaviorProfile.style}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Perfil Efetivo</label>
              <input
                type="text"
                value={agent.effectiveBehaviorProfile.behaviorProfile}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Modo de Interação Efetivo</label>
              <input
                type="text"
                value={agent.effectiveBehaviorProfile.interactionMode}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {agent.effectiveSystemPrompt && (
            <div className="mt-4 space-y-1">
              <label className="text-sm font-medium text-slate-400">System Prompt Efetivo</label>
              <textarea
                value={agent.effectiveSystemPrompt}
                readOnly
                rows={4}
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-xs text-slate-400 cursor-not-allowed font-mono resize-y"
              />
            </div>
          )}
        </FormSection>
      )}
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

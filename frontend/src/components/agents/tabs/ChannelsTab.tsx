// frontend/src/components/agents/tabs/ChannelsTab.tsx
import { useCallback, useState } from 'react';
import {
  Radio,
  Wifi,
  Globe,
  MessageCircle,
  Mail,
  Phone,
  Settings,
  Layers,
  AlertCircle,
  Check
} from 'lucide-react';

// Slack icon não existe no lucide-react, criando componente customizado
function Slack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import { JSONEditor } from '../JSONEditor.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type ChannelsTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function ChannelsTab({ agent, onChange, readOnly = false, disabled = false }: ChannelsTabProps) {
  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback((field: keyof AgentInstance, value: unknown) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  const channelOptions = [
    { value: 'web', label: 'Web', icon: Globe, description: 'Interface web embutida' },
    { value: 'api', label: 'API', icon: Wifi, description: 'Chamadas REST/GraphQL' },
    { value: 'chat', label: 'Chat', icon: MessageCircle, description: 'Widget de chat' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Processamento de emails' },
    { value: 'voice', label: 'Voz', icon: Phone, description: 'Chamadas telefônicas' },
    { value: 'slack', label: 'Slack', icon: Slack, description: 'Integração Slack' },
  ];

  const isChannelActive = (channel: string) => agent.allowedChannels.includes(channel);

  const toggleChannel = (channel: string) => {
    if (isDisabled) return;
    
    const newChannels = isChannelActive(channel)
      ? agent.allowedChannels.filter((c) => c !== channel)
      : [...agent.allowedChannels, channel];
    
    handleFieldChange('allowedChannels', newChannels);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Allowed Channels */}
      <FormSection
        title="Canais Permitidos"
        description="Canais de comunicação habilitados para o agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Seleção de Canais"
            icon={Radio}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {channelOptions.map((channel) => {
            const active = isChannelActive(channel.value);
            const Icon = channel.icon;
            
            return (
              <button
                key={channel.value}
                onClick={() => toggleChannel(channel.value)}
                disabled={isDisabled}
                className={`relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  active
                    ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
                } disabled:opacity-50`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  active ? 'bg-cyan-500/20' : 'bg-slate-800'
                }`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
                      {channel.label}
                    </h4>
                    {active && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                  </div>
                  <p className={`text-xs truncate ${active ? 'text-cyan-200/70' : 'text-slate-600'}`}>
                    {channel.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Channels */}
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-300 mb-2 block">Canais Personalizados</label>
          <ChipInput
            values={agent.allowedChannels.filter((c) => !channelOptions.some((opt) => opt.value === c))}
            onChange={(values) => {
              const standardChannels = agent.allowedChannels.filter((c) => 
                channelOptions.some((opt) => opt.value === c)
              );
              handleFieldChange('allowedChannels', [...standardChannels, ...values]);
            }}
            disabled={isDisabled}
            placeholder="Adicionar canal personalizado..."
          />
        </div>
      </FormSection>

      {/* Section 2: Default Channel Behavior */}
      <FormSection
        title="Comportamento Padrão"
        description="Configurações padrão para todos os canais"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Default Channel Behavior"
            icon={Settings}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-400">
            Configuração JSON padrão aplicada a todos os canais. Pode ser sobrescrita por channel overrides.
          </p>
          <JSONEditor
            value={agent.defaultChannelBehavior}
            onChange={(_, isValid, parsed) => {
              if (isValid && parsed) {
                handleFieldChange('defaultChannelBehavior', parsed);
              }
            }}
            disabled={isDisabled}
            label="defaultChannelBehavior"
            placeholder={`{\n  "responseFormat": "markdown",\n  "enableHistory": true,\n  "maxMessageLength": 4000\n}`}
            minHeight="120px"
          />
        </div>
      </FormSection>

      {/* Section 3: Channel Overrides */}
      <FormSection
        title="Overrides por Canal"
        description="Configurações específicas para canais individuais"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Channel Overrides"
            icon={Layers}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-400">
            Sobrescritas específicas para canais individuais. As configurações aqui têm precedência sobre o comportamento padrão.
          </p>
          <JSONEditor
            value={agent.channelOverrides}
            onChange={(_, isValid, parsed) => {
              if (isValid && parsed) {
                handleFieldChange('channelOverrides', parsed);
              }
            }}
            disabled={isDisabled}
            label="channelOverrides"
            placeholder={`{\n  "web": {\n    "enableTypingIndicator": true\n  },\n  "email": {\n    "signature": "Atenciosamente, ..."\n  }\n}`}
            minHeight="150px"
          />
        </div>

        {/* Override Examples */}
        {!isDisabled && (
          <div className="mt-4">
            <span className="text-xs text-slate-500 mb-2 block">Exemplos de overrides comuns:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { channel: 'web', key: 'enableTypingIndicator', value: true },
                { channel: 'api', key: 'rateLimit', value: '100/min' },
                { channel: 'email', key: 'signature', value: '...' },
                { channel: 'slack', key: 'threadPolicy', value: 'always' },
              ].map((example) => (
                <button
                  key={`${example.channel}-${example.key}`}
                  onClick={() => {
                    const currentOverrides = agent.channelOverrides;
                    const newOverrides = {
                      ...currentOverrides,
                      [example.channel]: {
                        ...(currentOverrides[example.channel] as Record<string, unknown> || {}),
                        [example.key]: example.value,
                      },
                    };
                    handleFieldChange('channelOverrides', newOverrides);
                  }}
                  className="rounded border border-slate-700 bg-slate-900/50 px-2 py-1 text-xs text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400"
                >
                  + {example.channel}.{example.key}
                </button>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {/* Section 4: Effective Channel Policy */}
      {agent.effectiveChannelPolicy && (
        <FormSection
          title="Política de Canais Efetiva"
          description="Configuração resolvida atual"
        >
          <div className="mb-4">
            <FormSectionHeader
              title="Canais Aplicados"
              icon={Radio}
              badge={{ text: 'Resolvido', variant: 'success' }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-70">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Canais Efetivos</label>
              <div className="flex flex-wrap gap-1">
                {agent.effectiveChannelPolicy.allowedChannels.map((channel) => (
                  <span
                    key={channel}
                    className="inline-flex items-center rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Comportamento Padrão</label>
              <textarea
                value={JSON.stringify(agent.effectiveChannelPolicy.defaultChannelBehavior, null, 2)}
                readOnly
                rows={4}
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-xs text-slate-400 cursor-not-allowed font-mono resize-y"
              />
            </div>

            {Object.keys(agent.effectiveChannelPolicy.channelOverrides).length > 0 && (
              <div className="lg:col-span-2 space-y-1">
                <label className="text-sm font-medium text-slate-400">Overrides Aplicados</label>
                <textarea
                  value={JSON.stringify(agent.effectiveChannelPolicy.channelOverrides, null, 2)}
                  readOnly
                  rows={4}
                  className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-xs text-slate-400 cursor-not-allowed font-mono resize-y"
                />
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* Section 5: Summary */}
      <FormSection
        title="Resumo de Canais"
        description="Visão geral da configuração"
      >
        <div className="flex flex-wrap gap-2">
          {agent.allowedChannels.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-300">
                Nenhum canal configurado. O agente não poderá ser utilizado.
              </span>
            </div>
          ) : (
            agent.allowedChannels.map((channel) => (
              <span
                key={channel}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400"
              >
                <Radio className="h-3 w-3" />
                {channel}
              </span>
            ))
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

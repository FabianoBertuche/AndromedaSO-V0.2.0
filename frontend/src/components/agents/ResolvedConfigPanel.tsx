// frontend/src/components/agents/ResolvedConfigPanel.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Sparkles, Cpu, Radio, Bot, GitBranch, Clock, Code, Layers, Tag, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import type { AgentInstance } from '../../types/kernel.js';

export type ResolvedConfigPanelProps = {
  agent: AgentInstance;
  className?: string;
};

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: { text: string; variant: 'info' | 'success' | 'warning' };
};

function CollapsibleSection({ title, description, icon: Icon, children, defaultExpanded = false, badge }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const badgeStyles = {
    info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    success: 'bg-green-500/20 text-green-300 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  };

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800/80">
            <Icon className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-slate-200">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', badgeStyles[badge.variant])}>
              {badge.text}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-700/50 px-4 pb-4 pt-4 bg-slate-950/30">
          {children}
        </div>
      )}
    </div>
  );
}

function JsonBlock({ value, label }: { value: unknown; label?: string }) {
  const formattedJson = value !== null && value !== undefined 
    ? JSON.stringify(value, null, 2) 
    : '{}';
  
  const hasData = value !== null && value !== undefined && Object.keys(value).length > 0;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <pre className={cn(
        'w-full rounded-md border bg-slate-950/80 p-3 font-mono text-xs leading-relaxed overflow-x-auto',
        hasData ? 'border-slate-700 text-slate-300' : 'border-slate-800 text-slate-600'
      )}>
        {formattedJson}
      </pre>
    </div>
  );
}

function ReadOnlyTextArea({ value, rows = 6, label }: { value: string | null; rows?: number; label?: string }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        value={value || ''}
        readOnly
        rows={rows}
        className="w-full rounded-md border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-400 cursor-not-allowed font-mono resize-y focus:outline-none"
      />
    </div>
  );
}

function MetadataBadge({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
      <Icon className="h-4 w-4 text-slate-500" />
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-slate-300">{value}</div>
      </div>
    </div>
  );
}

function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function ResolvedConfigPanel({ agent, className }: ResolvedConfigPanelProps) {
  const hasResolvedData = agent.resolvedConfig !== null || agent.effectiveBehaviorProfile !== null;

  if (!hasResolvedData) {
    return (
      <div className={cn('rounded-lg border border-slate-700/50 bg-slate-900/30 p-8 text-center', className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 mx-auto mb-3">
          <Layers className="h-6 w-6 text-slate-500" />
        </div>
        <h3 className="text-sm font-medium text-slate-400">Configuracao Nao Resolvida</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Esta instancia de agente ainda nao teve sua configuracao resolvida. 
          Execute uma operacao de resolucao para visualizar a configuracao efetiva.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section 1: System Prompt Efetivo */}
      <CollapsibleSection
        title="System Prompt Efetivo"
        description="Prompt final que sera usado nas interacoes"
        icon={FileText}
        defaultExpanded={true}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        <ReadOnlyTextArea 
          value={agent.effectiveSystemPrompt} 
          rows={10}
          label="Prompt Resolvido"
        />
        {agent.resolutionTrace && (
          <div className="mt-3">
            <JsonBlock 
              value={agent.resolutionTrace} 
              label="Origem do Prompt" 
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Section 2: Perfil de Comportamento */}
      <CollapsibleSection
        title="Perfil de Comportamento"
        description="Caracteristicas comportamentais apos resolucao"
        icon={Sparkles}
        defaultExpanded={false}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        {agent.effectiveBehaviorProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Persona</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveBehaviorProfile.persona || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Tom</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveBehaviorProfile.tone || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Estilo</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveBehaviorProfile.style || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Perfil</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveBehaviorProfile.behaviorProfile || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Modo</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveBehaviorProfile.interactionMode || '—'}</div>
              </div>
            </div>
            <JsonBlock value={agent.effectiveBehaviorProfile} label="JSON Completo" />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Perfil comportamental nao disponivel</p>
        )}
      </CollapsibleSection>

      {/* Section 3: Politica de Execucao */}
      <CollapsibleSection
        title="Politica de Execucao"
        description="Politicas de timeout, retry e capacidades"
        icon={Cpu}
        defaultExpanded={false}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        {agent.effectiveExecutionPolicy ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Timeout</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveExecutionPolicy.timeoutMs}ms</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Max Retries</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveExecutionPolicy.retryPolicy.maxRetries}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Backoff</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveExecutionPolicy.retryPolicy.backoffMs}ms</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Estrategia</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveExecutionPolicy.retryPolicy.strategy}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { key: 'toolsEnabled', label: 'Tools' },
                { key: 'knowledgeEnabled', label: 'Knowledge' },
                { key: 'memoryEnabled', label: 'Memory' },
                { key: 'routingEnabled', label: 'Routing' },
                { key: 'handoffEnabled', label: 'Handoff' },
                { key: 'humanEscalationEnabled', label: 'Escalation' }
              ].map(({ key, label }) => (
                <div 
                  key={key} 
                  className={cn(
                    'p-2 rounded-md border text-center text-xs font-medium',
                    agent.effectiveExecutionPolicy?.[key as keyof typeof agent.effectiveExecutionPolicy]
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
            
            <JsonBlock value={agent.effectiveExecutionPolicy} label="JSON Completo" />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Politica de execucao nao disponivel</p>
        )}
      </CollapsibleSection>

      {/* Section 4: Politica de Canais */}
      <CollapsibleSection
        title="Politica de Canais"
        description="Canais permitidos e configuracoes de override"
        icon={Radio}
        defaultExpanded={false}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        {agent.effectiveChannelPolicy ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {agent.effectiveChannelPolicy.allowedChannels.map((channel) => (
                <span 
                  key={channel}
                  className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium"
                >
                  {channel}
                </span>
              ))}
            </div>
            <JsonBlock value={agent.effectiveChannelPolicy} label="JSON Completo" />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Politica de canais nao disponivel</p>
        )}
      </CollapsibleSection>

      {/* Section 5: Politica de Modelo */}
      <CollapsibleSection
        title="Politica de Modelo"
        description="Configuracoes de modelo, provider e parametros de geracao"
        icon={Bot}
        defaultExpanded={false}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        {agent.effectiveModelPolicy ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50 md:col-span-2">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Modelo Preferido</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveModelPolicy.preferredModel || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Temperature</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveModelPolicy.temperature}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Top P</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveModelPolicy.topP}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Max Tokens</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveModelPolicy.maxTokens || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Response Format</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveModelPolicy.responseFormat}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Reasoning Mode</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">{agent.effectiveModelPolicy.reasoningMode || '—'}</div>
              </div>
              <div className="p-3 rounded-md border border-slate-700/50 bg-slate-900/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Providers</div>
                <div className="text-sm text-slate-300 mt-1 font-mono">
                  {agent.effectiveModelPolicy.providerConstraints.length || 'Any'}
                </div>
              </div>
            </div>
            
            {agent.effectiveModelPolicy.allowedModels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Modelos Permitidos:</span>
                {agent.effectiveModelPolicy.allowedModels.map((model) => (
                  <span 
                    key={model}
                    className="px-2 py-1 rounded-full bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs font-medium"
                  >
                    {model}
                  </span>
                ))}
              </div>
            )}
            
            <JsonBlock value={agent.effectiveModelPolicy} label="JSON Completo" />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Politica de modelo nao disponivel</p>
        )}
      </CollapsibleSection>

      {/* Section 6: Rastro de Resolucao */}
      <CollapsibleSection
        title="Rastro de Resolucao"
        description="Historico de origem de cada campo resolvido"
        icon={GitBranch}
        defaultExpanded={false}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        {agent.resolutionTrace ? (
          <JsonBlock value={agent.resolutionTrace} label="Trace de Resolucao" />
        ) : (
          <p className="text-sm text-slate-500">Rastro de resolucao nao disponivel</p>
        )}
      </CollapsibleSection>

      {/* Section 7: Metadados de Resolucao */}
      <CollapsibleSection
        title="Metadados de Resolucao"
        description="Informacoes sobre versao e timestamps da resolucao"
        icon={Clock}
        defaultExpanded={true}
        badge={{ text: 'Read-only', variant: 'info' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetadataBadge 
            label="Versao do Snapshot" 
            value={<span className="text-cyan-400 font-mono">v{agent.configSnapshotVersion}</span>} 
            icon={Tag} 
          />
          <MetadataBadge 
            label="Resolvido em" 
            value={formatDateTime(agent.lastResolvedAt)} 
            icon={Calendar} 
          />
          <MetadataBadge 
            label="Validado em" 
            value={formatDateTime(agent.lastValidatedAt)} 
            icon={Calendar} 
          />
        </div>
      </CollapsibleSection>

      {/* Section 8: Configuracao Bruta */}
      <CollapsibleSection
        title="Configuracao Bruta"
        description="Dados originais de overrides, parametros e configuracao completa"
        icon={Code}
        defaultExpanded={false}
        badge={{ text: 'Read-only', variant: 'warning' }}
      >
        <div className="space-y-4">
          <JsonBlock value={agent.overrides} label="Overrides" />
          <JsonBlock value={agent.explicitParameters} label="Parametros Explicitos" />
          <JsonBlock value={agent.resolvedConfig} label="Configuracao Resolvida (Completa)" />
        </div>
      </CollapsibleSection>
    </div>
  );
}

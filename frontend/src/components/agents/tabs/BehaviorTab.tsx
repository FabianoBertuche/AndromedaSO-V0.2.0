import { useMemo, useState } from 'react';
import { Brain, FileText, Info, ListChecks, Mic, ScrollText, Shield } from 'lucide-react';
import type { AgentBehaviorContext, AgentBehaviorPlaybook, AgentBehaviorRules, AgentInstance } from '../../../types/kernel.js';

export type BehaviorTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

type BehaviorSubTab = 'soul' | 'voice' | 'rules' | 'playbook' | 'context' | 'response-style';

const tabs: Array<{ id: BehaviorSubTab; label: string; icon: React.ElementType }> = [
  { id: 'soul', label: 'Soul', icon: Brain },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'rules', label: 'Rules', icon: Shield },
  { id: 'playbook', label: 'Playbook', icon: ListChecks },
  { id: 'context', label: 'Context', icon: ScrollText },
  { id: 'response-style', label: 'Response Style', icon: FileText }
];

const defaultRules: AgentBehaviorRules = {
  must: [],
  mustNot: [],
  delegateWhen: [],
  reviewWhen: [],
  feedbackWhen: [],
  interruptWhen: [],
  evidenceWhen: []
};

const defaultPlaybook: AgentBehaviorPlaybook = {
  start: [],
  execute: [],
  review: [],
  report: []
};

const defaultContext: AgentBehaviorContext = {
  stack: [],
  architecture: [],
  objectives: [],
  decisions: [],
  constraints: [],
  patterns: []
};

export function BehaviorTab({ agent, onChange, readOnly = false, disabled = false }: BehaviorTabProps) {
  const isDisabled = readOnly || disabled;
  const [activeTab, setActiveTab] = useState<BehaviorSubTab>('soul');

  const rules = useMemo(() => ({ ...defaultRules, ...(agent.overrides?.rules ?? agent.rules ?? {}) }), [agent.rules, agent.overrides?.rules]);
  const playbook = useMemo(() => ({ ...defaultPlaybook, ...(agent.overrides?.playbook ?? agent.playbook ?? {}) }), [agent.playbook, agent.overrides?.playbook]);
  const context = useMemo(() => ({ ...defaultContext, ...(agent.overrides?.context ?? agent.context ?? {}) }), [agent.context, agent.overrides?.context]);

  const updateRules = (key: keyof AgentBehaviorRules, value: string[]) => {
    onChange({ overrides: { rules: { ...rules, [key]: value } } });
  };

  const updatePlaybook = (key: keyof AgentBehaviorPlaybook, value: string[]) => {
    onChange({ overrides: { playbook: { ...playbook, [key]: value } } });
  };

  const updateContext = (key: keyof AgentBehaviorContext, value: string[]) => {
    onChange({ overrides: { context: { ...context, [key]: value } } });
  };

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-900/40 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                active
                  ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'soul' && (
        <Card title="Soul" description="Essência e identidade narrativa do agente">
          <InfoBox>Soul — texto livre para definir a essência do agente: personalidade, origem e valores.</InfoBox>
          <div className="space-y-4 mt-3">
            <label className="text-sm font-medium text-slate-300">Soul</label>
            <textarea
              value={agent.overrides?.soul ?? agent.soul ?? ''}
              onChange={(e) => onChange({ overrides: { soul: e.target.value } })}
              disabled={isDisabled}
              rows={10}
              placeholder="Descreva a essência do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />

            <label className="text-sm font-medium text-slate-300">Persona</label>
            <input
              type="text"
              value={agent.overrides?.persona ?? agent.persona ?? ''}
              onChange={(e) => onChange({ overrides: { persona: e.target.value } })}
              disabled={isDisabled}
              placeholder="Persona do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />

            <label className="text-sm font-medium text-slate-300">Interaction Mode</label>
            <select
              value={agent.overrides?.interactionMode ?? agent.interactionMode ?? 'reactive'}
              onChange={(e) => onChange({ overrides: { interactionMode: e.target.value as 'reactive' | 'proactive' | 'guided' | 'strict' } })}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="reactive">Reactive</option>
              <option value="proactive">Proactive</option>
              <option value="guided">Guided</option>
              <option value="strict">Strict</option>
            </select>

            <label className="text-sm font-medium text-slate-300">Default Language</label>
            <input
              type="text"
              value={agent.overrides?.defaultLanguage ?? agent.defaultLanguage ?? ''}
              onChange={(e) => onChange({ overrides: { defaultLanguage: e.target.value } })}
              disabled={isDisabled}
              placeholder="Idioma padrão do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </Card>
      )}

      {activeTab === 'voice' && (
        <Card title="Voice" description="Tom, presença e ritmo de comunicação">
          <InfoBox>Voice — tom, presença e ritmo de comunicação do agente.</InfoBox>
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-300">Voice</label>
            <textarea
              value={agent.overrides?.voice ?? agent.voice ?? ''}
              onChange={(e) => onChange({ overrides: { voice: e.target.value } })}
              disabled={isDisabled}
              rows={8}
              placeholder="Defina como o agente deve soar..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </Card>
      )}

      {activeTab === 'rules' && (
        <Card title="Rules" description="Regras comportamentais obrigatórias e condicionais">
          <InfoBox>Rules — lista de regras que o agente não pode quebrar, mesmo que o usuário insista.</InfoBox>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-3">
            <ChipList
              title="Must"
              values={rules.must}
              onChange={(values) => updateRules('must', values)}
              disabled={isDisabled}
              colorScheme="red"
            />
            <ChipList
              title="Must Not"
              values={rules.mustNot}
              onChange={(values) => updateRules('mustNot', values)}
              disabled={isDisabled}
              colorScheme="red"
            />
            <ChipList
              title="Delegate When"
              values={rules.delegateWhen}
              onChange={(values) => updateRules('delegateWhen', values)}
              disabled={isDisabled}
              colorScheme="yellow"
            />
            <ChipList
              title="Review When"
              values={rules.reviewWhen}
              onChange={(values) => updateRules('reviewWhen', values)}
              disabled={isDisabled}
              colorScheme="yellow"
            />
            <ChipList
              title="Feedback When"
              values={rules.feedbackWhen}
              onChange={(values) => updateRules('feedbackWhen', values)}
              disabled={isDisabled}
              colorScheme="yellow"
            />
            <ChipList
              title="Interrupt When"
              values={rules.interruptWhen}
              onChange={(values) => updateRules('interruptWhen', values)}
              disabled={isDisabled}
              colorScheme="orange"
            />
            <div className="lg:col-span-2">
              <ChipList
                title="Evidence When"
                values={rules.evidenceWhen}
                onChange={(values) => updateRules('evidenceWhen', values)}
                disabled={isDisabled}
                colorScheme="yellow"
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'playbook' && (
        <Card title="Playbook" description="Fluxo operacional por fase">
          <InfoBox>Playbook — método passo a passo que o agente deve seguir.</InfoBox>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-3">
            <ChipList
              title="Start"
              values={playbook.start}
              onChange={(values) => updatePlaybook('start', values)}
              disabled={isDisabled}
              colorScheme="cyan"
            />
            <ChipList
              title="Execute"
              values={playbook.execute}
              onChange={(values) => updatePlaybook('execute', values)}
              disabled={isDisabled}
              colorScheme="cyan"
            />
            <ChipList
              title="Review"
              values={playbook.review}
              onChange={(values) => updatePlaybook('review', values)}
              disabled={isDisabled}
              colorScheme="yellow"
            />
            <ChipList
              title="Report"
              values={playbook.report}
              onChange={(values) => updatePlaybook('report', values)}
              disabled={isDisabled}
              colorScheme="yellow"
            />
          </div>
        </Card>
      )}

      {activeTab === 'context' && (
        <Card title="Context" description="Contexto estável de atuação do agente">
          <InfoBox>Context — informações estáveis de background sobre o ambiente onde o agente trabalha.</InfoBox>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-3">
            <ChipList
              title="Stack"
              values={context.stack}
              onChange={(values) => updateContext('stack', values)}
              disabled={isDisabled}
            />
            <ChipList
              title="Architecture"
              values={context.architecture}
              onChange={(values) => updateContext('architecture', values)}
              disabled={isDisabled}
            />
            <ChipList
              title="Objectives"
              values={context.objectives}
              onChange={(values) => updateContext('objectives', values)}
              disabled={isDisabled}
            />
            <ChipList
              title="Decisions"
              values={context.decisions}
              onChange={(values) => updateContext('decisions', values)}
              disabled={isDisabled}
            />
            <ChipList
              title="Constraints"
              values={context.constraints}
              onChange={(values) => updateContext('constraints', values)}
              disabled={isDisabled}
            />
            <ChipList
              title="Patterns"
              values={context.patterns}
              onChange={(values) => updateContext('patterns', values)}
              disabled={isDisabled}
            />
          </div>
        </Card>
      )}

      {activeTab === 'response-style' && (
        <Card title="Response Style" description="Formato e estrutura de resposta">
          <InfoBox>Response Style — como o agente organiza e entrega respostas: fluidez, estrutura e formato.</InfoBox>
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-300">Response Style</label>
            <textarea
              value={agent.overrides?.responseStyle ?? agent.responseStyle ?? ''}
              onChange={(e) => onChange({ overrides: { responseStyle: e.target.value } })}
              disabled={isDisabled}
              rows={8}
              placeholder="Defina como as respostas devem ser organizadas..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </Card>
      )}
    </div>
  );
}

type CardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function Card({ title, description, children }: CardProps) {
  return (
    <section className="space-y-3 rounded-lg border border-cyan-500/20 bg-slate-900/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-cyan-300">{title}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

type ChipListProps = {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  colorScheme?: 'cyan' | 'red' | 'yellow' | 'orange';
};

const colorSchemes = {
  cyan: {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-200',
    hover: 'text-cyan-100'
  },
  red: {
    border: 'border-red-500/50',
    bg: 'bg-red-500/10',
    text: 'text-red-200',
    hover: 'text-red-100'
  },
  yellow: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-200',
    hover: 'text-yellow-100'
  },
  orange: {
    border: 'border-orange-500/50',
    bg: 'bg-orange-500/10',
    text: 'text-orange-200',
    hover: 'text-orange-100'
  }
};

function ChipList({ title, values, onChange, disabled = false, colorScheme = 'cyan' }: ChipListProps) {
  const colors = colorSchemes[colorScheme];

  const removeItem = (index: number) => {
    onChange(values.filter((_, current) => current !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const nextValue = event.currentTarget.value.trim();
    if (!nextValue || values.includes(nextValue)) return;
    onChange([...values, nextValue]);
    event.currentTarget.value = '';
  };

  return (
    <div className="space-y-2 rounded-md border border-slate-700 bg-slate-950/40 p-3">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-300">{title}</label>
      <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2">
        {values.map((value, index) => (
          <span key={`${value}-${index}`} className={`inline-flex items-center gap-1 rounded-full border ${colors.border} ${colors.bg} px-2 py-1 text-xs ${colors.text}`}>
            {value}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className={`${colors.hover} hover:font-bold`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Adicionar item..."
          className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded border border-slate-600 bg-slate-900/30 p-3 text-sm text-slate-300">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
      {children}
    </div>
  );
}

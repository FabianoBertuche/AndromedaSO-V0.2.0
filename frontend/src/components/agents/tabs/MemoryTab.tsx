import { useState } from 'react';
import { ChevronDown, ChevronRight, Database } from 'lucide-react';
import type { AgentInstance } from '../../../types/kernel.js';

export type MemoryTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-cyan-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function MemoryTab({ agent, onChange, readOnly = false, disabled = false }: MemoryTabProps) {
  const isDisabled = readOnly || disabled;
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const updateMemory = (updates: Partial<AgentInstance['memory']>) => {
    const nextMemory = {
      ...agent.memory,
      ...updates
    };
    onChange({ memory: nextMemory });
  };

  const retentionDisabled = agent.memory?.memoryScopeType === 'session';

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border border-cyan-500/20 bg-slate-900/40 p-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-cyan-300">Configuração de Memória</h3>
        </div>

        <div className="space-y-4">
          {/* Session Memory: toggle + label */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Session Memory</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {agent.memory?.memorySessionEnabled ? 'Ativado' : 'Desativado'}
              </span>
              <ToggleSwitch
                checked={agent.memory?.memorySessionEnabled ?? false}
                onChange={(v) => updateMemory({ memorySessionEnabled: v })}
                disabled={isDisabled}
                label="Session Memory"
              />
            </div>
          </div>

          {/* Scope Type + Max Entries */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Memory Scope</label>
              <select
                value={agent.memory?.memoryScopeType ?? 'session'}
                onChange={(e) => updateMemory({ memoryScopeType: e.target.value as AgentInstance['memory']['memoryScopeType'] })}
                disabled={isDisabled}
                className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              >
                <option value="session">Session</option>
                <option value="persistent">Persistent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Memory Max Entries</label>
              <input
                type="number"
                min={1}
                value={agent.memory?.memoryMaxEntries ?? 100}
                onChange={(e) => updateMemory({ memoryMaxEntries: Number(e.target.value) || 1 })}
                disabled={isDisabled}
                className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Shared Memory: toggle + label */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Shared Memory</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {agent.memory?.memoryShared ? 'Ativado' : 'Desativado'}
              </span>
              <ToggleSwitch
                checked={agent.memory?.memoryShared ?? false}
                onChange={(v) => updateMemory({ memoryShared: v })}
                disabled={isDisabled}
                label="Shared Memory"
              />
            </div>
          </div>

          {/* Retention Period */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Retention Period</label>
            <select
              value={agent.memory?.memoryRetentionPeriod ?? 'session'}
              onChange={(e) => updateMemory({ memoryRetentionPeriod: e.target.value as AgentInstance['memory']['memoryRetentionPeriod'] })}
              disabled={isDisabled || retentionDisabled}
              title={retentionDisabled ? 'Não aplicável para memória de sessão' : undefined}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="session">Session</option>
              <option value="24h">24h</option>
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="forever">Forever</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/30">
        <button
          type="button"
          onClick={() => setGlossaryOpen((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-medium text-slate-200">About Memory ▼</span>
          {glossaryOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </button>
        {glossaryOpen && (
          <div className="space-y-3 border-t border-slate-700 px-4 py-3 text-sm text-slate-400">
            <p>
              <span className="text-cyan-400">Session Memory:</span>{' '}
              Memória mantida durante a sessão ativa.忘れた情報を保持し，会话中に参照できる。
            </p>
            <p>
              <span className="text-cyan-400">Memory Scope:</span>{' '}
              Define se os dados ficam só na sessão (temporário) ou persistem entre sessões (permanente).
            </p>
            <p>
              <span className="text-cyan-400">Memory Max Entries:</span>{' '}
              Limite máximo de entradas armazenadas antes de pruning automático.
            </p>
            <p>
              <span className="text-cyan-400">Shared Memory:</span>{' '}
              Permite compartilhamento de memória com outros agentes especificados no sistema.
            </p>
            <p>
              <span className="text-cyan-400">Retention Period:</span>{' '}
              Período de retenção antes de os dados serem descartados. Não aplicável para memória de sessão.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

import type { AgentChatOption } from '../../hooks/useAgentChatConsole.js';

type AgentChatSelectorProps = {
  agents: AgentChatOption[];
  selectedAgentId: string | null;
  disabled: boolean;
  onSelectAgent: (agentId: string) => void;
};

export function AgentChatSelector({ agents, selectedAgentId, disabled, onSelectAgent }: AgentChatSelectorProps) {
  return (
    <label className="flex flex-col gap-2 font-mono text-sm">
      <span className="text-xs uppercase tracking-[0.35em] text-cyan-400 font-semibold">Agent</span>
      <select
        aria-label="Agent"
        value={selectedAgentId ?? ''}
        disabled={disabled || agents.length === 0}
        onChange={(event) => onSelectAgent(event.target.value)}
        className="rounded-2xl border-2 border-cyan-400/50 bg-slate-800 px-4 py-3 text-sm text-white shadow-lg outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
      >
        {agents.length === 0 ? (
          <option value="">No active agents available</option>
        ) : (
          agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} {agent.preferredModel ? `• ${agent.preferredModel}` : '(no model configured)'}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

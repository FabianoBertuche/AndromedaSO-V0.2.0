import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchAgent, fetchAgents } from '../api/kernel';
import type { Agent } from '../types/kernel';
import { FeedbackModal } from './FeedbackModal';

type AgentTableProps = {
  discoveredAgentIds: string[];
};

function Badge({ successRate }: { successRate: number }) {
  if (successRate > 0.9) {
    return <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300 ring-1 ring-emerald-500/50">🟢 success</span>;
  }
  if (successRate >= 0.7) {
    return <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300 ring-1 ring-amber-500/50">🟡 warning</span>;
  }
  return <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs text-rose-300 ring-1 ring-rose-500/50">🔴 critical</span>;
}

export function AgentTable({ discoveredAgentIds }: AgentTableProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const listedAgentsQuery = useQuery({
    queryKey: ['agents', 'list'],
    queryFn: fetchAgents,
    refetchInterval: 4000,
    staleTime: 1500
  });

  const allAgentIds = useMemo(() => {
    const merged = [...(listedAgentsQuery.data ?? []), ...discoveredAgentIds];
    return [...new Set(merged)].filter(Boolean);
  }, [discoveredAgentIds, listedAgentsQuery.data]);

  const agentQueries = useQueries({
    queries: allAgentIds.map((agentId) => ({
      queryKey: ['agents', 'detail', agentId],
      queryFn: () => fetchAgent(agentId),
      refetchInterval: 5000,
      staleTime: 2000
    }))
  });

  const rows = agentQueries.map((query) => query.data).filter((row): row is Agent => Boolean(row));
  const isLoading = listedAgentsQuery.isLoading || agentQueries.some((query) => query.isLoading || query.isFetching);
  const error = listedAgentsQuery.error ?? agentQueries.find((query) => query.error)?.error;

  return (
    <section id="agent-table" className="h-full w-full rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition-all">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl text-white">Agent Table</h3>
        <span className="text-xs uppercase tracking-[0.15em] text-slate-300">Real-time</span>
      </header>

      {error ? <p className="mb-3 text-sm text-rose-300">Erro ao carregar agentes: {(error as Error).message}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-white/20">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/40 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">id</th>
              <th className="px-4 py-3 font-medium">Performance P95</th>
              <th className="px-4 py-3 font-medium">Reputation Score</th>
              <th className="px-4 py-3 font-medium">Budget (spent/limit)</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/20 text-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelectedAgent(row)}
                className="cursor-pointer transition-all hover:scale-[1.01] hover:bg-indigo-500/20"
              >
                <td className="px-4 py-3 font-medium text-cyan-300">{row.id}</td>
                <td className="px-4 py-3">{row.performanceP95} ms</td>
                <td className="px-4 py-3">{row.reputationScore.toFixed(3)}</td>
                <td className="px-4 py-3">{row.budgetSpent}/{row.budgetLimit}</td>
                <td className="px-4 py-3"><Badge successRate={row.successRate} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-300">Nenhum agente para exibir. Rode o discovery para popular a tabela.</p>
      ) : null}

      {isLoading ? <p className="mt-3 text-sm text-slate-300">Atualizando dados dos agentes...</p> : null}

      {selectedAgent ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
            <h4 className="text-xl font-semibold text-white">Agent Details</h4>
            <p className="mt-1 text-sm text-slate-300">{selectedAgent.id}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-950/40 p-3">P95: {selectedAgent.performanceP95} ms</div>
              <div className="rounded-xl bg-slate-950/40 p-3">Success: {(selectedAgent.successRate * 100).toFixed(1)}%</div>
              <div className="rounded-xl bg-slate-950/40 p-3">Reputation: {selectedAgent.reputationScore.toFixed(3)}</div>
              <div className="rounded-xl bg-slate-950/40 p-3">Budget: {selectedAgent.budgetSpent}/{selectedAgent.budgetLimit}</div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="rounded-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-105"
              >
                Feedback
              </button>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition-all hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultTaskId={selectedAgent ? `task-${selectedAgent.id}` : ''}
        defaultAgentId={selectedAgent?.id ?? ''}
      />
    </section>
  );
}

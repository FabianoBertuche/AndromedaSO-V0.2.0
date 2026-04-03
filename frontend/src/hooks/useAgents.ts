import { useQueries } from '@tanstack/react-query';
import {
  fetchAgentBudget,
  fetchAgentPerformance,
  fetchAgentReputation
} from '../api/kernel';

export type AgentRow = {
  id: string;
  performance: string;
  reputation: string;
  budget: string;
};

export function useAgents(agentIds: string[]) {
  const uniqueIds = [...new Set(agentIds)].filter(Boolean);

  const queries = useQueries({
    queries: uniqueIds.map((agentId) => ({
      queryKey: ['agents', agentId],
      queryFn: async (): Promise<AgentRow> => {
        const [performance, reputation, budget] = await Promise.all([
          fetchAgentPerformance(agentId),
          fetchAgentReputation(agentId),
          fetchAgentBudget(agentId)
        ]);

        const latestPerformance = performance.records[performance.records.length - 1];
        const reputationValues = Object.values(reputation);
        const reputationAvg = reputationValues.length > 0
          ? reputationValues.reduce((sum, value) => sum + value, 0) / reputationValues.length
          : 0;

        return {
          id: agentId,
          performance: latestPerformance
            ? `${Math.round(latestPerformance.successRate * 100)}% SR • p95 ${latestPerformance.latencyP95}ms`
            : 'No data',
          reputation: reputationValues.length > 0 ? reputationAvg.toFixed(3) : 'No data',
          budget: budget.budget
            ? `${budget.budget.spentDaily}/${budget.budget.dailyLimit} day • ${budget.budget.spentMonthly}/${budget.budget.monthlyLimit} month`
            : 'Not configured'
        };
      },
      enabled: uniqueIds.length > 0,
      refetchInterval: 4000,
      staleTime: 2000
    }))
  });

  const isLoading = queries.some((query) => query.isLoading || query.isFetching);
  const error = queries.find((query) => query.error)?.error as Error | undefined;
  const rows = queries
    .map((query) => query.data)
    .filter((row): row is AgentRow => Boolean(row));

  return {
    rows,
    isLoading,
    error
  };
}

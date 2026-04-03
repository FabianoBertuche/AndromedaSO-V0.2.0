export type Agent = {
  id: string;
  performanceP95: number;
  successRate: number;
  reputationScore: number;
  budgetSpent: number;
  budgetLimit: number;
};

export type CostTrendPoint = {
  agentId: string;
  month: string;
  spent: number;
};

export type CostData = {
  generatedAt: string;
  agents: Array<{
    agentId: string;
    spentDaily: number;
    spentMonthly: number;
    remainingDaily: number;
    remainingMonthly: number;
  }>;
  trend: CostTrendPoint[];
};

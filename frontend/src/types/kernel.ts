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

export type OrchestratorSubtask = {
  id: string;
  title: string;
  capability: string;
  status: 'pending' | 'running' | 'completed' | 'blocked';
};

export type TaskNode = {
  id: string;
  title: string;
  state: 'pending' | 'running' | 'completed' | 'blocked' | 'human_fallback';
  assignee?: string;
  children?: TaskNode[];
};

export type AgentState = {
  id: string;
  role: string;
  capability: string;
  reputation: number;
  status: 'idle' | 'planning' | 'collaborating' | 'blocked' | 'waiting_human' | 'done';
};

export type OrchestratorStatus = {
  activeTeams: number;
  pending: number;
};

export type OrchestrationDetail = {
  tree: TaskNode[];
  agentStates: AgentState[];
  messages?: Array<{
    from: string;
    to: string;
    content: string;
    timestamp: string;
  }>;
  requiresHumanFallback?: boolean;
};

export type MultiTaskResponse = {
  taskId: string;
  subtasks: OrchestratorSubtask[];
  requiresHumanFallback?: boolean;
};


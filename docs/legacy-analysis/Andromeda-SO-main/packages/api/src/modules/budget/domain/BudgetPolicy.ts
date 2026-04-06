export interface AgentBudgetPolicyView {
    agentId: string;
    dailyLimitUsd: number;
    monthlyLimitUsd: number;
    dailySpentUsd: number;
    monthlySpentUsd: number;
    currency: string;
    alertsEnabled: boolean;
    lastDailyResetAt: string | null;
    lastMonthlyResetAt: string | null;
    updatedAt: string;
}

export interface BudgetReportItem {
    agentId: string;
    costUsd: number;
    dailyLimitUsd: number | null;
    monthlyLimitUsd: number | null;
    utilizationPct: number | null;
    executions: number;
}

export interface BudgetReportView {
    range: {
        from: string;
        to: string;
    };
    currency: string;
    totals: {
        costUsd: number;
        agents: number;
        executions: number;
    };
    items: BudgetReportItem[];
}

export interface UpsertBudgetPolicyInput {
    tenantId: string;
    agentId: string;
    dailyLimitUsd: number;
    monthlyLimitUsd: number;
    currency?: string;
    alertsEnabled?: boolean;
}

export interface BudgetGuardInput {
    tenantId: string;
    agentId?: string;
    estimatedCostUsd: number;
}

export interface BudgetSpendInput {
    tenantId: string;
    taskId: string;
    agentId?: string;
    sessionId?: string;
    capability?: string;
    status: string;
    model?: string;
    provider?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
    costUsd: number;
    conformanceScore?: number;
    executionStartedAt?: Date;
    executionCompletedAt?: Date;
    resultSnapshot?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface BudgetReportFilters {
    tenantId: string;
    from: Date;
    to: Date;
    agentId?: string;
}

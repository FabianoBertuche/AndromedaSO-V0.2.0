export interface AgentPerformanceRecordView {
    agentId: string;
    periodType: string;
    periodStart: string;
    periodEnd: string;
    tasksTotal: number;
    tasksSucceeded: number;
    tasksFailed: number;
    successRate: number;
    avgConformance: number | null;
    feedbackScore: number | null;
    avgLatencyMs: number | null;
    totalTokensUsed: number;
    totalCostUsd: number;
    reputationScores: Record<string, number>;
    reputationUpdatedAt: string | null;
    metricsSnapshot: Record<string, unknown> | null;
}

export interface ConsolidatedAgentMetrics {
    agentId: string;
    periodType: string;
    periodStart: Date;
    periodEnd: Date;
    tasksTotal: number;
    tasksSucceeded: number;
    tasksFailed: number;
    successRate: number;
    avgConformance: number | null;
    feedbackScore: number | null;
    avgLatencyMs: number | null;
    totalTokensUsed: number;
    totalCostUsd: number;
    metricsSnapshot: Record<string, unknown> | null;
}

export interface ReputationCapabilityMetric {
    capability: string;
    successRate: number;
    conformance: number;
    feedback: number;
}

export interface PerformanceTrendPoint {
    weekStart: string;
    avgSuccessRate: number;
    avgConformanceScore: number;
    totalCostUsd: number;
}

export interface PerformanceRepository {
    listAgentRecords(agentId: string, tenantId: string, options: { from: Date; to: Date; periodType?: string }): Promise<AgentPerformanceRecordView[]>;
    listTrend(agentId: string, tenantId: string, options: { from: Date; to: Date }): Promise<PerformanceTrendPoint[]>;
    consolidateWindow(tenantId: string, periodType: string, periodStart: Date, periodEnd: Date): Promise<ConsolidatedAgentMetrics[]>;
    upsertRecord(tenantId: string, input: ConsolidatedAgentMetrics): Promise<void>;
    getCapabilityMetrics(agentId: string, tenantId: string, since: Date): Promise<ReputationCapabilityMetric[]>;
    saveReputation(agentId: string, tenantId: string, reputationScores: Record<string, number>, updatedAt: Date): Promise<void>;
}

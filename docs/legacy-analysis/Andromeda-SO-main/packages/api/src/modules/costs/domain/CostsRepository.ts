export interface CostsSummaryPoint {
    bucket: string;
    costUsd: number;
    tokensUsed: number;
    executions: number;
}

export interface CostsSummaryView {
    range: {
        from: string;
        to: string;
    };
    currency: string;
    totals: {
        costUsd: number;
        tokensUsed: number;
        executions: number;
        avgCostPerExecutionUsd: number;
    };
    series: CostsSummaryPoint[];
}

export interface CostsByAgentItem {
    agentId: string;
    executions: number;
    tokensUsed: number;
    costUsd: number;
    avgLatencyMs: number | null;
}

export interface CostsByAgentView {
    range: {
        from: string;
        to: string;
    };
    items: CostsByAgentItem[];
}

export interface CostsFilters {
    tenantId: string;
    from: Date;
    to: Date;
    limit?: number;
}

export interface CostsRepository {
    getSummary(filters: CostsFilters): Promise<CostsSummaryView>;
    getByAgent(filters: CostsFilters): Promise<CostsByAgentView>;
    exportCsv(filters: CostsFilters & { groupBy: "agent" | "day" }): Promise<string>;
}

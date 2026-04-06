import { CostsByAgentView, CostsFilters, CostsRepository, CostsSummaryView } from "../domain/CostsRepository";

export class PrismaCostsRepository implements CostsRepository {
    constructor(private readonly prisma: any) { }

    async getSummary(filters: CostsFilters): Promise<CostsSummaryView> {
        const rows = await this.prisma.agentExecutionLedger.findMany({
            where: baseWhere(filters),
            select: {
                executionCompletedAt: true,
                costUsd: true,
                totalTokens: true,
            },
            orderBy: { executionCompletedAt: "asc" },
        });

        const grouped = new Map<string, { costUsd: number; tokensUsed: number; executions: number }>();
        for (const row of rows) {
            const bucket = toBucket(row.executionCompletedAt);
            const current = grouped.get(bucket) || { costUsd: 0, tokensUsed: 0, executions: 0 };
            current.costUsd += toNumber(row.costUsd);
            current.tokensUsed += Number(row.totalTokens || 0);
            current.executions += 1;
            grouped.set(bucket, current);
        }

        const series = [...grouped.entries()].map(([bucket, value]) => ({
            bucket,
            costUsd: roundCurrency(value.costUsd),
            tokensUsed: value.tokensUsed,
            executions: value.executions,
        }));
        const totals = series.reduce((acc, item) => ({
            costUsd: acc.costUsd + item.costUsd,
            tokensUsed: acc.tokensUsed + item.tokensUsed,
            executions: acc.executions + item.executions,
        }), { costUsd: 0, tokensUsed: 0, executions: 0 });

        return {
            range: {
                from: filters.from.toISOString(),
                to: filters.to.toISOString(),
            },
            currency: "USD",
            totals: {
                costUsd: roundCurrency(totals.costUsd),
                tokensUsed: totals.tokensUsed,
                executions: totals.executions,
                avgCostPerExecutionUsd: totals.executions > 0 ? roundCurrency(totals.costUsd / totals.executions) : 0,
            },
            series,
        };
    }

    async getByAgent(filters: CostsFilters): Promise<CostsByAgentView> {
        const rows = await this.prisma.agentExecutionLedger.findMany({
            where: baseWhere(filters),
            select: {
                agentId: true,
                totalTokens: true,
                costUsd: true,
                latencyMs: true,
            },
        });

        const grouped = new Map<string, { executions: number; tokensUsed: number; costUsd: number; latencySum: number; latencyCount: number }>();
        for (const row of rows) {
            const current = grouped.get(row.agentId) || { executions: 0, tokensUsed: 0, costUsd: 0, latencySum: 0, latencyCount: 0 };
            current.executions += 1;
            current.tokensUsed += Number(row.totalTokens || 0);
            current.costUsd += toNumber(row.costUsd);
            if (typeof row.latencyMs === "number") {
                current.latencySum += row.latencyMs;
                current.latencyCount += 1;
            }
            grouped.set(row.agentId, current);
        }

        const items = [...grouped.entries()].map(([agentId, value]) => ({
            agentId,
            executions: value.executions,
            tokensUsed: value.tokensUsed,
            costUsd: roundCurrency(value.costUsd),
            avgLatencyMs: value.latencyCount > 0 ? Math.round(value.latencySum / value.latencyCount) : null,
        })).sort((left, right) => right.costUsd - left.costUsd);

        return {
            range: {
                from: filters.from.toISOString(),
                to: filters.to.toISOString(),
            },
            items: typeof filters.limit === "number" ? items.slice(0, filters.limit) : items,
        };
    }

    async exportCsv(filters: CostsFilters & { groupBy: "agent" | "day" }): Promise<string> {
        if (filters.groupBy === "day") {
            const summary = await this.getSummary(filters);
            const lines = ["bucket,costUsd,tokensUsed,executions"];
            for (const item of summary.series) {
                lines.push(`${item.bucket},${item.costUsd},${item.tokensUsed},${item.executions}`);
            }
            return `${lines.join("\n")}\n`;
        }

        const byAgent = await this.getByAgent(filters);
        const lines = ["agentId,executions,tokensUsed,costUsd,avgLatencyMs"];
        for (const item of byAgent.items) {
            lines.push(`${item.agentId},${item.executions},${item.tokensUsed},${item.costUsd},${item.avgLatencyMs ?? ""}`);
        }
        return `${lines.join("\n")}\n`;
    }
}

function baseWhere(filters: CostsFilters) {
    return {
        tenantId: filters.tenantId,
        executionCompletedAt: {
            gte: filters.from,
            lte: filters.to,
        },
    };
}

function toBucket(value: Date | null): string {
    const date = value || new Date();
    return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number {
    if (typeof value === "number") return value;
    if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
        return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value || 0);
}

function roundCurrency(value: number): number {
    return Math.round(value * 10000) / 10000;
}

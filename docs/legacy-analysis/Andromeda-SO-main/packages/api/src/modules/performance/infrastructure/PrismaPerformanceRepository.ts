import {
    AgentPerformanceRecordView,
    ConsolidatedAgentMetrics,
    PerformanceRepository,
    PerformanceTrendPoint,
    ReputationCapabilityMetric,
} from "../domain/PerformanceRepository";

export class PrismaPerformanceRepository implements PerformanceRepository {
    constructor(private readonly prisma: any) { }

    async listAgentRecords(agentId: string, tenantId: string, options: { from: Date; to: Date; periodType?: string; }): Promise<AgentPerformanceRecordView[]> {
        const rows = await this.prisma.agentPerformanceRecord.findMany({
            where: {
                agentId,
                tenantId,
                periodType: options.periodType,
                periodStart: { gte: options.from },
                periodEnd: { lte: options.to },
            },
            orderBy: { periodStart: "desc" },
        });

        return rows.map(mapPerformanceRow);
    }

    async listTrend(agentId: string, tenantId: string, options: { from: Date; to: Date; }): Promise<PerformanceTrendPoint[]> {
        const rows = await this.prisma.agentPerformanceRecord.findMany({
            where: {
                agentId,
                tenantId,
                periodType: "daily",
                periodStart: { gte: options.from },
                periodEnd: { lte: options.to },
            },
            orderBy: { periodStart: "asc" },
        });

        const grouped = new Map<string, { successRates: number[]; conformanceScores: number[]; totalCostUsd: number }>();
        for (const row of rows) {
            const weekStart = toUtcWeekStart(row.periodStart).toISOString();
            const current = grouped.get(weekStart) || { successRates: [], conformanceScores: [], totalCostUsd: 0 };
            current.successRates.push(toNumber(row.successRate));
            if (row.avgConformance !== null) {
                current.conformanceScores.push(toNumber(row.avgConformance));
            }
            current.totalCostUsd += toNumber(row.totalCostUsd);
            grouped.set(weekStart, current);
        }

        return [...grouped.entries()].map(([weekStart, value]) => ({
            weekStart,
            avgSuccessRate: average(value.successRates),
            avgConformanceScore: average(value.conformanceScores),
            totalCostUsd: round(value.totalCostUsd),
        })).sort((left, right) => right.weekStart.localeCompare(left.weekStart));
    }

    async consolidateWindow(tenantId: string, periodType: string, periodStart: Date, periodEnd: Date): Promise<ConsolidatedAgentMetrics[]> {
        const ledgerRows = await this.prisma.agentExecutionLedger.findMany({
            where: {
                tenantId,
                executionCompletedAt: {
                    gte: periodStart,
                    lte: periodEnd,
                },
            },
            orderBy: { executionCompletedAt: "asc" },
        });

        const grouped = new Map<string, Array<any>>();
        for (const row of ledgerRows) {
            const current = grouped.get(row.agentId) || [];
            current.push(row);
            grouped.set(row.agentId, current);
        }

        return [...grouped.entries()].map(([agentId, rows]) => {
            const tasksTotal = rows.length;
            const tasksSucceeded = rows.filter((row) => row.status === "completed").length;
            const tasksFailed = rows.filter((row) => row.status === "failed").length;
            const conformanceValues = rows.map((row) => row.conformanceScore).filter((value) => value !== null).map(toNumber);
            const feedbackRatings = rows.map((row) => row.feedbackRating).filter((value) => typeof value === "number") as number[];
            const latencyValues = rows.map((row) => row.latencyMs).filter((value) => typeof value === "number") as number[];
            const capabilityBreakdown = rows.reduce<Record<string, { total: number; success: number; feedback: number[]; conformance: number[] }>>((acc, row) => {
                const capability = typeof row.capability === "string" && row.capability.trim().length > 0 ? row.capability.trim() : "general";
                const bucket = acc[capability] || { total: 0, success: 0, feedback: [], conformance: [] };
                bucket.total += 1;
                if (row.status === "completed") {
                    bucket.success += 1;
                }
                if (typeof row.feedbackRating === "number") {
                    bucket.feedback.push(normalizeFeedback(row.feedbackRating));
                }
                if (row.conformanceScore !== null) {
                    bucket.conformance.push(toNumber(row.conformanceScore));
                }
                acc[capability] = bucket;
                return acc;
            }, {});

            return {
                agentId,
                periodType,
                periodStart,
                periodEnd,
                tasksTotal,
                tasksSucceeded,
                tasksFailed,
                successRate: tasksTotal > 0 ? round(tasksSucceeded / tasksTotal) : 0,
                avgConformance: conformanceValues.length > 0 ? round(average(conformanceValues)) : null,
                feedbackScore: feedbackRatings.length > 0 ? round(average(feedbackRatings.map(normalizeFeedback))) : null,
                avgLatencyMs: latencyValues.length > 0 ? Math.round(average(latencyValues)) : null,
                totalTokensUsed: rows.reduce((sum, row) => sum + Number(row.totalTokens || 0), 0),
                totalCostUsd: round(rows.reduce((sum, row) => sum + toNumber(row.costUsd), 0)),
                metricsSnapshot: {
                    capabilities: Object.fromEntries(Object.entries(capabilityBreakdown).map(([capability, bucket]) => [capability, {
                        tasksTotal: bucket.total,
                        successRate: bucket.total > 0 ? round(bucket.success / bucket.total) : 0,
                        avgConformance: bucket.conformance.length > 0 ? round(average(bucket.conformance)) : 0,
                        avgFeedbackScore: bucket.feedback.length > 0 ? round(average(bucket.feedback)) : 0,
                    }])),
                },
            };
        });
    }

    async upsertRecord(tenantId: string, input: ConsolidatedAgentMetrics): Promise<void> {
        await this.prisma.agentPerformanceRecord.upsert({
            where: {
                tenantId_agentId_periodType_periodStart_periodEnd: {
                    tenantId,
                    agentId: input.agentId,
                    periodType: input.periodType,
                    periodStart: input.periodStart,
                    periodEnd: input.periodEnd,
                },
            },
            create: {
                tenantId,
                agentId: input.agentId,
                periodType: input.periodType,
                periodStart: input.periodStart,
                periodEnd: input.periodEnd,
                tasksTotal: input.tasksTotal,
                tasksSucceeded: input.tasksSucceeded,
                tasksFailed: input.tasksFailed,
                successRate: input.successRate,
                avgConformance: input.avgConformance,
                feedbackScore: input.feedbackScore,
                avgLatencyMs: input.avgLatencyMs,
                totalTokensUsed: input.totalTokensUsed,
                totalCostUsd: input.totalCostUsd,
                metricsSnapshot: input.metricsSnapshot,
            },
            update: {
                tasksTotal: input.tasksTotal,
                tasksSucceeded: input.tasksSucceeded,
                tasksFailed: input.tasksFailed,
                successRate: input.successRate,
                avgConformance: input.avgConformance,
                feedbackScore: input.feedbackScore,
                avgLatencyMs: input.avgLatencyMs,
                totalTokensUsed: input.totalTokensUsed,
                totalCostUsd: input.totalCostUsd,
                metricsSnapshot: input.metricsSnapshot,
            },
        });
    }

    async getCapabilityMetrics(agentId: string, tenantId: string, since: Date): Promise<ReputationCapabilityMetric[]> {
        const rows = await this.prisma.agentExecutionLedger.findMany({
            where: {
                tenantId,
                agentId,
                executionCompletedAt: { gte: since },
            },
        });

        const grouped = new Map<string, Array<any>>();
        for (const row of rows) {
            const capability = typeof row.capability === "string" && row.capability.trim().length > 0 ? row.capability.trim() : "general";
            const current = grouped.get(capability) || [];
            current.push(row);
            grouped.set(capability, current);
        }

        return [...grouped.entries()].map(([capability, capabilityRows]) => {
            const total = capabilityRows.length;
            const succeeded = capabilityRows.filter((row) => row.status === "completed").length;
            const conformanceValues = capabilityRows.map((row) => row.conformanceScore).filter((value) => value !== null).map(toNumber);
            const feedbackValues = capabilityRows.map((row) => row.feedbackRating).filter((value) => typeof value === "number").map(normalizeFeedback);

            return {
                capability,
                successRate: total > 0 ? round(succeeded / total) : 0,
                conformance: conformanceValues.length > 0 ? round(average(conformanceValues)) : 0,
                feedback: feedbackValues.length > 0 ? round(average(feedbackValues)) : 0,
            };
        });
    }

    async saveReputation(agentId: string, tenantId: string, reputationScores: Record<string, number>, updatedAt: Date): Promise<void> {
        const latest = await this.prisma.agentPerformanceRecord.findFirst({
            where: {
                agentId,
                tenantId,
            },
            orderBy: { periodEnd: "desc" },
        });

        if (latest) {
            await this.prisma.agentPerformanceRecord.update({
                where: { id: latest.id },
                data: {
                    reputationScores,
                    reputationUpdatedAt: updatedAt,
                },
            });
            return;
        }

        const start = startOfUtcDay(updatedAt);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        await this.prisma.agentPerformanceRecord.create({
            data: {
                tenantId,
                agentId,
                periodType: "daily",
                periodStart: start,
                periodEnd: end,
                tasksTotal: 0,
                tasksSucceeded: 0,
                tasksFailed: 0,
                successRate: 0,
                totalTokensUsed: 0,
                totalCostUsd: 0,
                reputationScores,
                reputationUpdatedAt: updatedAt,
            },
        });
    }
}

function mapPerformanceRow(row: any): AgentPerformanceRecordView {
    return {
        agentId: row.agentId,
        periodType: row.periodType,
        periodStart: row.periodStart.toISOString(),
        periodEnd: row.periodEnd.toISOString(),
        tasksTotal: row.tasksTotal,
        tasksSucceeded: row.tasksSucceeded,
        tasksFailed: row.tasksFailed,
        successRate: toNumber(row.successRate),
        avgConformance: row.avgConformance === null ? null : toNumber(row.avgConformance),
        feedbackScore: row.feedbackScore === null ? null : toNumber(row.feedbackScore),
        avgLatencyMs: row.avgLatencyMs,
        totalTokensUsed: row.totalTokensUsed,
        totalCostUsd: toNumber(row.totalCostUsd),
        reputationScores: normalizeReputationScores(row.reputationScores),
        reputationUpdatedAt: row.reputationUpdatedAt?.toISOString() || null,
        metricsSnapshot: row.metricsSnapshot as Record<string, unknown> | null,
    };
}

function normalizeReputationScores(value: unknown): Record<string, number> {
    if (!value || typeof value !== "object") {
        return {};
    }
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, Number(item || 0)]));
}

function toNumber(value: unknown): number {
    if (typeof value === "number") {
        return value;
    }
    if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
        return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value || 0);
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function normalizeFeedback(value: number): number {
    return Math.max(0, Math.min(1, (value + 1) / 2));
}

function toUtcWeekStart(value: Date): Date {
    const day = value.getUTCDay() || 7;
    const diff = day - 1;
    const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
    start.setUTCDate(start.getUTCDate() - diff);
    return start;
}

function startOfUtcDay(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
}

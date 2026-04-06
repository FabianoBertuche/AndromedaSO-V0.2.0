import { BudgetRepository, BudgetReportAggregate } from "../domain/BudgetRepository";
import { AgentBudgetPolicyView, BudgetReportFilters, BudgetSpendInput, UpsertBudgetPolicyInput } from "../domain/BudgetPolicy";

export class PrismaBudgetRepository implements BudgetRepository {
    constructor(private readonly prisma: any) { }

    async getPolicy(tenantId: string, agentId: string): Promise<AgentBudgetPolicyView | null> {
        const policy = await this.prisma.agentBudgetPolicy.findUnique({
            where: {
                tenantId_agentId: {
                    tenantId,
                    agentId,
                },
            },
        });

        return policy ? mapPolicy(policy) : null;
    }

    async upsertPolicy(input: UpsertBudgetPolicyInput): Promise<AgentBudgetPolicyView> {
        const policy = await this.prisma.agentBudgetPolicy.upsert({
            where: {
                tenantId_agentId: {
                    tenantId: input.tenantId,
                    agentId: input.agentId,
                },
            },
            create: {
                tenantId: input.tenantId,
                agentId: input.agentId,
                dailyLimitUsd: input.dailyLimitUsd,
                monthlyLimitUsd: input.monthlyLimitUsd,
                currency: input.currency || "USD",
                alertsEnabled: input.alertsEnabled ?? true,
            },
            update: {
                dailyLimitUsd: input.dailyLimitUsd,
                monthlyLimitUsd: input.monthlyLimitUsd,
                currency: input.currency || "USD",
                alertsEnabled: input.alertsEnabled ?? true,
            },
        });

        return mapPolicy(policy);
    }

    async recordSpend(input: BudgetSpendInput): Promise<void> {
        await this.prisma.$transaction(async (tx: any) => {
            if (input.agentId) {
                const policy = await tx.agentBudgetPolicy.findUnique({
                    where: {
                        tenantId_agentId: {
                            tenantId: input.tenantId,
                            agentId: input.agentId,
                        },
                    },
                });

                if (policy && input.costUsd > 0) {
                    await tx.agentBudgetPolicy.update({
                        where: { id: policy.id },
                        data: {
                            dailySpentUsd: toNumber(policy.dailySpentUsd) + input.costUsd,
                            monthlySpentUsd: toNumber(policy.monthlySpentUsd) + input.costUsd,
                        },
                    });
                }
            }

            await tx.agentExecutionLedger.upsert({
                where: {
                    tenantId_taskId: {
                        tenantId: input.tenantId,
                        taskId: input.taskId,
                    },
                },
                create: {
                    tenantId: input.tenantId,
                    taskId: input.taskId,
                    agentId: input.agentId || "unknown-agent",
                    sessionId: input.sessionId,
                    capability: input.capability,
                    status: input.status,
                    model: input.model,
                    provider: input.provider,
                    promptTokens: input.promptTokens,
                    completionTokens: input.completionTokens,
                    totalTokens: input.totalTokens,
                    latencyMs: input.latencyMs,
                    costUsd: input.costUsd,
                    conformanceScore: input.conformanceScore,
                    feedbackRating: undefined,
                    executionStartedAt: input.executionStartedAt,
                    executionCompletedAt: input.executionCompletedAt,
                    resultSnapshot: input.resultSnapshot,
                    metadata: input.metadata,
                },
                update: {
                    agentId: input.agentId || undefined,
                    sessionId: input.sessionId,
                    capability: input.capability,
                    status: input.status,
                    model: input.model,
                    provider: input.provider,
                    promptTokens: input.promptTokens,
                    completionTokens: input.completionTokens,
                    totalTokens: input.totalTokens,
                    latencyMs: input.latencyMs,
                    costUsd: input.costUsd,
                    conformanceScore: input.conformanceScore,
                    executionStartedAt: input.executionStartedAt,
                    executionCompletedAt: input.executionCompletedAt,
                    resultSnapshot: input.resultSnapshot,
                    metadata: input.metadata,
                },
            });
        });
    }

    async resetDailyBudgets(referenceAt: Date): Promise<number> {
        const result = await this.prisma.agentBudgetPolicy.updateMany({
            where: {
                OR: [
                    { lastDailyResetAt: null },
                    { lastDailyResetAt: { lt: startOfUtcDay(referenceAt) } },
                ],
            },
            data: {
                dailySpentUsd: 0,
                lastDailyResetAt: referenceAt,
            },
        });

        return result.count;
    }

    async report(filters: BudgetReportFilters): Promise<BudgetReportAggregate[]> {
        const ledgerItems = await this.prisma.agentExecutionLedger.findMany({
            where: {
                tenantId: filters.tenantId,
                agentId: filters.agentId,
                executionCompletedAt: {
                    gte: filters.from,
                    lte: filters.to,
                },
            },
            select: {
                agentId: true,
                costUsd: true,
            },
        });

        const grouped = new Map<string, { costUsd: number; executions: number }>();
        for (const item of ledgerItems) {
            const current = grouped.get(item.agentId) || { costUsd: 0, executions: 0 };
            current.costUsd += toNumber(item.costUsd);
            current.executions += 1;
            grouped.set(item.agentId, current);
        }

        const policies = await this.prisma.agentBudgetPolicy.findMany({
            where: {
                tenantId: filters.tenantId,
                ...(filters.agentId ? { agentId: filters.agentId } : {}),
            },
        });

        return [...grouped.entries()].map(([agentId, aggregate]) => {
            const policy = policies.find((candidate: any) => candidate.agentId === agentId);
            const monthlyLimitUsd = policy ? toNumber(policy.monthlyLimitUsd) : null;
            return {
                agentId,
                costUsd: roundCurrency(aggregate.costUsd),
                dailyLimitUsd: policy ? toNumber(policy.dailyLimitUsd) : null,
                monthlyLimitUsd,
                utilizationPct: monthlyLimitUsd && monthlyLimitUsd > 0
                    ? roundPercentage((aggregate.costUsd / monthlyLimitUsd) * 100)
                    : null,
                executions: aggregate.executions,
                currency: policy?.currency || "USD",
            };
        }).sort((left, right) => right.costUsd - left.costUsd);
    }
}

function mapPolicy(policy: any): AgentBudgetPolicyView {
    return {
        agentId: policy.agentId,
        dailyLimitUsd: toNumber(policy.dailyLimitUsd),
        monthlyLimitUsd: toNumber(policy.monthlyLimitUsd),
        dailySpentUsd: toNumber(policy.dailySpentUsd),
        monthlySpentUsd: toNumber(policy.monthlySpentUsd),
        currency: policy.currency,
        alertsEnabled: policy.alertsEnabled,
        lastDailyResetAt: policy.lastDailyResetAt?.toISOString() || null,
        lastMonthlyResetAt: policy.lastMonthlyResetAt?.toISOString() || null,
        updatedAt: policy.updatedAt.toISOString(),
    };
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

function startOfUtcDay(referenceAt: Date): Date {
    return new Date(Date.UTC(
        referenceAt.getUTCFullYear(),
        referenceAt.getUTCMonth(),
        referenceAt.getUTCDate(),
        0,
        0,
        0,
        0,
    ));
}

function roundCurrency(value: number): number {
    return Math.round(value * 10000) / 10000;
}

function roundPercentage(value: number): number {
    return Math.round(value * 100) / 100;
}

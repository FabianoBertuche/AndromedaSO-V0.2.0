import { AgentPerformanceRecordView, PerformanceRepository } from "../../domain/PerformanceRepository";

export class GetAgentPerformanceUseCase {
    constructor(private readonly repository: PerformanceRepository) { }

    async execute(input: { agentId: string; tenantId: string; period?: string; from?: Date; to?: Date; }): Promise<{ agentId: string; period: string; items: AgentPerformanceRecordView[] }> {
        const range = resolveRange(input.period, input.from, input.to);
        const items = await this.repository.listAgentRecords(input.agentId, input.tenantId, {
            from: range.from,
            to: range.to,
            periodType: "daily",
        });

        return {
            agentId: input.agentId,
            period: input.period || "30d",
            items,
        };
    }
}

function resolveRange(period = "30d", from?: Date, to?: Date): { from: Date; to: Date } {
    if (from && to) {
        return { from, to };
    }

    const now = to || new Date();
    const days = period === "90d" ? 90 : period === "7d" ? 7 : 30;
    return {
        from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
        to: now,
    };
}

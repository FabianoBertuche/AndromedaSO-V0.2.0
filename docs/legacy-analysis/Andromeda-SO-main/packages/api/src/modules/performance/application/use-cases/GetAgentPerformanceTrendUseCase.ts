import { PerformanceRepository, PerformanceTrendPoint } from "../../domain/PerformanceRepository";

export class GetAgentPerformanceTrendUseCase {
    constructor(private readonly repository: PerformanceRepository) { }

    async execute(input: { agentId: string; tenantId: string; from?: Date; to?: Date; }): Promise<{ agentId: string; items: PerformanceTrendPoint[] }> {
        const to = input.to || new Date();
        const from = input.from || new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
        const items = await this.repository.listTrend(input.agentId, input.tenantId, { from, to });

        return {
            agentId: input.agentId,
            items,
        };
    }
}

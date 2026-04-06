import { PerformanceRepository } from "../../performance/domain/PerformanceRepository";

export class AgentReputationService {
    constructor(private readonly repository: PerformanceRepository) { }

    async recalculate(agentId: string, tenantId = "default"): Promise<Record<string, number>> {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const metrics = await this.repository.getCapabilityMetrics(agentId, tenantId, since);
        const reputationScores = Object.fromEntries(metrics.map((metric) => [
            metric.capability,
            round(metric.successRate * 0.5 + metric.conformance * 0.3 + metric.feedback * 0.2),
        ]));

        await this.repository.saveReputation(agentId, tenantId, reputationScores, new Date());
        return reputationScores;
    }
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}

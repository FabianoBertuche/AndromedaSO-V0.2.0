import { ConsolidatedAgentMetrics, PerformanceRepository } from "../../domain/PerformanceRepository";

export class PerformanceConsolidationService {
    constructor(private readonly repository: PerformanceRepository) { }

    async consolidateDaily(referenceAt = new Date(), tenantId = "default"): Promise<ConsolidatedAgentMetrics[]> {
        const { periodStart, periodEnd } = resolvePreviousUtcDay(referenceAt);
        const records = await this.repository.consolidateWindow(tenantId, "daily", periodStart, periodEnd);

        for (const record of records) {
            await this.repository.upsertRecord(tenantId, record);
        }

        return records;
    }
}

function resolvePreviousUtcDay(referenceAt: Date): { periodStart: Date; periodEnd: Date } {
    const end = new Date(Date.UTC(
        referenceAt.getUTCFullYear(),
        referenceAt.getUTCMonth(),
        referenceAt.getUTCDate(),
        0, 0, 0, 0,
    ));
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return {
        periodStart: start,
        periodEnd: new Date(end.getTime() - 1),
    };
}

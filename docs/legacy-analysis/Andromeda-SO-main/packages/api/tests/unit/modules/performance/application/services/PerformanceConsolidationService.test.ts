import { describe, expect, it, vi } from "vitest";
import { PerformanceConsolidationService } from "../../../../../../src/modules/performance/application/services/PerformanceConsolidationService";
import { PerformanceRepository } from "../../../../../../src/modules/performance/domain/PerformanceRepository";

describe("PerformanceConsolidationService", () => {
    it("upserts all consolidated daily records", async () => {
        const upsertRecord = vi.fn().mockResolvedValue(undefined);
        const repository: PerformanceRepository = {
            listAgentRecords: async () => [],
            listTrend: async () => [],
            consolidateWindow: async () => [{
                agentId: "agent-1",
                periodType: "daily",
                periodStart: new Date("2026-03-22T00:00:00.000Z"),
                periodEnd: new Date("2026-03-22T23:59:59.999Z"),
                tasksTotal: 10,
                tasksSucceeded: 8,
                tasksFailed: 2,
                successRate: 0.8,
                avgConformance: 0.87,
                feedbackScore: 0.9,
                avgLatencyMs: 3200,
                totalTokensUsed: 1000,
                totalCostUsd: 0.42,
                metricsSnapshot: null,
            }],
            upsertRecord,
            getCapabilityMetrics: async () => [],
            saveReputation: async () => undefined,
        };

        const service = new PerformanceConsolidationService(repository);
        const records = await service.consolidateDaily(new Date("2026-03-23T01:00:00.000Z"));

        expect(records).toHaveLength(1);
        expect(upsertRecord).toHaveBeenCalledWith("default", expect.objectContaining({ agentId: "agent-1" }));
    });
});

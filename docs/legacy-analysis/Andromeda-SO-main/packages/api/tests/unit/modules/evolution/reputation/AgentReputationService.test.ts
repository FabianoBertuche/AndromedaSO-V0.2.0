import { describe, expect, it, vi } from "vitest";
import { AgentReputationService } from "../../../../../src/modules/evolution/reputation/AgentReputationService";
import { PerformanceRepository } from "../../../../../src/modules/performance/domain/PerformanceRepository";

describe("AgentReputationService", () => {
    it("calculates weighted reputation per capability", async () => {
        const saveReputation = vi.fn().mockResolvedValue(undefined);
        const repository: PerformanceRepository = {
            listAgentRecords: async () => [],
            listTrend: async () => [],
            consolidateWindow: async () => [],
            upsertRecord: async () => undefined,
            getCapabilityMetrics: async () => [{
                capability: "research",
                successRate: 0.9,
                conformance: 0.85,
                feedback: 0.92,
            }],
            saveReputation,
        };

        const service = new AgentReputationService(repository);
        const scores = await service.recalculate("researcher", "default");

        expect(scores.research).toBe(0.889);
        expect(saveReputation).toHaveBeenCalledWith("researcher", "default", { research: 0.889 }, expect.any(Date));
    });
});

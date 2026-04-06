import { describe, expect, it } from "vitest";
import { AgentVersioningService } from "../../../../../src/modules/agent-management/application/AgentVersioningService";
import { createDefaultAgentProfile } from "../../../../../src/modules/agent-management/domain/agent-profile";

describe("AgentVersioningService", () => {
    it("records a new version when the snapshot changes", async () => {
        const repository = new InMemoryVersionRepository();
        const service = new AgentVersioningService(repository);
        const profile = createDefaultAgentProfile({
            id: "agent-kernel",
            name: "Kernel",
            role: "Operational orchestrator",
            description: "Coordinates work across the system.",
        });

        const first = await service.recordCurrentVersion(profile, "seed", { tenantId: "default" });
        const second = await service.recordCurrentVersion({
            ...profile,
            description: "Updated profile",
        }, "updated", { tenantId: "default" });

        expect(first.versionNumber).toBe(1);
        expect(second.versionNumber).toBe(2);
    });

    it("does not duplicate the latest identical snapshot", async () => {
        const repository = new InMemoryVersionRepository();
        const service = new AgentVersioningService(repository);
        const profile = createDefaultAgentProfile({
            id: "agent-kernel",
            name: "Kernel",
            role: "Operational orchestrator",
            description: "Coordinates work across the system.",
        });

        await service.recordCurrentVersion(profile, "seed", { tenantId: "default" });
        const duplicate = await service.recordCurrentVersion(profile, "seed again", { tenantId: "default" });

        expect(duplicate.versionNumber).toBe(1);
        expect(repository.items).toHaveLength(1);
    });
});

class InMemoryVersionRepository {
    items: any[] = [];

    async list(agentId: string, tenantId = "default") {
        return this.items
            .filter((item) => item.agentId === agentId && item.tenantId === tenantId)
            .sort((left, right) => right.versionNumber - left.versionNumber);
    }

    async get(agentId: string, versionNumber: number, tenantId = "default") {
        return this.items.find((item) => item.agentId === agentId && item.tenantId === tenantId && item.versionNumber === versionNumber) || null;
    }

    async create(input: any) {
        const next = {
            versionNumber: this.items.filter((item) => item.agentId === input.agentId && item.tenantId === input.tenantId).length + 1,
            sourceVersionLabel: input.sourceVersionLabel,
            changeSummary: input.changeSummary,
            restoredFromVersionNumber: input.restoredFromVersionNumber,
            createdBy: input.createdBy,
            createdAt: new Date().toISOString(),
            snapshot: input.snapshot,
            agentId: input.agentId,
            tenantId: input.tenantId,
        };
        this.items.push(next);
        return next;
    }
}

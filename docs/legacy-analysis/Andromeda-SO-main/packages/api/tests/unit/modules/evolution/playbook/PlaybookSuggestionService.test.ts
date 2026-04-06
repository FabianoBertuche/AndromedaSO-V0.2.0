import { describe, expect, it, vi } from "vitest";
import { PlaybookSuggestionService } from "../../../../../src/modules/evolution/playbook/application/PlaybookSuggestionService";
import { MemoryEntry } from "../../../../../src/modules/memory/domain/memory";

describe("PlaybookSuggestionService", () => {
    it("persists only suggestions with confidence >= 0.7", async () => {
        const createMany = vi.fn(async (_agentId, _tenantId, suggestions) => suggestions);
        const service = new PlaybookSuggestionService(
            {
                listByAgent: async () => [],
                getById: async () => null,
                createMany,
                review: async () => { throw new Error("not implemented"); },
            },
            {
                analyzeEpisodes: async () => [
                    { title: "A", summary: "A", suggestion: "A", confidence: 0.85, sourceEpisodeIds: ["e1"] },
                    { title: "B", summary: "B", suggestion: "B", confidence: 0.65, sourceEpisodeIds: ["e2"] },
                ],
            },
            {
                listMemory: async () => [episode("e1"), episode("e2"), episode("e3")],
            } as any,
            {} as any,
        );

        await service.generateForAgent("agent-1");

        expect(createMany).toHaveBeenCalledWith("agent-1", "default", [expect.objectContaining({ confidence: 0.85 })], expect.any(Map));
    });
});

function episode(id: string): MemoryEntry {
    return {
        id,
        type: "episodic",
        scopeType: "task",
        scopeId: id,
        agentId: "agent-1",
        taskId: id,
        sessionId: null,
        projectId: null,
        userId: null,
        teamId: null,
        title: id,
        content: `content ${id}`,
        summary: `summary ${id}`,
        tags: ["analysis"],
        source: "task.execution",
        sourceEventId: id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
        isPinned: false,
        status: "active",
        importanceScore: 80,
        tenantId: "default",
        metadata: {},
    };
}

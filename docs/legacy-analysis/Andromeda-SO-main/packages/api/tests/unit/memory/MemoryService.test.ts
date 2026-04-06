import { describe, expect, it } from "vitest";
import { InMemoryMemoryRepositoryBundle } from "../../../src/modules/memory/infrastructure/InMemoryMemoryRepository";
import { MemoryService } from "../../../src/modules/memory/application/MemoryService";

describe("MemoryService", () => {
    it("stores session memory and retrieves it for the same execution scope", async () => {
        const repositories = new InMemoryMemoryRepositoryBundle();
        const service = new MemoryService(repositories);

        await service.registerSessionMessageMemory({
            sessionId: "session-1",
            agentId: "agent-1",
            taskId: "task-1",
            title: "Recent session context",
            content: "The user prefers concise answers and wants memory enabled.",
            tags: ["console", "chat"],
        });

        const retrieved = await service.attachMemoryToExecutionContext({
            taskId: "task-2",
            sessionId: "session-1",
            agentId: "agent-1",
            prompt: "Please continue the previous conversation with concise answers.",
            interactionMode: "chat",
            limit: 5,
        });

        expect(retrieved.entries).toHaveLength(1);
        expect(retrieved.entries[0].sessionId).toBe("session-1");
        expect(retrieved.blocks[0]).toContain("Recent session context");

        const usage = await service.getMemoryUsage(retrieved.entries[0].id);
        expect(usage).toHaveLength(1);
        expect(usage[0].taskId).toBe("task-2");
        expect(usage[0].usedInPromptAssembly).toBe(true);
    });

    it("pins and invalidates memories through the public service surface", async () => {
        const service = new MemoryService(new InMemoryMemoryRepositoryBundle());
        const entry = await service.registerSemanticMemory({
            type: "semantic",
            scopeType: "agent",
            scopeId: "agent-1",
            title: "Stable preference",
            content: "Prefer using the memory tab for inspection.",
            source: "manual",
            tags: ["preference"],
        });

        const pinned = await service.pinMemory(entry.id);
        expect(pinned.isPinned).toBe(true);

        const invalidated = await service.invalidateMemory(entry.id);
        expect(invalidated.status).toBe("invalidated");
    });

    it("filters memories by free-text query", async () => {
        const service = new MemoryService(new InMemoryMemoryRepositoryBundle());

        await service.registerSemanticMemory({
            type: "semantic",
            scopeType: "agent",
            scopeId: "agent-1",
            title: "Searchable policy",
            content: "Use short answers when the user asks for summaries.",
            source: "manual",
            tags: ["summary", "concise"],
        });

        await service.registerSemanticMemory({
            type: "semantic",
            scopeType: "agent",
            scopeId: "agent-2",
            title: "Other policy",
            content: "This memory should not match the target term.",
            source: "manual",
        });

        const result = await service.listMemory({ q: "summary" });

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("Searchable policy");
    });
});

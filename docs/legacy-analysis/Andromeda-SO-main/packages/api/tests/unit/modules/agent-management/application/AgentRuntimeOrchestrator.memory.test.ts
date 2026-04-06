import { Task } from "@andromeda/core";
import { describe, expect, it } from "vitest";
import { AgentRuntimeOrchestrator } from "../../../../../src/modules/agent-management/application/AgentRuntimeOrchestrator";
import { createDefaultAgentProfile } from "../../../../../src/modules/agent-management/domain/agent-profile";

describe("AgentRuntimeOrchestrator memory integration", () => {
    it("injects retrieved memory blocks into the execution prompt", async () => {
        const profile = createDefaultAgentProfile({
            id: "agent-1",
            name: "Memory-aware agent",
            role: "assistant",
            description: "Test agent",
            teamId: "team-1",
            category: "test",
            type: "executor",
            defaultModel: "automatic-router",
        });

        const profileService = {
            getActiveProfile: async () => profile,
        } as any;

        const memoryService = {
            attachMemoryToExecutionContext: async () => ({
                entries: [
                    {
                        id: "memory-1",
                        type: "session",
                        scopeType: "session",
                        scopeId: "session-1",
                        title: "Recent preference",
                        content: "Keep replies short.",
                        tags: ["preference"],
                        source: "test",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isPinned: false,
                        status: "active",
                        importanceScore: 90,
                        metadata: {},
                    },
                ],
                blocks: ["[SESSION | score=90.0 | same_session]\nTitle: Recent preference\nSummary: Keep replies short."],
            }),
        } as any;

        const orchestrator = new AgentRuntimeOrchestrator(profileService, undefined, undefined, undefined, memoryService);
        const task = new Task({
            rawRequest: "continue the previous conversation",
            metadata: {
                targetAgentId: "agent-1",
                sessionId: "session-1",
                interactionMode: "chat",
            },
        });

        const prepared = await orchestrator.prepareExecution(task);

        expect(prepared.assembly.systemPrompt).toContain("Memory Layer");
        expect(prepared.assembly.systemPrompt).toContain("Keep replies short.");
    });
});

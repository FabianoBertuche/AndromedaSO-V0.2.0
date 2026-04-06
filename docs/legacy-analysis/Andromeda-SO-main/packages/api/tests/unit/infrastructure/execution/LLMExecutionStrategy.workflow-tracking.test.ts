import { Task } from "@andromeda/core";
import { describe, expect, it, vi } from "vitest";
import { LLMExecutionStrategy } from "../../../../src/infrastructure/execution/LLMExecutionStrategy";

describe("LLMExecutionStrategy workflow tracking", () => {
    it("stores inferred workflow metadata from routing heuristics", async () => {
        const strategy = new LLMExecutionStrategy(
            {
                getDefaultAgent: vi.fn().mockResolvedValue({ getModel: () => "mock-model" }),
                findById: vi.fn().mockResolvedValue(null),
            } as any,
            {
                resolve: vi.fn().mockResolvedValue({
                    activityType: "coding.debug",
                    requiredCapabilities: ["coding"],
                    confidence: 0.7,
                    reasoning: "debug request",
                    source: "heuristic",
                    warnings: [],
                }),
            } as any,
            {
                chat: vi.fn().mockResolvedValue({
                    message: { content: "done" },
                    usage: { prompt_tokens: 10, completion_tokens: 5 },
                }),
                listModels: vi.fn().mockResolvedValue([]),
            } as any,
            {
                prepareExecution: vi.fn().mockResolvedValue({
                    profile: {
                        id: "agent-1",
                        identity: { name: "Agent", role: "Executor" },
                        version: "1.0.0",
                        safeguards: { minOverallConformance: 0, correctiveAction: "warn" },
                    },
                    assembly: { systemPrompt: "system", behaviorSnapshot: {} },
                    precheck: { allowed: true },
                }),
                finalizeExecution: vi.fn().mockReturnValue({
                    content: "done",
                    audit: { overallConformanceScore: 100 },
                    agent: { id: "agent-1", name: "Agent", role: "Executor", version: "1.0.0" },
                }),
            } as any,
            {
                registerExecutionMemory: vi.fn().mockResolvedValue(undefined),
            } as any,
        );

        const task = new Task({
            rawRequest: "please debug this endpoint",
            metadata: {},
        });

        const result = await strategy.execute(task);

        expect(result.success).toBe(true);
        expect(task.getMetadata().routing?.activityType).toBe("coding.debug");
        expect(task.getMetadata().routing?.inferredWorkflow).toBe("debug");
        expect(task.getMetadata().execution?.workflowName).toBe("debug");
    });
});

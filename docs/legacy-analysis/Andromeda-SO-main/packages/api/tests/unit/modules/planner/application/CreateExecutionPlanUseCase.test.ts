import { describe, expect, it, vi } from "vitest";
import { CreateExecutionPlanUseCase } from "../../../../../src/modules/planner/application/use-cases/CreateExecutionPlanUseCase";
import { MaxStepsExceededError, PlanCreationError } from "../../../../../src/modules/planner/domain/errors";

describe("CreateExecutionPlanUseCase", () => {
    it("creates a plan with structured steps", async () => {
        const planRepo = {
            create: vi.fn(async (input: any) => input),
        };
        const stepRepo = {
            createMany: vi.fn(async (steps: any[]) => steps),
        };
        const auditService = { log: vi.fn(async () => undefined) };
        const useCase = new CreateExecutionPlanUseCase(
            planRepo as any,
            stepRepo as any,
            { findByTenant: vi.fn(async () => [{ id: "backend-specialist", name: "Backend", capabilities: ["api"] }]) } as any,
            { complete: vi.fn(async () => ({ content: JSON.stringify({
                title: "Planner Report",
                description: "Breakdown",
                requiresApproval: false,
                steps: [
                    { stepIndex: 1, title: "Inspect", description: "Inspect repo", agentId: "backend-specialist", dependsOn: [], canRunParallel: true, requiresApproval: false, continuationInstructions: "Inspect", expectedOutputFormat: "text" },
                    { stepIndex: 2, title: "Write", description: "Write report", agentId: "writer", dependsOn: ["1"], canRunParallel: false, requiresApproval: false, continuationInstructions: "Write", expectedOutputFormat: "markdown" },
                ],
            }) })) } as any,
            auditService as any,
        );

        const result = await useCase.execute({
            taskId: "task-1",
            goal: "Analyze repo and write report",
            tenantId: "default",
            requestedBy: "user-1",
        });

        expect(result.plan.totalSteps).toBe(2);
        expect(result.steps).toHaveLength(2);
        expect(result.steps[1]?.dependsOn).toHaveLength(1);
        expect(result.steps[1]?.dependsOn[0]).toBe(result.steps[0]?.id);
        expect(auditService.log).toHaveBeenCalledWith("plan.created", result.plan.id, "user-1", expect.any(Object));
    });

    it("throws when no agents are available", async () => {
        const useCase = new CreateExecutionPlanUseCase(
            {} as any,
            {} as any,
            { findByTenant: vi.fn(async () => []) } as any,
            {} as any,
            {} as any,
        );

        await expect(useCase.execute({
            taskId: "task-1",
            goal: "Analyze repo",
            tenantId: "default",
            requestedBy: "user-1",
        })).rejects.toThrow(PlanCreationError);
    });

    it("throws when llm returns invalid json", async () => {
        const useCase = new CreateExecutionPlanUseCase(
            {} as any,
            {} as any,
            { findByTenant: vi.fn(async () => [{ id: "agent-1", name: "Agent", capabilities: [] }]) } as any,
            { complete: vi.fn(async () => ({ content: "not-json" })) } as any,
            {} as any,
        );

        await expect(useCase.execute({
            taskId: "task-1",
            goal: "Analyze repo",
            tenantId: "default",
            requestedBy: "user-1",
        })).rejects.toThrow(PlanCreationError);
    });

    it("throws when max step count is exceeded", async () => {
        const previous = process.env.PLANNER_MAX_STEPS;
        process.env.PLANNER_MAX_STEPS = "1";

        const useCase = new CreateExecutionPlanUseCase(
            {} as any,
            {} as any,
            { findByTenant: vi.fn(async () => [{ id: "agent-1", name: "Agent", capabilities: [] }]) } as any,
            { complete: vi.fn(async () => ({ content: JSON.stringify({
                title: "Plan",
                requiresApproval: false,
                steps: [
                    { stepIndex: 1, title: "One", agentId: "agent-1", dependsOn: [] },
                    { stepIndex: 2, title: "Two", agentId: "agent-1", dependsOn: [] },
                ],
            }) })) } as any,
            {} as any,
        );

        await expect(useCase.execute({
            taskId: "task-1",
            goal: "Analyze repo",
            tenantId: "default",
            requestedBy: "user-1",
        })).rejects.toThrow(MaxStepsExceededError);

        process.env.PLANNER_MAX_STEPS = previous;
    });
});

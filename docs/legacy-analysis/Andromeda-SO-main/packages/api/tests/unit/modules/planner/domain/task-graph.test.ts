import { describe, expect, it } from "vitest";
import { CyclicDependencyError } from "../../../../../src/modules/planner/domain/errors";
import { PlanStep, createPlanStep } from "../../../../../src/modules/planner/domain/plan-step";
import { TaskGraph } from "../../../../../src/modules/planner/domain/task-graph";

describe("TaskGraph", () => {
    it("getReadySteps returns only steps with satisfied dependencies", () => {
        const graph = new TaskGraph([
            buildStep({ id: "step-a", stepIndex: 0, status: "completed" }),
            buildStep({ id: "step-b", stepIndex: 1, dependsOn: ["step-a"] }),
            buildStep({ id: "step-c", stepIndex: 2, dependsOn: ["step-b"] }),
            buildStep({ id: "step-d", stepIndex: 3, status: "running" }),
        ]);

        expect(graph.getReadySteps().map((step) => step.id)).toEqual(["step-b"]);
    });

    it("validateNoCycles throws CyclicDependencyError", () => {
        const graph = new TaskGraph([
            buildStep({ id: "step-a", stepIndex: 0, dependsOn: ["step-c"] }),
            buildStep({ id: "step-b", stepIndex: 1, dependsOn: ["step-a"] }),
            buildStep({ id: "step-c", stepIndex: 2, dependsOn: ["step-b"] }),
        ]);

        expect(() => graph.validateNoCycles()).toThrowError(CyclicDependencyError);
    });

    it("getParallelGroups separates parallel and sequential steps", () => {
        const graph = new TaskGraph([
            buildStep({ id: "step-a", stepIndex: 0, canRunParallel: true }),
            buildStep({ id: "step-b", stepIndex: 1, canRunParallel: false }),
            buildStep({ id: "step-c", stepIndex: 2, dependsOn: ["step-a"] }),
        ]);

        const [parallel, sequential] = graph.getParallelGroups();

        expect(parallel.map((step) => step.id)).toEqual(["step-a"]);
        expect(sequential.map((step) => step.id)).toEqual(["step-b"]);
    });

    it("isDeadlocked returns true when no step can advance", () => {
        const graph = new TaskGraph([
            buildStep({ id: "step-a", stepIndex: 0, status: "failed" }),
            buildStep({ id: "step-b", stepIndex: 1, status: "waiting_dependency", dependsOn: ["step-a"] }),
        ]);

        expect(graph.isDeadlocked()).toBe(true);
    });

    it("isDeadlocked returns false when all steps are completed", () => {
        const graph = new TaskGraph([
            buildStep({ id: "step-a", stepIndex: 0, status: "completed" }),
            buildStep({ id: "step-b", stepIndex: 1, status: "completed", dependsOn: ["step-a"] }),
        ]);

        expect(graph.isDeadlocked()).toBe(false);
    });
});

function buildStep(overrides: Partial<PlanStep> & Pick<PlanStep, "id" | "stepIndex">): PlanStep {
    return createPlanStep({
        id: overrides.id,
        tenantId: overrides.tenantId || "default",
        planId: overrides.planId || "plan-1",
        stepIndex: overrides.stepIndex,
        title: overrides.title || overrides.id,
        description: overrides.description || undefined,
        agentId: overrides.agentId || "backend-specialist",
        skillId: overrides.skillId || undefined,
        status: overrides.status || "pending",
        input: overrides.input || undefined,
        output: overrides.output || undefined,
        errorMessage: overrides.errorMessage || undefined,
        dependsOn: overrides.dependsOn || [],
        canRunParallel: overrides.canRunParallel ?? false,
        requiresApproval: overrides.requiresApproval ?? false,
        approvedBy: overrides.approvedBy || undefined,
        approvedAt: overrides.approvedAt || undefined,
        continuationInstructions: overrides.continuationInstructions || undefined,
        expectedOutputFormat: overrides.expectedOutputFormat || undefined,
        startedAt: overrides.startedAt || undefined,
        completedAt: overrides.completedAt || undefined,
        failedAt: overrides.failedAt || undefined,
        retryCount: overrides.retryCount ?? 0,
        maxRetries: overrides.maxRetries ?? 2,
        deletedAt: overrides.deletedAt || undefined,
        createdAt: overrides.createdAt || new Date("2026-03-24T00:00:00.000Z"),
        updatedAt: overrides.updatedAt || new Date("2026-03-24T00:00:00.000Z"),
    });
}

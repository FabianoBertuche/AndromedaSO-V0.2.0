import { describe, expect, it, vi } from "vitest";
import { ExecutePlanUseCase } from "../../../../../src/modules/planner/application/use-cases/ExecutePlanUseCase";
import { PlanDeadlockError, PlanStepNotFoundError } from "../../../../../src/modules/planner/domain/errors";

describe("ExecutePlanUseCase", () => {
    it("throws PlanStepNotFoundError when plan does not exist", async () => {
        const planRepo = {
            findById: vi.fn(async () => null),
        };
        const stepRepo = {} as any;
        const queue = {} as any;
        const eventEmitter = { emit: vi.fn() };
        const useCase = new ExecutePlanUseCase(planRepo as any, stepRepo, queue as any, eventEmitter as any);

        await expect(useCase.execute({ planId: "plan-1", tenantId: "default" }))
            .rejects.toThrow(PlanStepNotFoundError);
    });

    it("marks plan as running and emits started event", async () => {
        const planUpdateStatus = vi.fn(async () => undefined);
        const stepUpdateStatus = vi.fn(async () => undefined);
        const planRepo = {
            findById: vi.fn(async () => ({ id: "plan-1", status: "pending" })),
            updateStatus: planUpdateStatus,
        };
        const stepRepo = {
            findByPlanId: vi.fn(async () => [
                { id: "step-1", status: "completed", requiresApproval: false, approvedAt: null, dependsOn: [] },
            ]),
            findById: vi.fn(async () => ({ id: "step-1", status: "completed" })),
            updateStatus: stepUpdateStatus,
        };
        const queue = { add: vi.fn(async () => undefined) };
        const eventEmitter = { emit: vi.fn() };
        const useCase = new ExecutePlanUseCase(planRepo as any, stepRepo as any, queue as any, eventEmitter as any);

        await useCase.execute({ planId: "plan-1", tenantId: "default" });

        expect(planUpdateStatus).toHaveBeenCalledWith("plan-1", "running");
        expect(eventEmitter.emit).toHaveBeenCalledWith("plan.started", { planId: "plan-1", tenantId: "default" });
    });

    it("detects deadlock when no steps can advance due to cyclic dependency", async () => {
        const planUpdateStatus = vi.fn(async () => undefined);
        const planRepo = {
            findById: vi.fn(async () => ({ id: "plan-1", status: "pending" })),
            updateStatus: planUpdateStatus,
        };
        const stepRepo = {
            findByPlanId: vi.fn()
                .mockResolvedValueOnce([
                    { id: "step-1", status: "pending", dependsOn: ["step-2"] },
                    { id: "step-2", status: "failed", dependsOn: ["step-1"] },
                ]),
            findById: vi.fn(async () => ({ id: "step-1", status: "pending" })),
            updateStatus: vi.fn(async () => undefined),
        };
        const queue = { add: vi.fn(async () => undefined) };
        const eventEmitter = { emit: vi.fn() };
        const useCase = new ExecutePlanUseCase(planRepo as any, stepRepo as any, queue as any, eventEmitter as any);

        await expect(useCase.execute({ planId: "plan-1", tenantId: "default" }))
            .rejects.toThrow(PlanDeadlockError);

        expect(planUpdateStatus).toHaveBeenCalledWith("plan-1", "failed");
        expect(eventEmitter.emit).toHaveBeenCalledWith("plan.deadlock_detected", { planId: "plan-1" });
    });

    it("dispatches parallel steps up to max limit", async () => {
        const planUpdateStatus = vi.fn(async () => undefined);
        const planRepo = {
            findById: vi.fn(async () => ({ id: "plan-1", status: "pending" })),
            updateStatus: planUpdateStatus,
        };
        let s1 = { id: "s1", status: "pending", requiresApproval: false, approvedAt: null, dependsOn: [], canRunParallel: true };
        let s2 = { id: "s2", status: "pending", requiresApproval: false, approvedAt: null, dependsOn: [], canRunParallel: true };
        const stepRepo = {
            findByPlanId: vi.fn(async () => {
                if (s1.status === "pending" || s2.status === "pending") return [s1, s2];
                return [{ ...s1, status: "completed" }, { ...s2, status: "completed" }];
            }),
            findById: vi.fn(async () => ({ id: "s1", status: "completed" })),
            updateStatus: vi.fn(async (id: string, status: string) => {
                if (id === "s1") s1 = { ...s1, status };
                if (id === "s2") s2 = { ...s2, status };
            }),
        };
        const queue = { add: vi.fn(async () => undefined) };
        const eventEmitter = { emit: vi.fn() };
        const useCase = new ExecutePlanUseCase(planRepo as any, stepRepo as any, queue as any, eventEmitter as any);

        await useCase.execute({ planId: "plan-1", tenantId: "default" });

        expect(queue.add).toHaveBeenCalledWith("execute-plan-step", { planId: "plan-1", stepId: "s1", tenantId: "default" });
        expect(queue.add).toHaveBeenCalledWith("execute-plan-step", { planId: "plan-1", stepId: "s2", tenantId: "default" });
    });
});
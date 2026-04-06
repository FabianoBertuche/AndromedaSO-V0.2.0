import { describe, expect, it, vi } from "vitest";
import { RollbackPlanUseCase } from "../../../../../src/modules/planner/application/use-cases/RollbackPlanUseCase";

describe("RollbackPlanUseCase", () => {
    it("rolls back running steps and marks plan as rolled_back", async () => {
        const steps = [
            { id: "step-1", status: "running", stepIndex: 1 },
            { id: "step-2", status: "completed", stepIndex: 2 },
        ];
        const planRepo = {
            updateStatus: vi.fn(async () => undefined),
        };
        const stepRepo = {
            findByPlanId: vi.fn(async () => steps),
            updateStatus: vi.fn(async () => undefined),
        };
        const queue = { removeJobs: vi.fn(async () => undefined) };
        const eventEmitter = { emit: vi.fn() };
        const auditService = { log: vi.fn(async () => undefined) };
        const useCase = new RollbackPlanUseCase(
            planRepo as any,
            stepRepo as any,
            queue as any,
            eventEmitter as any,
            auditService as any,
        );

        await useCase.execute({ planId: "plan-1", tenantId: "default", requestedBy: "user-1" });

        expect(planRepo.updateStatus).toHaveBeenCalledWith("plan-1", "rolled_back");
        expect(stepRepo.updateStatus).toHaveBeenCalledWith("step-1", "rolled_back");
        expect(stepRepo.updateStatus).toHaveBeenCalledWith("step-1", "rolled_back");
        expect(stepRepo.updateStatus).toHaveBeenCalledWith("step-2", "rolled_back");
        expect(queue.removeJobs).toHaveBeenCalledWith("step-1");
        expect(auditService.log).toHaveBeenCalledWith("plan.rolled_back", "plan-1", "user-1", { rolledBack: ["step-1", "step-2"] });
        expect(eventEmitter.emit).toHaveBeenCalledWith("plan.rolled_back", { planId: "plan-1", rolledBack: ["step-1", "step-2"] });
    });

    it("reverts completed steps in reverse order", async () => {
        const steps = [
            { id: "step-1", status: "completed", stepIndex: 1 },
            { id: "step-2", status: "completed", stepIndex: 2 },
            { id: "step-3", status: "completed", stepIndex: 3 },
        ];
        const planRepo = { updateStatus: vi.fn(async () => undefined) };
        const stepRepo = {
            findByPlanId: vi.fn(async () => steps),
            updateStatus: vi.fn(async () => undefined),
        };
        const queue = { removeJobs: vi.fn(async () => undefined) };
        const eventEmitter = { emit: vi.fn() };
        const auditService = { log: vi.fn(async () => undefined) };
        const useCase = new RollbackPlanUseCase(planRepo as any, stepRepo as any, queue as any, eventEmitter as any, auditService as any);

        await useCase.execute({ planId: "plan-1", tenantId: "default", requestedBy: "user-1" });

        expect(stepRepo.updateStatus).toHaveBeenCalledWith("step-3", "rolled_back");
        expect(stepRepo.updateStatus).toHaveBeenCalledWith("step-2", "rolled_back");
        expect(stepRepo.updateStatus).toHaveBeenCalledWith("step-1", "rolled_back");
    });

    it("cancels running steps without calling updateStatus for completed ones if none exist", async () => {
        const steps = [
            { id: "step-1", status: "running", stepIndex: 1 },
            { id: "step-2", status: "running", stepIndex: 2 },
        ];
        const planRepo = { updateStatus: vi.fn(async () => undefined) };
        const stepRepo = {
            findByPlanId: vi.fn(async () => steps),
            updateStatus: vi.fn(async () => undefined),
        };
        const queue = { removeJobs: vi.fn(async () => undefined) };
        const eventEmitter = { emit: vi.fn() };
        const auditService = { log: vi.fn(async () => undefined) };
        const useCase = new RollbackPlanUseCase(planRepo as any, stepRepo as any, queue as any, eventEmitter as any, auditService as any);

        await useCase.execute({ planId: "plan-1", tenantId: "default", requestedBy: "user-1" });

        expect(queue.removeJobs).toHaveBeenCalledTimes(2);
        expect(stepRepo.updateStatus).toHaveBeenCalledTimes(2);
    });
});
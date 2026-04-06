import { IPlanStepRepository } from "../../domain/ports";
import { emitPlanEvent } from "../../infrastructure/PlannerEventEmitter";
import { PlannerAuditService } from "../../infrastructure/PlannerAuditService";

export interface ApprovePlanStepInput {
    planId: string;
    stepId: string;
    tenantId: string;
    approvedBy: string;
}

export class ApprovePlanStepUseCase {
    constructor(
        private readonly stepRepo: IPlanStepRepository,
        private readonly auditService: PlannerAuditService,
    ) { }

    async execute(input: ApprovePlanStepInput): Promise<void> {
        const { planId, stepId, tenantId, approvedBy } = input;

        const step = await this.stepRepo.findById(stepId, tenantId);
        if (!step) {
            throw new Error(`Step ${stepId} not found`);
        }

        if (step.status !== "waiting_approval") {
            throw new Error(`Step ${stepId} is not waiting for approval`);
        }

        await this.stepRepo.update(stepId, {
            approvedBy,
            approvedAt: new Date(),
            status: "pending",
        });

        await this.auditService.log("plan.step.approved", stepId, approvedBy, { planId, stepId });
        emitPlanEvent("plan.step.approved", { planId, stepId, approvedBy });
    }
}

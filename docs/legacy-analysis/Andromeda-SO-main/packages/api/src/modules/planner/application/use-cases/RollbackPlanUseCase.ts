import { IExecutionPlanRepository, IPlanStepRepository, IPlannerQueue, IPlanEventEmitter, IAuditService } from "../../domain/ports";

export class RollbackPlanUseCase {
    constructor(
        private readonly planRepo: IExecutionPlanRepository,
        private readonly stepRepo: IPlanStepRepository,
        private readonly queue: IPlannerQueue,
        private readonly eventEmitter: IPlanEventEmitter,
        private readonly auditService: IAuditService,
    ) { }

    async execute(input: { planId: string; tenantId: string; requestedBy: string }): Promise<void> {
        const { planId, tenantId, requestedBy } = input;

        const steps = await this.stepRepo.findByPlanId(planId, tenantId);

        const rolledBack: string[] = [];

        for (const step of steps.filter(s => s.status === "running")) {
            await this.queue.removeJobs(step.id);
            await this.stepRepo.updateStatus(step.id, "rolled_back");
            rolledBack.push(step.id);
        }

        const completed = steps
            .filter(s => s.status === "completed")
            .sort((a, b) => (b.stepIndex ?? 0) - (a.stepIndex ?? 0));

        for (const step of completed) {
            await this.stepRepo.updateStatus(step.id, "rolled_back");
            rolledBack.push(step.id);
        }

        await this.planRepo.updateStatus(planId, "rolled_back");
        await this.auditService.log("plan.rolled_back", planId, requestedBy, { rolledBack });
        this.eventEmitter.emit("plan.rolled_back", { planId, rolledBack });
    }
}
import { IExecutionPlanRepository, IPlanStepRepository } from "../../domain/ports";

export class GetPlanUseCase {
    constructor(
        private readonly planRepo: IExecutionPlanRepository,
        private readonly stepRepo: IPlanStepRepository,
    ) { }

    async execute(input: { planId: string; tenantId: string }): Promise<{ plan: Awaited<ReturnType<IExecutionPlanRepository["findById"]>>; steps: Awaited<ReturnType<IPlanStepRepository["findByPlanId"]>> }> {
        const plan = await this.planRepo.findById(input.planId, input.tenantId);
        if (!plan) {
            throw new Error(`Plan ${input.planId} not found`);
        }
        const steps = await this.stepRepo.findByPlanId(input.planId, input.tenantId);
        return { plan, steps };
    }
}
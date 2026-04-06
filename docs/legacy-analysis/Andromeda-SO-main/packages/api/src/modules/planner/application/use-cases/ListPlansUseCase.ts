import { IExecutionPlanRepository } from "../../domain/ports";

export class ListPlansUseCase {
    constructor(private readonly planRepo: IExecutionPlanRepository) { }

    async execute(tenantId: string) {
        return this.planRepo.findByTenant(tenantId);
    }
}
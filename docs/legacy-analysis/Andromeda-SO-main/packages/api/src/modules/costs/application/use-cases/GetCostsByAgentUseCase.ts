import { CostsByAgentView, CostsFilters, CostsRepository } from "../../domain/CostsRepository";

export class GetCostsByAgentUseCase {
    constructor(private readonly repository: CostsRepository) { }

    async execute(filters: CostsFilters): Promise<CostsByAgentView> {
        return this.repository.getByAgent(filters);
    }
}

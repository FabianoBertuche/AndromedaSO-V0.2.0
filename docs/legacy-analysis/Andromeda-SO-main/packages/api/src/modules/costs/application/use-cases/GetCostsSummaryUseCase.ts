import { CostsFilters, CostsRepository, CostsSummaryView } from "../../domain/CostsRepository";

export class GetCostsSummaryUseCase {
    constructor(private readonly repository: CostsRepository) { }

    async execute(filters: CostsFilters): Promise<CostsSummaryView> {
        return this.repository.getSummary(filters);
    }
}

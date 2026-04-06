import { CostsFilters, CostsRepository } from "../../domain/CostsRepository";

export class ExportCostsCsvUseCase {
    constructor(private readonly repository: CostsRepository) { }

    async execute(filters: CostsFilters & { groupBy: "agent" | "day" }): Promise<string> {
        return this.repository.exportCsv(filters);
    }
}

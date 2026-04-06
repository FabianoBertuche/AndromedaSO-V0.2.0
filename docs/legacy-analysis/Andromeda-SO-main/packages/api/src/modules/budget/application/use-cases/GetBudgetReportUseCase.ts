import { BudgetReportFilters, BudgetReportView } from "../../domain/BudgetPolicy";
import { BudgetRepository } from "../../domain/BudgetRepository";

export class GetBudgetReportUseCase {
    constructor(private readonly repository: BudgetRepository) { }

    async execute(filters: BudgetReportFilters): Promise<BudgetReportView> {
        const items = await this.repository.report(filters);
        const totalCostUsd = items.reduce((sum, item) => sum + item.costUsd, 0);
        const totalExecutions = items.reduce((sum, item) => sum + item.executions, 0);

        return {
            range: {
                from: filters.from.toISOString(),
                to: filters.to.toISOString(),
            },
            currency: items[0]?.currency || "USD",
            totals: {
                costUsd: roundCurrency(totalCostUsd),
                agents: items.length,
                executions: totalExecutions,
            },
            items: items.map(({ currency: _currency, ...item }) => item),
        };
    }
}

function roundCurrency(value: number): number {
    return Math.round(value * 10000) / 10000;
}

import { BudgetRepository } from "../../domain/BudgetRepository";

export class ResetDailyBudgetUseCase {
    constructor(private readonly repository: BudgetRepository) { }

    async execute(referenceAt = new Date()): Promise<number> {
        return this.repository.resetDailyBudgets(referenceAt);
    }
}

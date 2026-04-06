import { BudgetSpendInput } from "../../domain/BudgetPolicy";
import { BudgetRepository } from "../../domain/BudgetRepository";

export class RecordSpendUseCase {
    constructor(private readonly repository: BudgetRepository) { }

    async execute(input: BudgetSpendInput): Promise<void> {
        await this.repository.recordSpend({
            ...input,
            costUsd: Math.max(0, input.costUsd),
            status: input.status.trim(),
            model: input.model?.trim(),
            provider: input.provider?.trim(),
            capability: input.capability?.trim(),
        });
    }
}

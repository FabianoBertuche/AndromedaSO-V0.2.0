import { BudgetGuardInput } from "../../domain/BudgetPolicy";
import { BudgetRepository } from "../../domain/BudgetRepository";
import { BudgetExceededError } from "../../domain/errors/BudgetExceededError";

export class CheckBudgetBeforeExecutionUseCase {
    constructor(private readonly repository: BudgetRepository) { }

    async execute(input: BudgetGuardInput): Promise<void> {
        if (!input.agentId || input.estimatedCostUsd <= 0) {
            return;
        }

        const policy = await this.repository.getPolicy(input.tenantId, input.agentId);
        if (!policy) {
            return;
        }

        if (policy.dailySpentUsd + input.estimatedCostUsd > policy.dailyLimitUsd) {
            throw new BudgetExceededError(
                input.agentId,
                "daily",
                policy.dailyLimitUsd,
                policy.dailySpentUsd,
                input.estimatedCostUsd,
            );
        }

        if (policy.monthlySpentUsd + input.estimatedCostUsd > policy.monthlyLimitUsd) {
            throw new BudgetExceededError(
                input.agentId,
                "monthly",
                policy.monthlyLimitUsd,
                policy.monthlySpentUsd,
                input.estimatedCostUsd,
            );
        }
    }
}

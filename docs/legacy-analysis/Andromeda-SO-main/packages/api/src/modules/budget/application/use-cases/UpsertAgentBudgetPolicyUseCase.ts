import { AgentBudgetPolicyView, UpsertBudgetPolicyInput } from "../../domain/BudgetPolicy";
import { BudgetRepository } from "../../domain/BudgetRepository";

export class UpsertAgentBudgetPolicyUseCase {
    constructor(private readonly repository: BudgetRepository) { }

    async execute(input: UpsertBudgetPolicyInput): Promise<AgentBudgetPolicyView> {
        if (!input.agentId.trim()) {
            throw new Error("agentId is required");
        }
        if (input.dailyLimitUsd < 0 || input.monthlyLimitUsd < 0) {
            throw new Error("Budget limits must be non-negative");
        }
        if (input.monthlyLimitUsd < input.dailyLimitUsd) {
            throw new Error("Monthly budget must be greater than or equal to daily budget");
        }

        return this.repository.upsertPolicy({
            ...input,
            currency: (input.currency || "USD").trim().toUpperCase(),
            alertsEnabled: input.alertsEnabled ?? true,
        });
    }
}

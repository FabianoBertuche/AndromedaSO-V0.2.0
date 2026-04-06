import { describe, expect, it } from "vitest";
import { CheckBudgetBeforeExecutionUseCase } from "../../../../../../src/modules/budget/application/use-cases/CheckBudgetBeforeExecutionUseCase";
import { BudgetRepository } from "../../../../../../src/modules/budget/domain/BudgetRepository";
import { AgentBudgetPolicyView } from "../../../../../../src/modules/budget/domain/BudgetPolicy";
import { BudgetExceededError } from "../../../../../../src/modules/budget/domain/errors/BudgetExceededError";

describe("CheckBudgetBeforeExecutionUseCase", () => {
    it("allows execution when there is no policy", async () => {
        const useCase = new CheckBudgetBeforeExecutionUseCase(createRepository(null));

        await expect(useCase.execute({
            tenantId: "default",
            agentId: "agent-1",
            estimatedCostUsd: 3,
        })).resolves.toBeUndefined();
    });

    it("blocks execution when the daily budget would be exceeded", async () => {
        const useCase = new CheckBudgetBeforeExecutionUseCase(createRepository({
            agentId: "agent-1",
            dailyLimitUsd: 10,
            monthlyLimitUsd: 100,
            dailySpentUsd: 9,
            monthlySpentUsd: 9,
            currency: "USD",
            alertsEnabled: true,
            lastDailyResetAt: null,
            lastMonthlyResetAt: null,
            updatedAt: new Date().toISOString(),
        }));

        await expect(useCase.execute({
            tenantId: "default",
            agentId: "agent-1",
            estimatedCostUsd: 2,
        })).rejects.toBeInstanceOf(BudgetExceededError);
    });
});

function createRepository(policy: AgentBudgetPolicyView | null): BudgetRepository {
    return {
        getPolicy: async () => policy,
        upsertPolicy: async () => {
            throw new Error("not implemented");
        },
        recordSpend: async () => {
            throw new Error("not implemented");
        },
        resetDailyBudgets: async () => 0,
        report: async () => [],
    };
}
